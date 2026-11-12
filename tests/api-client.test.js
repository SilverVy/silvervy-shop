const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createClient, resolveBase } = require('../server/public/api-client');

test('same-origin preview remains separate from the original split Render deployment', () => {
    assert.equal(resolveBase({ hostname: 'example.replit.dev' }), '');
    assert.equal(resolveBase({ hostname: 'silvervy-frontend.onrender.com' }), 'https://silvervy-backend.onrender.com');
    assert.equal(resolveBase({ hostname: 'silvervy-backend.onrender.com' }), '');
    assert.equal(resolveBase({ hostname: 'silvervy-frontend.onrender.com' }, ''), '');
});

test('one API base is used for accounts, cart, preview and the methodology download', async () => {
    const calls = [];
    const client = createClient({ baseUrl: 'https://api.example.test/', fetchImpl: async (...args) => { calls.push(args); return { ok: true }; } });
    for (const path of ['/api/status', '/api/auth/profile', '/api/cart', '/api/orders', '/api/try-on']) {
        await client.request(path, { method: 'GET' });
        assert.equal(calls.at(-1)[0], 'https://api.example.test' + path);
    }
    assert.equal(client.url('/fit-methodology.md'), 'https://api.example.test/fit-methodology.md');
    assert.equal(createClient().url('/api/status'), '/api/status');
});

test('API configuration cannot inject credentials or protocol-relative targets', () => {
    for (const baseUrl of ['javascript:alert(1)', 'https://user:password@example.test', 'https://example.test/?token=x']) {
        assert.throws(() => createClient({ baseUrl }));
    }
    assert.throws(() => createClient().url('//untrusted.example/api/status'));
    assert.throws(() => createClient().url('https://untrusted.example/api/status'));
});
