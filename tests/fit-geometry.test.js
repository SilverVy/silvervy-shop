const { test } = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const fs = require('node:fs/promises');
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
test('sleeve endpoints follow sleeve centimetres without collapsing at the wrist', () => {
    const context = { product, body, points: geometry.defaults, width: 768, height: 1024 };
    const base = product.sizes.find(row => row.size === 'M');
    const short = geometry.build({ ...context, garment: { ...base, sleeveCm: 70 } });
    const long = geometry.build({ ...context, garment: { ...base, sleeveCm: 75 } });
    for (let i = 0; i < 2; i++) {
        const a = short.sleeves[i], b = long.sleeves[i];
        assert.ok(a.wristOffsetCm > 0 && b.wristOffsetCm > a.wristOffsetCm);
        assert.ok(Math.abs(b.projectedLengthPx - a.projectedLengthPx - 5 * short.pxPerCm) < 1e-6);
        assert.notDeepEqual(a.cuff, b.cuff);
    }
    assert.deepEqual(short.target[0], long.target[0], 'torso must not change when only sleeve length changes');
    assert.notEqual(geometry.svg(short), geometry.svg(long), 'the actual editable mask must change beyond the wrist too');
});
test('garment mask bridges the verified anatomical shoulder to the dropped seam', async () => {
    const guide = build('XL', body, {
        ...geometry.defaults,
        shoulderLeft: { x: .33, y: .22 }, shoulderRight: { x: .67, y: .22 },
        elbowLeft: { x: .29, y: .38 }, elbowRight: { x: .71, y: .38 },
        wristLeft: { x: .25, y: .53 }, wristRight: { x: .75, y: .53 }
    });
    const targetTorso = guide.target[0];
    assert.ok(targetTorso.some(([x, y]) => Math.abs(x - .33 * 768) < 1e-6 && Math.abs(y - .22 * 1024) < 1e-6));
    assert.ok(targetTorso.some(([x, y]) => Math.abs(x - .67 * 768) < 1e-6 && Math.abs(y - .22 * 1024) < 1e-6));
    const previous = { ...guide, polygons: guide.polygons.map(poly => poly === targetTorso
        ? poly.filter((_, index) => index !== 2 && index !== poly.length - 1) : poly) };
    const raster = value => sharp(Buffer.from(geometry.svg(value))).removeAlpha().extractChannel(0).raw().toBuffer();
    const [before, after] = await Promise.all([raster(previous), raster(guide)]);
    let newlyEditable = 0;
    for (let i = 0; i < after.length; i++) if (before[i] === 0 && after[i] === 255) newlyEditable++;
    assert.ok(newlyEditable > 100, 'shoulder fabric previously outside the mask must actually become editable');
    assert.ok(after.subarray(0, Math.floor(geometry.defaults.neck.y * 1024 - 2) * 768).every(value => value === 0),
        'shoulder expansion must not expose the face region to editing');
});
test('sleeve-only changes alter trusted reference pixels without stretching the torso', async () => {
    const person = { buffer: await sharp({ create: { width: 768, height: 1024, channels: 3, background: '#123456' } }).png().toBuffer() };
    const reference = await fs.readFile('server/public/media/collection/shirt-front.jpg');
    const base = assessRequest({ productId: 'shirt', size: 'M', measurements: body });
    const calibration = { confirmed: true, points: geometry.defaults };
    const prepared = await prepareSizeInputs(person, reference, base, calibration);
    const changed = await prepareSizeInputs(person, reference, { ...base, garment: { ...base.garment, sleeveCm: 57 } }, calibration);
    assert.equal(prepared.metadata.referenceScaleY, changed.metadata.referenceScaleY);
    assert.equal(changed.metadata.referenceSleeves[0].sleeveRatio, 57 / 61);
    assert.ok(!prepared.garment.buffer.equals(changed.garment.buffer), 'real image input must change, not only text');
    const bodyPatch = buffer => sharp(buffer).extract({ left: 345, top: 350, width: 70, height: 300 }).raw().toBuffer();
    assert.deepEqual(await bodyPatch(prepared.garment.buffer), await bodyPatch(changed.garment.buffer));
    assert.deepEqual(prepared.guide.target[0], changed.guide.target[0]);
});
test('short garments use item-specific cropped references and size-dependent length, volume, and sleeves', async () => {
    const source = await sharp({ create: { width: 768, height: 1024, channels: 3, background: '#123456' } }).png().toBuffer();
    const measurements = {
        heightCm: 160, chestCm: 82, waistCm: 64, hipCm: 88,
        shoulderCm: 36, armLengthCm: 54, handLengthCm: 17
    };
    for (const productId of ['shirt', 'bomber', 'denim', 'linen']) {
        const item = catalog.getProduct(productId);
        const reference = await fs.readFile(`server/public/${item.images.front}`);
        const prepare = async size => {
            const assessment = assessRequest({ productId, size, measurements });
            return prepareSizeInputs({ buffer: source }, reference, assessment, {
                points: geometry.defaults, confirmed: true
            });
        };
        const sized = [];
        for (const size of ['XS', 'S', 'M', 'L', 'XL']) sized.push(await prepare(size));
        const expectedProfile = productId === 'linen'
            ? 'linen-short-sleeve-reference-v1'
            : `${productId}-cropped-reference-v1`;
        for (const prepared of sized) {
            assert.equal(prepared.metadata.preprocessing.id, expectedProfile);
            assert.equal(prepared.metadata.preprocessing.mode, 'short-top');
            assert.ok(prepared.metadata.preprocessing.referenceCrop);
        }
        for (let index = 1; index < sized.length; index++) {
            const previous = sized[index - 1], current = sized[index];
            assert.ok(previous.metadata.referenceScaleX < current.metadata.referenceScaleX, `${productId}: chest volume scale`);
            assert.ok(previous.metadata.referenceScaleY < current.metadata.referenceScaleY, `${productId}: body length scale`);
            assert.ok(previous.guide.projectedChestPx < current.guide.projectedChestPx, `${productId}: size mask width`);
            assert.ok(previous.guide.hemClearanceCm > current.guide.hemClearanceCm, `${productId}: hem moves with selected length`);
            assert.ok(previous.guide.sleeves[0].lengthCm < current.guide.sleeves[0].lengthCm, `${productId}: sleeve length changes`);
            assert.ok(previous.metadata.referenceSleeves[0].sleeveRatio < current.metadata.referenceSleeves[0].sleeveRatio);
            assert.notDeepEqual(previous.garment.buffer, current.garment.buffer, `${productId}: reference image must change by size`);
        }
    }
});

