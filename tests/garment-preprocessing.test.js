const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getPreprocessingProfile, getCropRect } = require('../server/services/garment-preprocessing');

test('coat and trench share the unchanged full-frame profile', () => {
    const coat = getPreprocessingProfile('coat');
    const trench = getPreprocessingProfile('trench');
    assert.equal(coat.id, 'outerwear-full-frame-v1');
    assert.equal(trench.id, coat.id);
    assert.equal(coat.mode, 'outerwear');
    assert.equal(trench.mode, 'outerwear');
    assert.equal(getCropRect(coat, 512, 1024), null);
    assert.equal(getCropRect(trench, 512, 1024), null);
});

test('each short garment has its own crop while retaining the annotated frame bounds', () => {
    const products = ['shirt', 'bomber', 'denim', 'linen'];
    const ids = products.map(id => getPreprocessingProfile(id).id);
    assert.equal(new Set(ids).size, products.length);
    for (const productId of products) {
        const profile = getPreprocessingProfile(productId);
        const crop = getCropRect(profile, 512, 1024);
        assert.equal(profile.mode, 'short-top');
        assert.ok(crop.width > 400 && crop.width <= 512);
        assert.ok(crop.height > 500 && crop.height < 850);
        assert.ok(crop.sourceCrop.x >= 0 && crop.sourceCrop.x + crop.sourceCrop.width <= 1);
        assert.ok(crop.sourceCrop.y >= 0 && crop.sourceCrop.y + crop.sourceCrop.height <= 1);
    }
});

test('unknown garments fail instead of silently using the wrong preprocessing profile', () => {
    assert.throws(() => getPreprocessingProfile('unknown-top'), /Нет отдельного профиля/);
});
