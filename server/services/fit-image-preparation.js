const sharp = require('sharp');
const geometry = require('../public/fit-geometry');
const { FitError } = require('./fit-service');
const { gradeSleeves } = require('./sleeve-reference');

const CANVAS = { width: 768, height: 1024 };

function mapPointToCanvas(point, sourceWidth, sourceHeight) {
    const scale = Math.min(CANVAS.width / sourceWidth, CANVAS.height / sourceHeight);
    return {
        x: (CANVAS.width - sourceWidth * scale) / 2 + point.x * scale,
        y: (CANVAS.height - sourceHeight * scale) / 2 + point.y * scale
    };
}

function sampleRgb(data, x, y) {
    x = Math.max(0, Math.min(CANVAS.width - 1, x));
    y = Math.max(0, Math.min(CANVAS.height - 1, y));
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const x1 = Math.min(CANVAS.width - 1, x0 + 1), y1 = Math.min(CANVAS.height - 1, y0 + 1);
    const tx = x - x0, ty = y - y0;
    return [0, 1, 2].map(channel => {
        const at = (px, py) => data[(py * CANVAS.width + px) * 3 + channel];
        const top = at(x0, y0) * (1 - tx) + at(x1, y0) * tx;
        const bottom = at(x0, y1) * (1 - tx) + at(x1, y1) * tx;
        return top * (1 - ty) + bottom * ty;
    });
}

// Extend the visible forearm only inside the garment-edit mask. This is a
// conditioning image for IDM-VTON, not a garment overlay: final pixels outside
// the edit mask are restored from sourcePerson below.
async function extendCoveredArmsForConditioning(personBuffer, maskBuffer, guide, sourceWidth, sourceHeight) {
    const { data, info } = await sharp(personBuffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    if (info.width !== CANVAS.width || info.height !== CANVAS.height || info.channels !== 3) {
        throw new Error('Для временного продолжения руки ожидался RGB-кадр 768 × 1024.');
    }
    const mask = await sharp(maskBuffer).extractChannel(0).raw().toBuffer();
    const output = Buffer.from(data);
    const scale = Math.min(CANVAS.width / sourceWidth, CANVAS.height / sourceHeight);
    const pxPerCm = guide.pxPerCm * scale;
    const conditioned = [];

    for (const sleeve of guide.sleeves) {
        if (sleeve.wristOffsetCm <= 0) continue;
        const wrist = mapPointToCanvas(sleeve.wrist, sourceWidth, sourceHeight);
        const elbow = mapPointToCanvas(sleeve.elbow, sourceWidth, sourceHeight);
        const cuff = mapPointToCanvas(sleeve.cuff, sourceWidth, sourceHeight);
        const extensionX = cuff.x - wrist.x, extensionY = cuff.y - wrist.y;
        const extensionLength = Math.hypot(extensionX, extensionY);
        const donorX = wrist.x - elbow.x, donorY = wrist.y - elbow.y;
        const donorLength = Math.hypot(donorX, donorY);
        if (extensionLength < 2 || donorLength < 2) continue;

        const axis = { x: extensionX / extensionLength, y: extensionY / extensionLength };
        const normal = { x: -axis.y, y: axis.x };
        const donorAxis = { x: donorX / donorLength, y: donorY / donorLength };
        const donorNormal = { x: -donorAxis.y, y: donorAxis.x };
        const startHalf = sleeve.conditioningHalfWidthAtWristPx * scale;
        const endHalf = sleeve.conditioningHalfWidthAtCuffPx * scale;
        const maxHalf = Math.max(startHalf, endHalf);
        if (![startHalf, endHalf, pxPerCm].every(value => Number.isFinite(value) && value > 0)) continue;

        const left = Math.max(0, Math.floor(Math.min(wrist.x, cuff.x) - maxHalf - 1));
        const right = Math.min(CANVAS.width - 1, Math.ceil(Math.max(wrist.x, cuff.x) + maxHalf + 1));
        const top = Math.max(0, Math.floor(Math.min(wrist.y, cuff.y) - maxHalf - 1));
        const bottom = Math.min(CANVAS.height - 1, Math.ceil(Math.max(wrist.y, cuff.y) + maxHalf + 1));
        let changedPixels = 0;

        for (let y = top; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
                const dx = x - wrist.x, dy = y - wrist.y;
                const along = dx * axis.x + dy * axis.y;
                if (along < 0 || along > extensionLength) continue;
                const t = along / extensionLength;
                const halfWidth = startHalf + (endHalf - startHalf) * t;
                const across = dx * normal.x + dy * normal.y;
                const edgeDistance = halfWidth - Math.abs(across);
                if (edgeDistance < 0) continue;
                const pixelIndex = y * CANVAS.width + x;
                if (mask[pixelIndex] < 128) continue;

                // Sample a short, textured strip just above the wrist and carry
                // its appearance through the covered hand. The generated coat
                // should hide this temporary shape; it is never composited as
                // the final result.
                const donorDepth = pxPerCm * (0.35 + 2.65 * t);
                const donorCenter = {
                    x: wrist.x - donorAxis.x * donorDepth,
                    y: wrist.y - donorAxis.y * donorDepth
                };
                const donorHalf = Math.max(2, Math.min(startHalf, endHalf) * 0.72);
                const donorAcross = Math.max(-donorHalf, Math.min(donorHalf, across / halfWidth * donorHalf));
                const sample = sampleRgb(data,
                    donorCenter.x + donorNormal.x * donorAcross,
                    donorCenter.y + donorNormal.y * donorAcross);
                const feather = Math.min(1, edgeDistance / Math.max(1, scale * 1.5));
                const blend = Math.max(0, Math.min(1, feather));
                for (let channel = 0; channel < 3; channel++) {
                    const index = pixelIndex * 3 + channel;
                    output[index] = Math.round(data[index] * (1 - blend) + sample[channel] * blend);
                }
                if (blend > 0.5) changedPixels++;
            }
        }
        if (changedPixels) conditioned.push({
            side: sleeve.side,
            extensionCm: Math.round(sleeve.wristOffsetCm * 10) / 10,
            changedPixels
        });
    }

    return {
        buffer: await sharp(output, { raw: { width: CANVAS.width, height: CANVAS.height, channels: 3 } }).png().toBuffer(),
        conditioned
    };
}