test('coat and trench stay on the full-frame outerwear preprocessing route', async () => {
    const source = await sharp({ create: { width: 768, height: 1024, channels: 3, background: '#123456' } }).png().toBuffer();
    const measurements = {
        heightCm: 160, chestCm: 82, waistCm: 64, hipCm: 88,
        shoulderCm: 36, armLengthCm: 54, handLengthCm: 17
    };
    for (const productId of ['coat', 'trench']) {
        const item = catalog.getProduct(productId);
        const reference = await fs.readFile(`server/public/${item.images.front}`);
        const assessment = assessRequest({ productId, size: 'M', measurements });
        const prepared = await prepareSizeInputs({ buffer: source }, reference, assessment, {
            points: geometry.defaults, confirmed: true
        });
        assert.deepEqual(prepared.metadata.preprocessing, {
            id: 'outerwear-full-frame-v1', mode: 'outerwear', referenceCrop: null
        });
        assert.equal(prepared.metadata.referenceScaleX, 1);
        assert.equal(prepared.metadata.referenceScaleY, 1);
    }
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

test('IDM receives the unchanged person image even when the calculated cuff covers the hand', async () => {
    const source = await fs.readFile('server/public/media/collection/shirt-model.jpg');
    const coat = catalog.getProduct('coat');
    const garment = await fs.readFile(`server/public/${coat.images.front}`);
    const measurements = {
        heightCm: 160, chestCm: 82, waistCm: 64, hipCm: 88,
        shoulderCm: 36, armLengthCm: 54, handLengthCm: 17
    };
    const assessment = assessRequest({ productId: 'coat', size: 'XL', measurements });
    const prepared = await prepareSizeInputs(
        { buffer: source }, garment, assessment, { points: geometry.defaults, confirmed: true }
    );
    assert.equal(prepared.guide.sleeves[0].wristOffsetCm.toFixed(1), '18.9');
    const oriented = await sharp(source).rotate().png().toBuffer();
    const expected = await sharp(oriented).resize(768, 1024, { fit: 'contain', background: '#f3f1e9' }).png().toBuffer();
    assert.deepEqual(
        await sharp(prepared.person.buffer).removeAlpha().raw().toBuffer(),
        await sharp(expected).removeAlpha().raw().toBuffer()
    );
});
