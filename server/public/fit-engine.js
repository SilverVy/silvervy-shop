(function (root, factory) {
    const catalog = typeof module === 'object' && module.exports ? require('./catalog-data') : root.SilverVyCatalog;
    const engine = factory(catalog);
    if (typeof module === 'object' && module.exports) module.exports = engine;
    else root.SilverVyFit = engine;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (catalog) {
    'use strict';
    function chartRange(key, bodyFloor = 0) {
        const candidates = [];
        for (const product of catalog?.products || []) {
            const ease = product.ease?.[key];
            if (!ease) continue;
            const outerAllowance = product.category === 'bottoms' && key === 'waistCm' ? 4 : 12;
            for (const garment of product.sizes || []) {
                if (!Number.isFinite(garment[key])) continue;
                candidates.push({
                    minimumBody: garment[key] - ease[1] - outerAllowance,
                    maximumBody: garment[key] - ease[0]
                });
            }
        }
        if (!candidates.length) throw new Error(`Нет размерных данных для ${key}`);
        return [
            Math.max(bodyFloor, Math.round(Math.min(...candidates.map(item => item.minimumBody)) * 10) / 10),
            Math.round(Math.max(...candidates.map(item => item.maximumBody)) * 10) / 10
        ];
    }
    // Circumference maxima follow the size chart; lower bounds keep inputs
    // within a broad, plausible adult menswear range for the supported heights.
    const ranges = {
        heightCm: [165, 190],
        chestCm: chartRange('chestCm', 80),
        waistCm: chartRange('waistCm', 60),
        hipCm: chartRange('hipCm', 80),
        shoulderCm: [36, 58],
        armLengthCm: [54, 72],
        handLengthCm: [16, 23],
        inseamCm: [70, 91],
        weightKg: [50, 160]
    };
    const labels = { chestCm: 'Грудь', waistCm: 'Талия', hipCm: 'Бёдра' };
    function evaluateSleeve(garment, body) {
        const names = { shoulderCm: 'ширину плеч', armLengthCm: 'длину руки' };
        const missing = Object.keys(names).filter(key => !Number(body?.[key]));
        if (missing.length || !Number.isFinite(garment?.sleeveCm) || !Number.isFinite(garment?.shoulderCm)) {
            return { status: 'unknown', label: `Для оценки манжеты укажите ${missing.map(key => names[key]).join(' и ') || 'обмеры рукава изделия'}.`,
                cuffOffsetCm: null, handCoverageRatio: null };
        }
        const shoulderShiftCm = (garment.shoulderCm - Number(body.shoulderCm)) / 2;
        const offset = shoulderShiftCm + garment.sleeveCm - Number(body.armLengthCm);
        const hand = Number(body.handLengthCm) || null;
        const coverage = hand ? Math.max(0, Math.min(1, offset / hand)) : null;
        const signed = `${offset >= 0 ? '+' : ''}${offset.toFixed(1)}`;
        const label = offset < -1 ? `Манжета выше запястья на ${Math.abs(offset).toFixed(1)} см`
            : offset <= 1 ? 'Манжета у запястья'
                : !hand ? `Манжета за запястьем на ${offset.toFixed(1)} см; укажите длину кисти, чтобы увидеть перекрытие`
                    : offset >= hand ? `Манжета закрывает всю кисть${offset > hand + 1 ? ` и выходит за кончики пальцев на ${(offset - hand).toFixed(1)} см` : ''}`
                        : `Манжета закрывает около ${Math.round(coverage * 100)}% кисти`;
        return { status: 'estimated', shoulderShiftCm, shoulderDropCm: Math.max(0, shoulderShiftCm),
            cuffOffsetCm: Math.round(offset * 10) / 10, handCoverageRatio: coverage,
            handLengthCm: hand, label,
            assumption: 'Условная цепочка: рукав + половина разницы плеч − длина руки. Прибавка плеча отнесена к спуску вдоль руки; драпировка не моделируется.' };
    }
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
                errors[key] = `Допустимо ${ranges[key][0]}–${ranges[key][1]} ${key === 'weightKg' ? 'кг' : 'см'}`;
            }
        }
        return errors;
    }
    function evaluate(product, body, preference = 'intended') {
        if (!product || !Array.isArray(product.sizes) || !product.ease ||
            !['tops', 'bottoms'].includes(product.category)) {
            return { status: 'unavailable', errors: {}, recommendedSize: null, rows: [], warnings: ['Для этой вещи пока нет размерной сетки.'] };
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
            return { size: garment.size, garment, checks, score: Math.round(score * 100) / 100, compatible, inseamDifferenceCm,
                sleeve: product.category === 'tops' ? evaluateSleeve(garment, body) : null };
        });
        const best = rows.filter(row => row.compatible).sort((a, b) => a.score - b.score)[0];
        const recommendationKind = best
            ? best.checks.every(check => check.status === 'intended') ? 'intended' : 'closest'
            : null;
        return {
            status: 'ready', errors: {}, recommendedSize: best ? best.size : null, recommendationKind, rows,
            warnings: [
                'На посадку влияют ткань, одежда под низом и ваши предпочтения.',
                ...(recommendationKind === 'closest' ? ['Ближайший размер подходит не по всем меркам — проверьте сравнение по зонам.'] : []),
                ...(product.category === 'bottoms' && !Number(body.inseamCm) ? ['Без длины внутреннего шва нельзя оценить длину брюк.'] : [])
            ]
        };
    }
    return { evaluate, validate, ranges, evaluateSleeve };
});
