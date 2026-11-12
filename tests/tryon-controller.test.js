const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { generate } = require('../server/controllers/tryOnController');
const measurements = { heightCm: 178, chestCm: 100, waistCm: 84, hipCm: 100 };

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
    return { user: { id: 'test-only-user' }, body: {
        productId: 'shirt', size, measurements, personImage: 'data:image/jpeg;base64,' + image.toString('base64'),
        garmentImage: 'https://untrusted.invalid/not-accepted.jpg',
        garmentDescription: 'untrusted client description'
    } };
}
function providerStub({ queue, onJoin, image, onUpload }) {
    return async (url, options = {}) => {
        const pathname = new URL(String(url)).pathname;
        if (pathname === '/upload') {
            if (onUpload) await onUpload(options.body);
            return Response.json(['/person.jpg', '/garment.jpg']);
        }
        if (pathname === '/config') return Response.json({ dependencies: [{ api_name: 'tryon' }] });
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

test('IDM adapter uses trusted garment, dimension-specific prompts and identical seed across sizes', async t => {
    const original = global.fetch;
    t.after(() => { global.fetch = original; });
    const uploadedReferences = [];
    const payloads = [];
    const image = await fs.readFile('server/public/media/collection/shirt-model.jpg');
    global.fetch = providerStub({
        image,
        onJoin: data => payloads.push(data),
        onUpload: async form => uploadedReferences.push(Buffer.from(await form.getAll('files')[1].arrayBuffer()))
    });
    for (const size of ['XS', 'XL']) {
        const res = response();
        await generate(await request(size), res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.data.size, size);
        assert.equal(res.data.sizeConditioning, 'text-only');
        assert.match(res.data.image, /^data:image\/jpeg;base64,/);
    }
    assert.notEqual(payloads[0].data[2], payloads[1].data[2]);
    assert.match(payloads[0].data[2], /garment 108 cm/);
    assert.match(payloads[1].data[2], /garment 132 cm/);
    assert.equal(payloads[0].data[6], payloads[1].data[6]);
    assert.ok(!payloads[0].data[2].includes('untrusted client'));
    assert.ok(uploadedReferences[0].equals(await fs.readFile('server/public/media/collection/shirt-front.jpg')));
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
        image: await fs.readFile('server/public/media/collection/shirt-model.jpg'),
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
