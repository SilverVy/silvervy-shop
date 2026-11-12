const sharp = require('sharp');
const geometry = require('../public/fit-geometry');
const { FitError } = require('./fit-service');
const { gradeSleeves } = require('./sleeve-reference');

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
        person: { buffer: normalizedPerson, mimeType: 'image/png' },
        garment: { buffer: graded.buffer, mimeType: 'image/png' }, mask, guide,
        seedPerson: person.buffer, seedGarment: garmentBuffer,
        metadata: {
            method: guide.method, referenceScaleX: scaleX, referenceScaleY: scaleY,
            armCalibration: guide.armCalibration,
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
    return sharp(prepared.person.buffer).composite([{ input: foreground }]).png().toBuffer();
}
module.exports = { prepareSizeInputs, preserveOutsideMask };
