const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const sharp = require('sharp');
const geometry = require('../server/public/fit-geometry');
const { generate } = require('../server/controllers/tryOnController');
const measurements = { heightCm: 178, chestCm: 100, waistCm: 84, hipCm: 100, shoulderCm: 42, armLengthCm: 70, handLengthCm: 18 };

function response() {
    return {
        statusCode: 200, headers: {}, data: null,
        status(code) { this.statusCode = code; return this; },
        set(key, value) { this.headers[key] = value; return this; },
        json(data) { this.data = data; return this; }
    };
}
async function request(size = 'M') {
    const image = await fs.readFile('server/public/media/collection/shirt-model.jpg');
    return { user: { id: 'test-only-user', bodyMeasurements: { chestCm: 140, heightCm: 210 } }, body: {
        productId: 'shirt', size, measurements, personImage: 'data:image/jpeg;base64,' + image.toString('base64'),
        calibration: { confirmed: true, points: structuredClone(geometry.defaults) },
        garmentImage: 'https://untrusted.invalid/not-accepted.jpg',
        garmentDescription: 'untrusted client description'
    } };
}
function providerStub({ queue, onJoin, image, onUpload }) {
    return async (url, options = {}) => {
        const pathname = new URL(String(url)).pathname;
        if (pathname === '/upload') {
            if (onUpload) await onUpload(options.body);
            return Response.json(['/person.png', '/garment.png', '/mask.png']);
        }
        if (pathname === '/config') return Response.json({
            dependencies: [{ api_name: 'tryon', inputs: [5, 14, 17, 7, 10, 28, 29] }],
            components: [{ id: 5, type: 'imageeditor' }]
        });
        if (pathname === '/queue/join') {
            if (onJoin) onJoin(JSON.parse(options.body));
            return Response.json({ event_id: 'test-event' });
        }
        if (pathname === '/queue/data') return new Response(`data: ${JSON.stringify(queue || {
            msg: 'process_completed', success: true, output: { data: [{ path: '/result.png' }] }
        })}\n\n`);
        if (pathname.startsWith('/file=')) return new Response(image, { headers: { 'Content-Type': 'image/jpeg' } });
        throw new Error('Unexpected provider request');
    };
}

test('IDM adapter sends different measured masks AND references, live laboratory values, and identical seed across sizes', async t => {
    const original = global.fetch;
    t.after(() => { global.fetch = original; });
    const uploadedReferences = [];
    const uploadedMasks = [];
    const payloads = [];
    const image = await sharp('server/public/media/collection/shirt-model.jpg').resize(768, 1024).png().toBuffer();
    global.fetch = providerStub({
        image,
        onJoin: data => payloads.push(data),
        onUpload: async form => {
            assert.equal(form.getAll('files').length, 3);
            uploadedReferences.push(Buffer.from(await form.getAll('files')[1].arrayBuffer()));
            uploadedMasks.push(Buffer.from(await form.getAll('files')[2].arrayBuffer()));
        }
    });
    for (const size of ['XS', 'XL']) {
        const res = response();
        await generate(await request(size), res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.data.size, size);
        assert.equal(res.data.sizeConditioning, 'calibrated-mask-reference-v1');
        assert.equal(res.data.geometry.measurements.chestCm, 100, 'must use laboratory, not stored profile measurement');
        assert.equal(res.data.geometry.measurements.heightCm, 178);
        assert.equal(res.data.geometry.sleeveControl, 'independent-axis-v1');
        assert.equal(res.data.geometry.sleeves[0].lengthCm, size === 'XS' ? 59.6 : 62.4);
        assert.equal(res.data.geometry.armCalibration, 'anatomical-trace-v1');
        assert.equal(res.data.geometry.measurements.armLengthCm, 70);
        assert.equal(res.data.geometry.sleeves[0].sources.armLengthCm, 'laboratory');
        assert.equal(res.data.geometry.sleeves[0].wristOffsetCm.toFixed(1), size === 'XS' ? '-6.4' : '-0.6');
        assert.match(res.data.image, /^data:image\/png;base64,/);
    }
    assert.notEqual(payloads[0].data[2], payloads[1].data[2]);
    assert.match(payloads[0].data[2], /garment 108 cm/);
    assert.match(payloads[1].data[2], /garment 132 cm/);
    assert.match(payloads[0].data[2], /sleeves 59.6 cm from shoulder seam/);
    assert.match(payloads[1].data[2], /sleeves 62.4 cm from shoulder seam/);
    assert.match(payloads[0].data[2], /long sleeves with above-wrist cuffs and visible wrists/);
    assert.match(payloads[1].data[2], /full-length sleeves with cuffs near wrists/);
    assert.equal(payloads[0].data[6], payloads[1].data[6]);
    assert.equal(payloads[0].data[3], false, 'automatic mask must be disabled, otherwise the size mask is ignored');
    assert.equal(payloads[0].data[0].layers.length, 1);
    assert.ok(!payloads[0].data[2].includes('untrusted client'));
    assert.ok(!uploadedReferences[0].equals(uploadedReferences[1]));
    assert.ok(!uploadedMasks[0].equals(uploadedMasks[1]));
});

