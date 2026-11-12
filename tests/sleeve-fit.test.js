const { test } = require('node:test');
const assert = require('node:assert/strict');
const fit = require('../server/public/fit-engine');
const geometry = require('../server/public/fit-geometry');
const product = require('../server/public/catalog-data').getProduct('shirt');
const small = { heightCm: 165, chestCm: 82, waistCm: 64, hipCm: 88, shoulderCm: 36, armLengthCm: 54, handLengthCm: 17 };
function image(size, body = small) {
    return geometry.build({ product, garment: product.sizes.find(g => g.size === size), body,
        points: geometry.defaults, width: 768, height: 1024 });
}
test('XL on a short-armed person can cover the entire hand, including shoulder drop', () => {
    const rows = fit.evaluate(product, small).rows;
    const xs = rows.find(row => row.size === 'XS').sleeve, xl = rows.find(row => row.size === 'XL').sleeve;
    assert.equal(xs.shoulderDropCm, 7);
    assert.equal(xs.cuffOffsetCm, 12.6);
    assert.equal(xl.shoulderDropCm, 10);
    assert.equal(xl.cuffOffsetCm, 18.4);
    assert.ok(Math.abs(xl.cuffOffsetCm - xs.cuffOffsetCm - 5.8) < 1e-9);
    assert.ok(xs.handCoverageRatio < 1);
    assert.equal(xl.handCoverageRatio, 1);
    assert.match(xl.label, /всю кисть/);
    const a = image('XS'), b = image('XL');
    assert.ok(b.sleeves[0].start.y > a.sleeves[0].start.y, 'wider garment must move its seam down the traced arm');
    assert.ok(b.sleeves[0].cuff.y > b.sleeves[0].handTip.y, 'hand coverage must not be clamped at the wrist or fingertips');
    assert.equal(b.sleeves[0].wristOffsetCm.toFixed(1), xl.cuffOffsetCm.toFixed(1));
    assert.deepEqual(Object.values(b.sleeves[0].sources), ['laboratory', 'laboratory', 'laboratory']);
});
test('current shoulder, arm and hand measurements each affect their own sleeve calculation', () => {
    const garment = product.sizes.find(row => row.size === 'M');
    const base = fit.evaluateSleeve(garment, small);
    assert.equal(fit.evaluateSleeve(garment, { ...small, shoulderCm: 40 }).cuffOffsetCm, base.cuffOffsetCm - 2);
    assert.equal(fit.evaluateSleeve(garment, { ...small, armLengthCm: 60 }).cuffOffsetCm, base.cuffOffsetCm - 6);
    assert.ok(fit.evaluateSleeve(garment, { ...small, handLengthCm: 23 }).handCoverageRatio < base.handCoverageRatio);
    assert.ok(image('M', { ...small, armLengthCm: 60 }).sleeves[0].cuff.y < image('M').sleeves[0].cuff.y);
    assert.notDeepEqual(image('M', { ...small, handLengthCm: 23 }).sleeves[0].cuff, image('M').sleeves[0].cuff);
    const aboveWrist = fit.evaluateSleeve(garment, { ...small, shoulderCm: 44, armLengthCm: 72 });
    assert.ok(aboveWrist.cuffOffsetCm < 0);
    assert.equal(aboveWrist.handCoverageRatio, 0);
    assert.match(aboveWrist.label, /выше запястья/);
});
test('old profiles stay valid; absent optional measurements never become claimed body dimensions', () => {
    const { shoulderCm, armLengthCm, handLengthCm, ...old } = small;
    const result = fit.evaluate(product, old);
    assert.equal(result.status, 'ready');
    assert.equal(result.rows[0].sleeve.status, 'unknown');
    assert.equal(result.rows[0].sleeve.cuffOffsetCm, null);
    const estimate = image('M', old).sleeves[0];
    assert.ok(Object.values(estimate.sources).every(source => source === 'photo-estimate'));
    assert.ok(image('M', old).warnings.some(warning => warning.includes('оценена по фото')));
    const withoutHand = fit.evaluateSleeve(product.sizes[2], { ...small, handLengthCm: '' });
    assert.equal(withoutHand.handCoverageRatio, null);
    assert.match(withoutHand.label, /укажите длину кисти/);
});
test('new fields and anatomical points reject invalid ranges and reversed arm order', () => {
    for (const [key, value] of [['shoulderCm', 20], ['armLengthCm', 120], ['handLengthCm', 50], ['handLengthCm', true]]) {
        assert.ok(fit.validate({ ...small, [key]: value }, 'tops')[key]);
    }
    const points = structuredClone(geometry.defaults);
    points.elbowLeft.y = .7;
    assert.throws(() => geometry.build({ product, garment: product.sizes[2], body: small, points, width: 768, height: 1024 }), /локоть/);
    delete points.handTipLeft;
    assert.throws(() => geometry.build({ product, garment: product.sizes[2], body: small, points, width: 768, height: 1024 }), /все опорные/);
});
