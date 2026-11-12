const { test } = require('node:test');
const assert = require('node:assert/strict');
const { plans } = require('../server/services/sleeve-reference');
const catalog = require('../server/public/catalog-data');
test('each top has valid independent sleeve-axis grading for every actual catalog size', () => {
    for (const product of catalog.products.filter(p => p.category === 'tops')) {
        const base = product.sizes.find(row => row.size === 'M');
        for (const garment of product.sizes) {
            const scaleX = garment.chestCm / base.chestCm, scaleY = garment.lengthCm / base.lengthCm;
            const transforms = plans({ productId: product.id, sourceWidth: 512, sourceHeight: 1024,
                targetWidth: Math.round(768 * .8 * scaleX), targetHeight: Math.round(1024 * .8 * scaleY),
                scaleX, scaleY, sleeveRatio: garment.sleeveCm / base.sleeveCm });
            assert.equal(transforms.length, 2);
            for (const transform of transforms) {
                assert.ok(transform.factor > .8 && transform.factor < 1.2);
                assert.ok(Math.abs(transform.factor * transform.torsoAxisScale - garment.sleeveCm / base.sleeveCm) < 1e-12);
            }
        }
    }
});