test('coat fabric color is prioritized and short-arm measurements reach the provider', async t => {
    const original = global.fetch;
    t.after(() => { global.fetch = original; });
    let payload;
    const image = await sharp({ create: { width: 768, height: 1024, channels: 3, background: '#b5a28d' } }).png().toBuffer();
    global.fetch = providerStub({ image, onJoin: value => { payload = value; } });
    const req = await request('XL');
    req.body.productId = 'coat';
    req.body.measurements = { heightCm: 160, chestCm: 82, waistCm: 64, hipCm: 88, shoulderCm: 36, armLengthCm: 54, handLengthCm: 17 };
    const res = response();
    await generate(req, res);
    assert.equal(res.statusCode, 200);
    assert.match(payload.data[2], /^warm muted taupe beige long wool coat\. Matching reference fabric color across torso, shoulders and sleeves\./);
    assert.ok(payload.data[2].indexOf('warm muted taupe beige') < payload.data[2].indexOf('Design measurements'));
    assert.equal(res.data.geometry.sleeves[0].wristOffsetCm.toFixed(1), '18.9');
    assert.equal(res.data.geometry.sleeves[0].handCoverageRatio, 1);
});

test('quota and missing image failures do not return fabricated success', async t => {
    const original = global.fetch;
    t.after(() => { global.fetch = original; });
    for (const [queue, expected] of [
        [{ msg: 'process_completed', success: false, output: { error: 'ZeroGPU quota exhausted' } }, 503],
        [{ msg: 'process_completed', success: true, output: { data: [] } }, 502]
    ]) {
        global.fetch = providerStub({ queue });
        const res = response();
        await generate(await request(), res);
        assert.equal(res.statusCode, expected);
        assert.ok(res.data.message);
        assert.equal(res.data.image, undefined);
    }
});

test('corrupted images and bottoms are rejected before contacting provider', async t => {
    const original = global.fetch;
    t.after(() => { global.fetch = original; });
    global.fetch = async () => { throw new Error('Provider should not be called'); };
    const req = await request();
    const fakeJpeg = Buffer.alloc(20); fakeJpeg[0] = 255; fakeJpeg[1] = 216; fakeJpeg[2] = 255;
    req.body.personImage = 'data:image/jpeg;base64,' + fakeJpeg.toString('base64');
    const corrupt = response();
    await generate(req, corrupt);
    assert.equal(corrupt.statusCode, 400);
    req.body.productId = 'trousers';
    const bottoms = response();
    await generate(req, bottoms);
    assert.equal(bottoms.statusCode, 422);
});

test('concurrent requests for one user are rate-limited and lock is released', async t => {
    const original = global.fetch;
    t.after(() => { global.fetch = original; });
    let release;
    let started;
    const waiting = new Promise(resolve => { release = resolve; });
    const ready = new Promise(resolve => { started = resolve; });
    global.fetch = providerStub({
        image: await sharp('server/public/media/collection/shirt-model.jpg').resize(768, 1024).png().toBuffer(),
        onUpload: async () => { started(); await waiting; }
    });
    const req = await request();
    const first = response();
    const processing = generate(req, first);
    await ready;
    const second = response();
    await generate(req, second);
    assert.equal(second.statusCode, 429);
    release();
    await processing;
    assert.equal(first.statusCode, 200);
    const third = response();
    await generate(req, third);
    assert.equal(third.statusCode, 200);
});

test('HF access failure remains distinct from site authentication and includes safe diagnostic ID', async t => {
    const original = global.fetch;
    t.after(() => { global.fetch = original; });
    global.fetch = async () => new Response('', { status: 401 });
    const res = response();
    await generate(await request(), res);
    assert.equal(res.statusCode, 502, 'provider auth must not clear the site session');
    assert.equal(res.data.code, 'HF_AUTH');
    assert.match(res.data.message, /Hugging Face/);
    assert.ok(res.data.requestId);
});

test('calibration is mandatory and impossible nonelastic sizes never fake body shrinkage', async t => {
    const original = global.fetch;
    t.after(() => { global.fetch = original; });
    global.fetch = async () => { throw new Error('Provider should not be contacted'); };
    const req = await request();
    delete req.body.calibration;
    const noGuide = response();
    await generate(req, noGuide);
    assert.equal(noGuide.statusCode, 422);
    req.body.calibration = { confirmed: true, points: structuredClone(geometry.defaults) };
    req.body.measurements = { ...measurements, chestCm: 170 };
    const tooSmall = response();
    await generate(req, tooSmall);
    assert.equal(tooSmall.statusCode, 422);
    assert.match(tooSmall.data.message, /меньше тела/);
});
