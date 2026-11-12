(function (root, factory) {
    const common = typeof module === 'object' && module.exports;
    const api = factory(common ? require('./arm-geometry') : root.SilverVyArmGeometry,
        common ? require('./fit-engine') : root.SilverVyFit);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.SilverVyGeometry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (arms, fit) {
    'use strict';
    const defaults = {
        crown: { x: .5, y: .04 }, feet: { x: .5, y: .96 }, neck: { x: .5, y: .18 },
        chestLeft: { x: .39, y: .28 }, chestRight: { x: .61, y: .28 },
        waistLeft: { x: .40, y: .40 }, waistRight: { x: .60, y: .40 },
        hipLeft: { x: .37, y: .51 }, hipRight: { x: .63, y: .51 },
        wristLeft: { x: .25, y: .53 }, wristRight: { x: .75, y: .53 },
        shoulderLeft: { x: .37, y: .21 }, shoulderRight: { x: .63, y: .21 },
        elbowLeft: { x: .30, y: .37 }, elbowRight: { x: .70, y: .37 },
        handTipLeft: { x: .23, y: .61 }, handTipRight: { x: .77, y: .61 }
    };
    const labels = {
        crown: 'Макушка', feet: 'Уровень подошв', neck: 'Основание шеи',
        chestLeft: 'Граница груди слева на фото', chestRight: 'Граница груди справа на фото',
        waistLeft: 'Граница талии слева на фото', waistRight: 'Граница талии справа на фото',
        hipLeft: 'Граница бёдер слева на фото', hipRight: 'Граница бёдер справа на фото',
        wristLeft: 'Запястье слева на фото', wristRight: 'Запястье справа на фото',
        shoulderLeft: 'Плечевая точка тела слева', shoulderRight: 'Плечевая точка тела справа',
        elbowLeft: 'Локоть слева на фото', elbowRight: 'Локоть справа на фото',
        handTipLeft: 'Конец среднего пальца слева', handTipRight: 'Конец среднего пальца справа'
    };
    function validate(points, body) {
        if (!Number.isFinite(Number(body?.heightCm)) || Number(body.heightCm) < 120 || Number(body.heightCm) > 220) {
            throw new Error('Для масштаба фото укажите рост 120–220 см в лаборатории.');
        }
        for (const key of Object.keys(defaults)) {
            if (!points?.[key] || !['x', 'y'].every(axis => typeof points[key][axis] === 'number' &&
                Number.isFinite(points[key][axis]) && points[key][axis] >= 0 && points[key][axis] <= 1)) {
                throw new Error('Отметьте все опорные точки в пределах фотографии.');
            }
        }
        const waistY = (points.waistLeft.y + points.waistRight.y) / 2;
        const hipY = (points.hipLeft.y + points.hipRight.y) / 2;
        if (!(points.crown.y + .1 < points.neck.y && points.neck.y < waistY &&
            waistY < hipY && hipY + .1 < points.feet.y &&
            points.chestLeft.y > points.neck.y && points.chestLeft.y < waistY &&
            points.chestRight.y > points.neck.y && points.chestRight.y < waistY &&
            Math.abs(points.chestLeft.y - points.chestRight.y) < .07 &&
            points.chestRight.x - points.chestLeft.x > .06 && points.feet.y - points.crown.y > .5)) {
            throw new Error('Проверьте точки: макушка → шея → грудь → талия → бёдра → подошвы, грудь слева направо на одном уровне.');
        }
        for (const zone of ['waist', 'hip']) {
            if (points[`${zone}Right`].x - points[`${zone}Left`].x < .06 ||
                Math.abs(points[`${zone}Right`].y - points[`${zone}Left`].y) > .07) {
                throw new Error('Отметьте левую и правую границы талии и бёдер на одинаковой высоте.');
            }
        }
        if (points.wristLeft.x >= points.neck.x || points.wristRight.x <= points.neck.x ||
            points.wristLeft.y <= points.neck.y || points.wristRight.y <= points.neck.y) {
            throw new Error('Нужен фронтальный снимок с прямыми, немного отведёнными руками; отметьте запястья по сторонам от тела.');
        }
        for (const key of ['shoulderCm', 'armLengthCm', 'handLengthCm']) {
            if (body[key] !== '' && body[key] != null && (!Number.isFinite(Number(body[key])) ||
                Number(body[key]) < fit.ranges[key][0] || Number(body[key]) > fit.ranges[key][1])) {
                throw new Error('Проверьте диапазоны ширины плеч, длины руки и кисти в лаборатории.');
            }
        }
        for (const side of ['Left', 'Right']) {
            const shoulder = points[`shoulder${side}`], elbow = points[`elbow${side}`];
            const wrist = points[`wrist${side}`], tip = points[`handTip${side}`];
            if (!(shoulder.y > points.neck.y && shoulder.y < elbow.y && elbow.y < wrist.y && wrist.y < tip.y) ||
                (side === 'Left' ? shoulder.x >= points.neck.x : shoulder.x <= points.neck.x)) {
                throw new Error('Для каждой руки отметьте по порядку сверху вниз: плечевая точка тела → локоть → запястье → конец среднего пальца. Не отмечайте шов одежды вместо плеча.');
            }
        }
    }
    function build({ product, garment, body, points, width, height }) {
        validate(points, body);
        if (product.category !== 'tops') throw new Error('Размерная маска IDM-VTON доступна только для верха.');
        if (![width, height].every(n => Number.isInteger(n) && n > 0 && n <= 5000)) throw new Error('Неверный размер фото.');
        if (!['chestCm', 'waistCm', 'hipCm'].every(key => Number(body[key]) > 0)) throw new Error('Нужны обхваты груди, талии и бёдер.');
        const p = Object.fromEntries(Object.entries(points).map(([key, point]) => [key, { x: point.x * width, y: point.y * height }]));
        for (const zone of ['waist', 'hip']) {
            p[zone] = { x: (p[`${zone}Left`].x + p[`${zone}Right`].x) / 2,
                y: (p[`${zone}Left`].y + p[`${zone}Right`].y) / 2 };
        }
        const pxCm = (p.feet.y - p.crown.y) / Number(body.heightCm);
        // Similar-cross-section hypothesis: circumference ratio scales observed frontal breadth.
        // This is an explicit geometric approximation, not a conversion of circumference to true width.
        const chestSpan = p.chestRight.x - p.chestLeft.x;
        const circumScale = chestSpan / Number(body.chestCm);
        const chestY = (p.chestLeft.y + p.chestRight.y) / 2;
        const chestX = (p.chestLeft.x + p.chestRight.x) / 2;
        const neckY = p.neck.y;
        const shoulderHalf = garment.shoulderCm * pxCm / 2;
        const hemY = neckY + garment.lengthCm * pxCm;
        const warnings = [
            'Ширина оценена по отношению обхватов при допущении сходного поперечного сечения; ткань и 3D-драпировка не моделируются.',
            'Рукава и проймы приближённые: обхват рукава и лекала коллекции не заданы.',
            'IDM-VTON может игнорировать небольшую разницу рукавов: расчётные линии манжет не являются измерением сгенерированной одежды.'
        ];
        if (hemY >= p.feet.y || hemY >= height - 2 || shoulderHalf * 2 >= width * .85) {
            throw new Error('Контур не помещается в фото. Проверьте рост, макушку, подошвы и основание шеи.');
        }
        if (!Number.isFinite(garment.sleeveCm) || garment.sleeveCm <= 0) throw new Error('Для размерной примерки нужна длина рукава изделия.');
        const armPlans = ['Left', 'Right'].map(side => arms.trace({ points: p, side, body, garment, pxCm, chestSpan, circumScale }));
        warnings.push(...armPlans.flatMap(plan => plan.warnings));
        const [leftArm, rightArm] = armPlans;
        const shoulderY = Math.max(leftArm.seam.y, rightArm.seam.y);
        const half = key => {
            const zone = key === 'chestCm' ? 'chest' : key === 'waistCm' ? 'waist' : 'hip';
            const observedWidth = p[`${zone}Right`].x - p[`${zone}Left`].x;
            return observedWidth * garment[key] / Number(body[key]) / 2;
        };
        const zones = [
            { x: chestX, y: chestY, half: half('chestCm') },
            { x: p.waist.x, y: p.waist.y, half: half('waistCm') },
            { x: p.hip.x, y: p.hip.y, half: half('hipCm') }
        ];
        function at(y) {
            if (y <= zones[0].y) return zones[0];
            for (let i = 1; i < zones.length; i++) {
                if (y <= zones[i].y) {
                    const t = (y - zones[i - 1].y) / (zones[i].y - zones[i - 1].y);
                    return { x: zones[i - 1].x + (zones[i].x - zones[i - 1].x) * t,
                        half: zones[i - 1].half + (zones[i].half - zones[i - 1].half) * t };
                }
            }
            return zones[2];
        }
        const edges = zones.filter(zone => zone.y > shoulderY && zone.y < hemY);
        edges.push({ ...at(hemY), y: hemY });
        const torso = [
            [p.neck.x - 6 * pxCm, neckY], [p.neck.x + 6 * pxCm, neckY],
            // Bridge the neck to the actual anatomical shoulder before the dropped garment seam.
            // Without this shoulder-cap area, source-shirt fabric can sit outside the generated mask.
            [p.shoulderRight.x, p.shoulderRight.y],
            [rightArm.seam.x, rightArm.seam.y],
            ...edges.map(z => [z.x + z.half, z.y]),
            ...edges.slice().reverse().map(z => [z.x - z.half, z.y]),
            [leftArm.seam.x, leftArm.seam.y],
            [p.shoulderLeft.x, p.shoulderLeft.y]
        ];
        const sleeves = armPlans.map(plan => plan.metadata);
        const target = [torso, ...armPlans.map(plan => plan.target)];
        // Also repaint the existing upper-body clothing, including old long sleeves.
        // Otherwise a short target garment would leave the previous garment visible.
        const originalTorso = [[p.shoulderLeft.x, p.shoulderLeft.y], [p.shoulderRight.x, p.shoulderRight.y],
            [p.hip.x + chestSpan * .56, p.hip.y], [p.hip.x - chestSpan * .56, p.hip.y]];
        const erase = [originalTorso, ...armPlans.map(plan => plan.erase)];
        const polygons = [...erase, ...target];
        if (polygons.some(poly => poly.some(([x, y]) => x < 0 || x > width || y < neckY - 2 * pxCm || y > height))) {
            throw new Error('Маска выходит за кадр. Отодвиньтесь от камеры или исправьте точки.');
        }
        return { width, height, target, polygons, sleeves, armCalibration: 'anatomical-trace-v1', pxPerCm: pxCm, projectedChestPx: garment.chestCm * circumScale,
            hemY, hemClearanceCm: (p.feet.y - hemY) / pxCm, warnings: [...new Set(warnings)], method: 'calibrated-mask-reference-v1' };
    }
    function svg(geometry, preview = false) {
        const paths = geometry.polygons.map(poly => `<polygon points="${poly.map(p=>p.map(n=>n.toFixed(2)).join(',')).join(' ')}"/>`).join('');
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${geometry.width} ${geometry.height}" width="${geometry.width}" height="${geometry.height}">${preview ? '' : '<rect width="100%" height="100%" fill="black"/>'}<g fill="${preview ? '#a76f48' : 'white'}" ${preview ? 'fill-opacity=".36" stroke="#71462b" stroke-width="2"' : ''}>${paths}</g></svg>`;
    }
    return { defaults, labels, validate, build, svg };
});
