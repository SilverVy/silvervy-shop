const { test } = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../server/public/catalog-data');
const fit = require('../server/public/fit-engine');
const { assessRequest, parsePersonImage } = require('../server/services/fit-service');
const body = { heightCm: 178, chestCm: 100, waistCm: 84, hipCm: 100, inseamCm: 79 };

test('eight menswear products have complete, strictly graded dimensions', () => {
    assert.equal(catalog.products.length, 8);
    assert.equal(new Set(catalog.products.map(p => p.id)).size, 8);
    for (const product of catalog.products) {
        assert.deepEqual(product.sizes.map(s => s.size), ['XS', 'S', 'M', 'L', 'XL']);
        for (const key of Object.keys(product.sizes[0]).filter(key => key !== 'size')) {
            product.sizes.forEach((row, index) => {
                assert.ok(Number.isFinite(row[key]) && row[key] > 0, `${product.id} ${key}`);
                if (index) assert.ok(row[key] > product.sizes[index - 1][key], `${product.id} grading ${key}`);
            });
        }
        assert.ok(!product.images.front.includes('http'));
        assert.ok(product.images.front.endsWith('-front.jpg'));
        assert.ok(product.images.display.endsWith('-front-cutout.png'));
        assert.notEqual(product.images.front, product.images.display);
    }
});

test('shared adult measurement ranges derive circumference limits from the whole size chart', () => {
    const bodyFloors = { chestCm: 80, waistCm: 60, hipCm: 80 };
    for (const key of Object.keys(bodyFloors)) {
        const candidates = catalog.products.flatMap(product => {
            const target = product.ease[key];
            if (!target) return [];
            const allowance = product.category === 'bottoms' && key === 'waistCm' ? 4 : 12;
            return product.sizes.map(garment => ({
                minimum: garment[key] - target[1] - allowance,
                maximum: garment[key] - target[0]
            }));
        });
        const expected = [
            Math.max(bodyFloors[key], Math.round(Math.min(...candidates.map(item => item.minimum)) * 10) / 10),
            Math.round(Math.max(...candidates.map(item => item.maximum)) * 10) / 10
        ];
        assert.deepEqual(fit.ranges[key], expected);
    }
    assert.deepEqual(fit.ranges.heightCm, [165, 190]);
    assert.deepEqual(fit.ranges.shoulderCm, [36, 58]);
    assert.deepEqual(fit.ranges.armLengthCm, [54, 72]);
    assert.deepEqual(fit.ranges.handLengthCm, [16, 23]);
    assert.deepEqual(fit.ranges.inseamCm, [70, 91]);
    assert.deepEqual(fit.ranges.weightKg, [50, 160]);
    const fittingHtml = require('node:fs').readFileSync('server/public/fitting.html', 'utf8');
    for (const [key, [min, max]] of Object.entries(fit.ranges)) {
        if (key === 'weightKg') continue;
        const field = fittingHtml.match(new RegExp(`<input name="${key}"[^>]*>`))?.[0];
        if (field) {
            assert.match(field, new RegExp(`min="${min}"`), `${key} minimum`);
            assert.match(field, new RegExp(`max="${max}"`), `${key} maximum`);
        }
    }
});

test('circumference ease is garment minus body for every product and size', () => {
    for (const product of catalog.products) {
        const result = fit.evaluate(product, body);
        assert.equal(result.status, 'ready');
        for (const row of result.rows) {
            for (const check of row.checks) {
                assert.equal(check.easeCm, Math.round((row.garment[check.key] - body[check.key]) * 10) / 10);
            }
        }
    }
});

test('recommendation changes with body measurements, not weight', () => {
    const shirt = catalog.getProduct('shirt');
    const small = fit.evaluate(shirt, { chestCm: 90, waistCm: 76, hipCm: 90 });
    const large = fit.evaluate(shirt, { chestCm: 112, waistCm: 94, hipCm: 112 });
    assert.notEqual(small.recommendedSize, large.recommendedSize);
    assert.ok(small.recommendedSize);
    assert.ok(large.recommendedSize);
    assert.deepEqual(fit.evaluate(shirt, { ...body, weightKg: 50 }), fit.evaluate(shirt, { ...body, weightKg: 120 }));
});

test('missing and invalid measurements do not silently get defaults', () => {
    const product = catalog.getProduct('coat');
    for (const invalid of [{}, { ...body, chestCm: '' }, { ...body, chestCm: -1 },
        { ...body, chestCm: Infinity }, { ...body, waistCm: true }, { ...body, hipCm: [100] }]) {
        const result = fit.evaluate(product, invalid);
        assert.equal(result.status, 'invalid');
        assert.equal(result.recommendedSize, null);
        assert.ok(Object.keys(result.errors).length > 0);
    }
});

