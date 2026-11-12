const sharp = require('sharp');

// Pixel annotations of the six existing educational front images, NOT physical garment measurements.
// Coordinates refer to original image fractions. Right sleeves are mirrored.
const annotations = {
    coat: { root: [.25, .23], cuff: [.15, .58], polygon: [[.22,.20],[.31,.23],[.23,.60],[.07,.59]] },
    bomber: { root: [.24,.35], cuff: [.13,.68], polygon: [[.23,.30],[.31,.35],[.20,.71],[.03,.69]] },
    trench: { root: [.25,.26], cuff: [.19,.59], polygon: [[.21,.23],[.30,.27],[.27,.61],[.10,.60]] },
    denim: { root: [.24,.35], cuff: [.14,.69], polygon: [[.21,.32],[.31,.37],[.23,.73],[.06,.70]] },
    shirt: { root: [.24,.30], cuff: [.11,.695], polygon: [[.23,.27],[.32,.31],[.20,.72],[.04,.71]] },
    linen: { root: [.25,.34], cuff: [.095,.49], polygon: [[.22,.31],[.30,.36],[.20,.535],[.015,.46]] }
};
function inside(x, y, polygon) {
    let yes = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) yes = !yes;
    }
    return yes;
}
function axisMap(point, root, unit, factor) {
    const along = (point[0] - root[0]) * unit[0] + (point[1] - root[1]) * unit[1];
    return [point[0] + (factor - 1) * along * unit[0], point[1] + (factor - 1) * along * unit[1]];
}
function plans({ productId, sourceWidth, sourceHeight, targetWidth, targetHeight, scaleX, scaleY, sleeveRatio }) {
    const annotation = annotations[productId];
    if (!annotation) throw new Error('Нет пиксельной разметки рукавов для предметного референса.');
    if (![sourceWidth, sourceHeight, targetWidth, targetHeight, scaleX, scaleY, sleeveRatio].every(n => Number.isFinite(n) && n > 0)) {
        throw new Error('Некорректные параметры градации рукавов.');
    }
    const contain = Math.min(768 / sourceWidth, 1024 / sourceHeight);
    const offsetX = (768 - sourceWidth * contain) / 2, offsetY = (1024 - sourceHeight * contain) / 2;
    const left = Math.floor((768 - targetWidth) / 2), top = Math.floor((1024 - targetHeight) / 2);
    const canonical = point => [offsetX + point[0] * sourceWidth * contain, offsetY + point[1] * sourceHeight * contain];
    const mapped = point => {
        const p = canonical(point);
        return [left + p[0] * targetWidth / 768, top + p[1] * targetHeight / 1024];
    };
    return ['Left', 'Right'].map(side => {
        const mirror = point => [side === 'Left' ? point[0] : 1 - point[0], point[1]];
        const rootPoint = mirror(annotation.root), cuffPoint = mirror(annotation.cuff);
        const root = mapped(rootPoint), cuff = mapped(cuffPoint);
        const originalRoot = canonical(rootPoint), originalCuff = canonical(cuffPoint);
        const baseLength = Math.hypot(
            (originalCuff[0] - originalRoot[0]) * Math.round(768 * .8) / 768,
            (originalCuff[1] - originalRoot[1]) * Math.round(1024 * .8) / 1024);
        const distance = Math.hypot(cuff[0] - root[0], cuff[1] - root[1]);
        // Remove the global torso transform along the sleeve axis before applying its own size ratio.
        // Use actual rounded raster dimensions, including the rounded M baseline.
        const torsoAxisScale = distance / baseLength;
        const factor = sleeveRatio / torsoAxisScale;
        const unit = [(cuff[0] - root[0]) / distance, (cuff[1] - root[1]) / distance];
        const polygon = annotation.polygon.map(point => mapped(mirror(point)));
        const target = polygon.map(point => axisMap(point, root, unit, factor));
        if (target.some(([x,y]) => x < 0 || x >= 768 || y < 0 || y >= 1024)) throw new Error('Рукав референса выходит за кадр.');
        return { side, root, unit, polygon, target, factor, sleeveRatio, torsoAxisScale,
            backgroundX: Math.round(mapped([side === 'Left' ? 0 : 1, 0])[0]) };
    });
}

async function gradeSleeves(buffer, options) {
    const transforms = plans(options);
    const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    if (info.width !== 768 || info.height !== 1024 || info.channels !== 3) throw new Error('Ожидался RGB-референс 768 × 1024.');
    const output = Buffer.from(data);
    const sample = (x, y, channel) => {
        x = Math.max(0, Math.min(767, x)); y = Math.max(0, Math.min(1023, y));
        const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(767, x0 + 1), y1 = Math.min(1023, y0 + 1);
        const tx = x - x0, ty = y - y0;
        const read = (a, b) => data[(b * 768 + a) * 3 + channel];
        return Math.round((read(x0,y0)*(1-tx)+read(x1,y0)*tx)*(1-ty)+(read(x0,y1)*(1-tx)+read(x1,y1)*tx)*ty);
    };
    for (const plan of transforms) {
        if (Math.abs(plan.factor - 1) < 1e-9) continue;
        const union = [...plan.polygon, ...plan.target];
        const minX = Math.max(0, Math.floor(Math.min(...union.map(p=>p[0]))));
        const maxX = Math.min(767, Math.ceil(Math.max(...union.map(p=>p[0]))));
        const minY = Math.max(0, Math.floor(Math.min(...union.map(p=>p[1]))));
        const maxY = Math.min(1023, Math.ceil(Math.max(...union.map(p=>p[1]))));
        for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
            if (!inside(x,y,plan.polygon) && !inside(x,y,plan.target)) continue;
            const source = axisMap([x,y], plan.root, plan.unit, 1 / plan.factor);
            const inSleeve = inside(source[0],source[1],plan.polygon);
            for (let c = 0; c < 3; c++) output[(y * 768 + x) * 3 + c] = inSleeve
                ? sample(source[0],source[1],c) : sample(plan.backgroundX,y,c);
        }
    }
    return { buffer: await sharp(output, { raw: { width: 768, height: 1024, channels: 3 } }).png().toBuffer(),
        transforms: transforms.map(({side, factor, sleeveRatio, torsoAxisScale}) => ({side, factor, sleeveRatio, torsoAxisScale})) };
}
module.exports = { gradeSleeves, plans };
