(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.SilverVyGeometry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const defaults = {
        crown: { x: .5, y: .04 }, feet: { x: .5, y: .96 }, neck: { x: .5, y: .18 },
        chestLeft: { x: .39, y: .28 }, chestRight: { x: .61, y: .28 },
        waistLeft: { x: .40, y: .40 }, waistRight: { x: .60, y: .40 },
        hipLeft: { x: .37, y: .51 }, hipRight: { x: .63, y: .51 },
        wristLeft: { x: .25, y: .53 }, wristRight: { x: .75, y: .53 }
    };
    const labels = {
        crown: 'Макушка', feet: 'Уровень подошв', neck: 'Основание шеи',
        chestLeft: 'Граница груди слева на фото', chestRight: 'Граница груди справа на фото',
        waistLeft: 'Граница талии слева на фото', waistRight: 'Граница талии справа на фото',
        hipLeft: 'Граница бёдер слева на фото', hipRight: 'Граница бёдер справа на фото',
        wristLeft: 'Запястье слева на фото', wristRight: 'Запястье справа на фото'
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
        const shoulderY = neckY + 3 * pxCm;
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
            [p.neck.x + shoulderHalf, shoulderY],
            ...edges.map(z => [z.x + z.half, z.y]),
            ...edges.slice().reverse().map(z => [z.x - z.half, z.y]),
            [p.neck.x - shoulderHalf, shoulderY]
        ];
        const sleeves = [];
        if (!Number.isFinite(garment.sleeveCm) || garment.sleeveCm <= 0) throw new Error('Для размерной примерки нужна длина рукава изделия.');
        function sleeve(side, fullArm) {
            const direction = side === 'Left' ? -1 : 1;
            const start = { x: p.neck.x + direction * shoulderHalf, y: shoulderY };
            const wrist = p[`wrist${side}`];
            const dx = wrist.x - start.x, dy = wrist.y - start.y;
            const distance = Math.hypot(dx, dy);
            if (distance < 15 * pxCm) throw new Error('Проверьте запястья: они слишком близко к плечам.');
            const requested = garment.sleeveCm * pxCm;
            const len = fullArm ? distance : requested;
            if (!fullArm && requested > distance) warnings.push('Рукав выходит за запястье: область кисти может попасть в маску и быть изменена моделью. Длина не обрезается искусственно.');
            const ux = dx / distance, uy = dy / distance;
            const topHalf = chestSpan * .16 + Math.max(0, garment.chestCm - Number(body.chestCm)) * circumScale * .06;
            const cuffHalf = topHalf * .65;
            const end = { x: start.x + ux * len, y: start.y + uy * len };
            if (!fullArm) sleeves.push({ side, lengthCm: garment.sleeveCm, projectedLengthPx: len,
                wristOffsetCm: (requested - distance) / pxCm, start, cuff: end, wrist });
            return [[start.x - uy * topHalf, start.y + ux * topHalf],
                [end.x - uy * cuffHalf, end.y + ux * cuffHalf],
                [end.x + uy * cuffHalf, end.y - ux * cuffHalf],
                [start.x + uy * topHalf, start.y - ux * topHalf]];
        }
        const target = [torso, sleeve('Left', false), sleeve('Right', false)];
        // Also repaint the existing upper-body clothing, including old long sleeves.
        // Otherwise a short target garment would leave the previous garment visible.
        const originalTorso = [[p.neck.x - shoulderHalf, shoulderY], [p.neck.x + shoulderHalf, shoulderY],
            [p.hip.x + chestSpan * .56, p.hip.y], [p.hip.x - chestSpan * .56, p.hip.y]];
        const erase = [originalTorso, sleeve('Left', true), sleeve('Right', true)];
        const polygons = [...erase, ...target];
        if (polygons.some(poly => poly.some(([x, y]) => x < 0 || x > width || y < neckY - 2 * pxCm || y > height))) {
            throw new Error('Маска выходит за кадр. Отодвиньтесь от камеры или исправьте точки.');
        }
        return { width, height, target, polygons, sleeves, pxPerCm: pxCm, projectedChestPx: garment.chestCm * circumScale,
            hemY, warnings: [...new Set(warnings)], method: 'calibrated-mask-reference-v1' };
    }
    function svg(geometry, preview = false) {
        const paths = geometry.polygons.map(poly => `<polygon points="${poly.map(p=>p.map(n=>n.toFixed(2)).join(',')).join(' ')}"/>`).join('');
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${geometry.width} ${geometry.height}" width="${geometry.width}" height="${geometry.height}">${preview ? '' : '<rect width="100%" height="100%" fill="black"/>'}<g fill="${preview ? '#a76f48' : 'white'}" ${preview ? 'fill-opacity=".36" stroke="#71462b" stroke-width="2"' : ''}>${paths}</g></svg>`;
    }
    return { defaults, labels, validate, build, svg };
});
