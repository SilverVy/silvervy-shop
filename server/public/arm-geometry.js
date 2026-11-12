(function (root, factory) {
    const fit = typeof module === 'object' && module.exports ? require('./fit-engine') : root.SilverVyFit;
    const api = factory(fit);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.SilverVyArmGeometry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (fit) {
    'use strict';
    const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
    function trace({ points, side, body, garment, pxCm, chestSpan, circumScale }) {
        const shoulder = points[`shoulder${side}`], elbow = points[`elbow${side}`];
        const wrist = points[`wrist${side}`], handTip = points[`handTip${side}`];
        const upperPx = distance(shoulder, elbow), lowerPx = distance(elbow, wrist);
        const handPx = distance(wrist, handTip);
        const photoShoulders = distance(points.shoulderLeft, points.shoulderRight) / pxCm;
        const photoArm = (upperPx + lowerPx) / pxCm, photoHand = handPx / pxCm;
        if (photoArm < 20 || photoArm > 100 || photoHand < 3 || photoHand > 40 || photoShoulders < 15 || photoShoulders > 80) {
            throw new Error('Проверьте плечи, локти, запястья и концы кистей: пропорции относительно роста неправдоподобны.');
        }
        const measured = {
            shoulderCm: Number(body.shoulderCm) || photoShoulders,
            armLengthCm: Number(body.armLengthCm) || photoArm,
            handLengthCm: Number(body.handLengthCm) || photoHand
        };
        const sources = Object.fromEntries(Object.keys(measured).map(key => [key, Number(body[key]) ? 'laboratory' : 'photo-estimate']));
        const assessment = fit.evaluateSleeve(garment, measured);
        const elbowCm = measured.armLengthCm * upperPx / (upperPx + lowerPx);
        function interpolate(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
        function at(cm) {
            if (cm < 0) return interpolate(shoulder, points.neck, -cm / (measured.shoulderCm / 2));
            if (cm <= elbowCm) return interpolate(shoulder, elbow, cm / elbowCm);
            if (cm <= measured.armLengthCm) return interpolate(elbow, wrist, (cm - elbowCm) / (measured.armLengthCm - elbowCm));
            return interpolate(wrist, handTip, (cm - measured.armLengthCm) / measured.handLengthCm);
        }
        function nodesBetween(start, end) {
            return [start, ...[0, elbowCm, measured.armLengthCm].filter(cm => cm > start && cm < end), end]
                .map(cm => ({ cm, point: at(cm) }));
        }
        function ribbon(start, end, rootHalf, cuffHalf) {
            const nodes = nodesBetween(start, end), left = [], right = [];
            nodes.forEach((node, i) => {
                const before = nodes[Math.max(0, i - 1)].point, after = nodes[Math.min(nodes.length - 1, i + 1)].point;
                const length = distance(before, after);
                if (length < 1e-8) throw new Error('Точки руки совпали: проверьте плечо, локоть и запястье.');
                const nx = -(after.y - before.y) / length, ny = (after.x - before.x) / length;
                const half = rootHalf + (cuffHalf - rootHalf) * (node.cm - start) / (end - start);
                left.push([node.point.x + nx * half, node.point.y + ny * half]);
                right.push([node.point.x - nx * half, node.point.y - ny * half]);
            });
            return [...left, ...right.reverse()];
        }
        const shift = assessment.shoulderShiftCm, endCm = shift + garment.sleeveCm;
        const topHalf = chestSpan * .16 + Math.max(0, garment.chestCm - Number(body.chestCm)) * circumScale * .06;
        const target = ribbon(shift, endCm, topHalf, topHalf * .65);
        const erase = ribbon(0, measured.armLengthCm, topHalf, topHalf * .65);
        const nodes = nodesBetween(shift, endCm);
        const warnings = [];
        if (Object.values(sources).includes('photo-estimate')) warnings.push('Часть мерок руки оценена по фото и росту. Для более определённого расчёта заполните плечи, длину руки и кисти в лаборатории.');
        if (Number(body.armLengthCm) && Math.abs(measured.armLengthCm / photoArm - 1) > .25) warnings.push('Длина руки по обмеру заметно отличается от фото: проверьте опорные точки, рост и перспективу.');
        if (Number(body.shoulderCm) && Math.abs(measured.shoulderCm / photoShoulders - 1) > .25) warnings.push('Ширина плеч по обмеру заметно отличается от фото: проверьте анатомические плечевые точки и рост.');
        const offset = endCm - measured.armLengthCm;
        if (offset > 0) warnings.push('Расчётный рукав заходит на кисть: эта область может быть изменена моделью. Длина не обрезается у запястья.');
        return {
            target, erase, seam: at(shift), warnings,
            metadata: { side, lengthCm: garment.sleeveCm, start: at(shift), cuff: at(endCm), wrist, shoulder, elbow, handTip,
                projectedLengthPx: nodes.slice(1).reduce((sum, node, i) => sum + distance(nodes[i].point, node.point), 0),
                wristOffsetCm: offset, shoulderShiftCm: shift, shoulderDropCm: assessment.shoulderDropCm,
                handCoverageRatio: assessment.handCoverageRatio, handLengthCm: measured.handLengthCm,
                sources, label: assessment.label, assumption: assessment.assumption }
        };
    }
    return { trace };
});