async function prepareSizeInputs(person, garmentBuffer, assessment, calibration) {
    if (assessment.fit.rows.find(row => row.size === assessment.size).checks.some(check => check.easeCm < 0)) {
        throw new FitError(422, 'Изделие выбранного размера меньше тела хотя бы в одной зоне. Для этой неэластичной учебной модели генерация не будет имитировать посадку за счёт уменьшения тела. Выберите другой размер.');
    }
    if (!calibration || calibration.confirmed !== true) {
        throw new FitError(422, 'Сначала проверьте опорные точки фото и подтвердите калибровку размера.');
    }
    const oriented = await sharp(person.buffer, { limitInputPixels: 16000000 }).rotate().png().toBuffer({ resolveWithObject: true });
    let guide;
    try {
        guide = geometry.build({
            product: assessment.product, garment: assessment.garment, body: assessment.measurements,
            points: calibration.points, width: oriented.info.width, height: oriented.info.height
        });
    } catch (error) {
        throw new FitError(422, error.message);
    }
    const normalizedPerson = await sharp(oriented.data).resize(768, 1024, { fit: 'contain', background: '#f3f1e9' }).png().toBuffer();
    const mask = await sharp(Buffer.from(geometry.svg(guide))).resize(768, 1024, { fit: 'contain', background: '#000000' }).removeAlpha().png().toBuffer();
    const armConditioning = await extendCoveredArmsForConditioning(
        normalizedPerson, mask, guide, oriented.info.width, oriented.info.height
    );
    const base = assessment.product.sizes.find(row => row.size === 'M');
    const scaleX = assessment.garment.chestCm / base.chestCm;
    const scaleY = assessment.garment.lengthCm / base.lengthCm;
    const targetWidth = Math.round(768 * .8 * scaleX);
    const targetHeight = Math.round(1024 * .8 * scaleY);
    if (targetWidth > 768 || targetHeight > 1024) throw new FitError(422, 'Референс выбранного размера не помещается в рабочий кадр.');
    const normalizedReference = await sharp(garmentBuffer).resize(768, 1024, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
    const resizedReference = await sharp(normalizedReference).resize(targetWidth, targetHeight, { fit: 'fill' }).png().toBuffer();
    const reference = await sharp({ create: { width: 768, height: 1024, channels: 3, background: '#ffffff' } })
        .composite([{ input: resizedReference, left: Math.floor((768 - targetWidth) / 2), top: Math.floor((1024 - targetHeight) / 2) }])
        .png().toBuffer();
    const sourceInfo = await sharp(garmentBuffer).metadata();
    const graded = await gradeSleeves(reference, {
        productId: assessment.product.id, sourceWidth: sourceInfo.width, sourceHeight: sourceInfo.height,
        targetWidth, targetHeight, scaleX, scaleY, sleeveRatio: assessment.garment.sleeveCm / base.sleeveCm
    });
    return {
        person: { buffer: armConditioning.buffer, mimeType: 'image/png' },
        sourcePerson: { buffer: normalizedPerson, mimeType: 'image/png' },
        garment: { buffer: graded.buffer, mimeType: 'image/png' }, mask, guide,
        seedPerson: person.buffer, seedGarment: garmentBuffer,
        metadata: {
            method: guide.method, referenceScaleX: scaleX, referenceScaleY: scaleY,
            armCalibration: guide.armCalibration,
            armConditioning: armConditioning.conditioned.length
                ? { method: 'masked-forearm-extension-v1', sides: armConditioning.conditioned }
                : { method: 'not-needed', sides: [] },
            sleeveControl: 'independent-axis-v1', referenceSleeves: graded.transforms,
            sleeves: guide.sleeves,
            projectedChestPx: Math.round(guide.projectedChestPx), pxPerCm: Math.round(guide.pxPerCm * 100) / 100,
            hemClearanceCm: Math.round(guide.hemClearanceCm * 10) / 10,
            measurements: { ...assessment.measurements }, garmentMeasurements: { ...assessment.garment },
            warnings: guide.warnings
        }
    };
}

async function preserveOutsideMask(result, prepared) {
    const info = await sharp(result, { limitInputPixels: 16000000 }).metadata();
    if (info.width !== 768 || info.height !== 1024) throw new Error('IDM-VTON вернула изображение неожиданного разрешения.');
    const alpha = await sharp(prepared.mask).extractChannel(0).raw().toBuffer();
    // removeAlpha must finish before joinChannel: sharp otherwise removes the newly joined mask too.
    const rgb = await sharp(result).removeAlpha().png().toBuffer();
    const foreground = await sharp(rgb).joinChannel(alpha, { raw: { width: 768, height: 1024, channels: 1 } }).png().toBuffer();
    return sharp((prepared.sourcePerson || prepared.person).buffer).composite([{ input: foreground }]).png().toBuffer();
}
module.exports = { prepareSizeInputs, preserveOutsideMask, extendCoveredArmsForConditioning };
