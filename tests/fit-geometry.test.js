const { test } = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const geometry = require('../server/public/fit-geometry');
const catalog = require('../server/public/catalog-data');
const { assessRequest } = require('../server/services/fit-service');
const { prepareSizeInputs, preserveOutsideMask } = require('../server/services/fit-image-preparation');
const body = { heightCm: 178, chestCm: 100, waistCm: 84, hipCm: 100 };
const product = catalog.getProduct('shirt');
function build(size, measurements = body, points = geometry.defaults) {
    return geometry.build({ product, garment: product.sizes.find(row => row.size === size),
        body: measurements, points, width: 768, height: 1024 });
}
test('size AND laboratory circumference and height change the image-space geometry', () => {
    const xs = build('XS'), xl = build('XL');
    assert.ok(xl.projectedChestPx > xs.projectedChestPx);
    assert.ok(xl.hemY > xs.hemY);
    assert.notDeepEqual(xs.polygons, xl.polygons);
    assert.ok(build('M', { ...body, chestCm: 110 }).projectedChestPx < build('M').projectedChestPx);
    assert.ok(build('M', { ...body, heightCm: 190 }).hemY < build('M').hemY);
    assert.notDeepEqual(build('M', { ...body, waistCm: 90 }), build('M'));
});
test('calibration rejects nonfinite, inverted, off-image, incomplete and physically unscaled input', () => {
    for (const points of [{}, { ...geometry.defaults, neck: { x: NaN, y: .18 } },
        { ...geometry.defaults, crown: { x: .5, y: .9 } },
        { ...geometry.defaults, chestLeft: { x: 1.5, y: .28 } }]) {
        assert.throws(() => build('M', body, points));
    }
    assert.throws(() => build('M', { ...body, heightCm: '' }), /рост/);
    for (const item of catalog.products.filter(p => p.category === 'tops')) {
        for (const garment of item.sizes) {
            const g = geometry.build({ product: item, garment, body, points: geometry.defaults, width: 768, height: 1024 });
            assert.ok(g.polygons.length > 0);
            assert.match(geometry.svg(g), /fill="black"/);
        }
    }
});
test('outside the submitted mask output pixels exactly preserve the normalized source image', async () => {
    const buffer = await sharp({ create: { width: 768, height: 1024, channels: 3, background: '#123456' } }).png().toBuffer();
    const assessment = assessRequest({ productId: 'shirt', size: 'M', measurements: body });
    const prepared = await prepareSizeInputs({ buffer }, buffer, assessment, { points: geometry.defaults, confirmed: true });
    const fakeOutput = await sharp({ create: { width: 768, height: 1024, channels: 3, background: '#ee7722' } }).png().toBuffer();
    const output = await preserveOutsideMask(fakeOutput, prepared);
    const actual = await sharp(output).removeAlpha().raw().toBuffer();
    const original = await sharp(prepared.person.buffer).removeAlpha().raw().toBuffer();
    const mask = await sharp(prepared.mask).extractChannel(0).raw().toBuffer();
    let protectedPixels = 0, changedPixels = 0;
    for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 0) {
            protectedPixels++;
            assert.equal(actual[i * 3], original[i * 3]);
            assert.equal(actual[i * 3 + 1], original[i * 3 + 1]);
            assert.equal(actual[i * 3 + 2], original[i * 3 + 2]);
        } else if (actual[i * 3] !== original[i * 3]) changedPixels++;
    }
    assert.ok(protectedPixels > mask.length * .5);
    assert.ok(changedPixels > 1000);
});