test('no supported sizes results in no recommendation, not XL as fallback', () => {
    const result = fit.evaluate(catalog.getProduct('shirt'), { chestCm: 120, waistCm: 60, hipCm: 126 });
    assert.equal(result.status, 'ready');
    assert.equal(result.recommendedSize, null);
    assert.ok(result.rows.every(row => !row.compatible));
    assert.ok(result.rows.some(row => row.checks.some(check => check.status === 'tight')));
});

test('target interval boundaries are inclusive and negative ease is tight', () => {
    const product = { category: 'bottoms', ease: { waistCm: [0, 4], hipCm: [10, 20] }, sizes: [
        { size: 'S', waistCm: 84, hipCm: 110, inseamCm: 79 },
        { size: 'M', waistCm: 88, hipCm: 120, inseamCm: 80 },
        { size: 'XS', waistCm: 83, hipCm: 108, inseamCm: 78 }
    ] };
    const result = fit.evaluate(product, body);
    assert.equal(result.rows[0].checks[0].status, 'intended');
    assert.equal(result.rows[1].checks[0].status, 'intended');
    assert.equal(result.rows[2].checks[0].status, 'tight');
    assert.equal(result.rows[2].compatible, false);
});

test('body chart does not pretend to be fabric physics; optional inseam is explicit', () => {
    const product = catalog.getProduct('trousers');
    const withoutLength = fit.evaluate(product, { waistCm: 84, hipCm: 100 });
    assert.equal(withoutLength.status, 'ready');
    assert.ok(withoutLength.warnings.some(text => text.includes('нельзя оценить длину брюк')));
    const withLength = fit.evaluate(product, body);
    assert.equal(withLength.rows.find(row => row.size === 'M').inseamDifferenceCm, 0);
});

test('a roomier preference changes target ease without stretching a waistband', () => {
    const product = catalog.getProduct('trousers');
    const a = fit.evaluate(product, body, 'intended');
    const b = fit.evaluate(product, body, 'roomier');
    assert.deepEqual(a.rows[0].checks[0].target, b.rows[0].checks[0].target);
    assert.equal(b.rows[0].checks[1].target[0] - a.rows[0].checks[1].target[0], 4);
    assert.equal(fit.evaluate(product, body, 'invalid').status, 'invalid');
});

test('unknown/missing garment measurements cannot produce a recommendation', () => {
    assert.equal(fit.evaluate(null, body).status, 'unavailable');
    const result = fit.evaluate({ category: 'tops', ease: { chestCm: [10, 20] }, sizes: [{ size: 'M' }] }, body);
    assert.equal(result.recommendedSize, null);
    assert.equal(result.rows[0].checks[0].status, 'unknown');
});

test('generation takes catalog-controlled garment data and refuses bottoms', () => {
    const request = { productId: 'shirt', size: 'M', measurements: body };
    const result = assessRequest(request, { forGeneration: true });
    assert.equal(result.garment.chestCm, 120);
    assert.match(result.description, /garment 120 cm, body 100 cm/);
    assert.throws(() => assessRequest({ ...request, productId: '../coat' }), error => error.status === 404);
    assert.throws(() => assessRequest({ ...request, size: 'XXXL' }), error => error.status === 400);
    assert.throws(() => assessRequest({ ...request, measurements: {} }), error => error.status === 400);
    assert.throws(() => assessRequest({ ...request, productId: 'trousers' }, { forGeneration: true }), error => error.status === 422);
    assert.doesNotThrow(() => assessRequest({ ...request, productId: 'trousers' }));
    assert.throws(() => assessRequest(null), error => error.status === 400);
});

test('person image parser rejects non-images, spoofed MIME and oversized data', () => {
    assert.equal(parsePersonImage('https://example.com/person.jpg'), null);
    assert.equal(parsePersonImage('data:image/jpeg;base64,' + Buffer.from('not a valid image body').toString('base64')), null);
    assert.equal(parsePersonImage('data:image/svg+xml;base64,PHN2Zz4='), null);
    const signature = Buffer.alloc(20); signature[0] = 255; signature[1] = 216; signature[2] = 255;
    assert.equal(parsePersonImage('data:image/jpeg;base64,' + signature.toString('base64')).mimeType, 'image/jpeg');
    assert.equal(parsePersonImage('data:image/jpeg;base64,' + 'A'.repeat(10 * 1024 * 1024)), null);
});
