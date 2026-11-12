(function (root, factory) {
    const engine = factory();
    if (typeof module === 'object' && module.exports) module.exports = engine;
    else root.SilverVyFit = engine;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const ranges = {
        heightCm: [120, 220], chestCm: [60, 180], waistCm: [45, 170], hipCm: [65, 190],
        shoulderCm: [28, 70], armLengthCm: [35, 90], inseamCm: [45, 110]
    };
    const labels = { chestCm: 'Грудь', waistCm: 'Талия', hipCm: 'Бёдра' };
    function validate(body, category) {
        const errors = {};
        const required = category === 'bottoms' ? ['waistCm', 'hipCm'] : ['chestCm', 'waistCm', 'hipCm'];
        for (const key of Object.keys(ranges)) {
            const value = body && body[key];
            if (value === '' || value === undefined || value === null) {
                if (required.includes(key)) errors[key] = 'Укажите мерку в сантиметрах';
                continue;
            }
            const number = Number(value);
            if (!['number', 'string'].includes(typeof value) || !Number.isFinite(number) ||
                number < ranges[key][0] || number > ranges[key][1]) {
                errors[key] = `Допустимо ${ranges[key][0]}–${ranges[key][1]} см`;
            }
        }
        return errors;
    }
    function evaluate(product, body, preference = 'intended') {
        if (!product || !Array.isArray(product.sizes) || !product.ease ||
            !['tops', 'bottoms'].includes(product.category)) {
            return { status: 'unavailable', errors: {}, recommendedSize: null, rows: [], warnings: ['Нет размерных данных изделия.'] };
        }
        const errors = validate(body, product.category);
        if (!['intended', 'closer', 'roomier'].includes(preference)) errors.preference = 'Неизвестная посадка';
        if (Object.keys(errors).length) return { status: 'invalid', errors, rows: [], recommendedSize: null, warnings: [] };
        const shift = preference === 'closer' ? -4 : preference === 'roomier' ? 4 : 0;
        const rows = product.sizes.map(garment => {
            let score = 0;
            const checks = Object.entries(product.ease).map(([key, target]) => {
                if (!Number.isFinite(garment[key]) || !Number.isFinite(Number(body[key]))) {
                    return { key, label: labels[key], status: 'unknown', easeCm: null };
                }
                // Waistbands stay at their designed circumference: a preference is not elastic stretch.
                const adjustment = product.category === 'bottoms' && key === 'waistCm' ? 0 : shift;
                const min = Math.max(0, target[0] + adjustment);
                const max = Math.max(min, target[1] + adjustment);
                const easeCm = Math.round((garment[key] - Number(body[key])) * 10) / 10;
                const distance = easeCm < min ? min - easeCm : easeCm > max ? easeCm - max : 0;
                score += distance * (easeCm < min ? 4 : 1) + Math.abs(easeCm - (min + max) / 2) * 0.08;
                return {
                    key, label: labels[key], bodyCm: Number(body[key]), garmentCm: garment[key],
                    easeCm, target: [min, max],
                    status: easeCm < 0 ? 'tight' : easeCm < min ? 'close' : easeCm > max ? 'loose' : 'intended'
                };
            });
            const compatible = checks.length > 0 && checks.every(check =>
                check.status !== 'unknown' && check.easeCm >= 0 &&
                check.easeCm <= check.target[1] + (product.category === 'bottoms' && check.key === 'waistCm' ? 4 : 12));
            const inseamDifferenceCm = product.category === 'bottoms' && Number(body.inseamCm)
                ? Math.round((garment.inseamCm - Number(body.inseamCm)) * 10) / 10 : null;
            if (inseamDifferenceCm !== null) score += Math.max(0, Math.abs(inseamDifferenceCm) - 3) * 0.5;
            return { size: garment.size, garment, checks, score: Math.round(score * 100) / 100, compatible, inseamDifferenceCm };
        });
        const best = rows.filter(row => row.compatible).sort((a, b) => a.score - b.score)[0];
        const recommendationKind = best
            ? best.checks.every(check => check.status === 'intended') ? 'intended' : 'closest'
            : null;
        return {
            status: 'ready', errors: {}, recommendedSize: best ? best.size : null, recommendationKind, rows,
            warnings: [
                'Расчёт выполнен по условным меркам учебной коллекции, а не по измеренным реальным изделиям.',
                'Схема сравнивает мерки и прибавки. Она не моделирует ткань, движения, толщину нижних слоёв или индивидуальную форму тела.',
                ...(recommendationKind === 'closest' ? ['Выбран ближайший допустимый размер: не все зоны соответствуют заданному диапазону прибавок. Смотрите сравнение по зонам.'] : []),
                ...(product.category === 'bottoms' && !Number(body.inseamCm) ? ['Без внутреннего шва длина брюк не оценивается.'] : [])
            ]
        };
    }
    return { evaluate, validate, ranges };
});
