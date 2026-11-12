const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
process.env.CATALOG_ONLY = '1';
const app = require('../server/app');

test('public catalog mode exposes real calculation but never pretends accounts or GPU are available', async () => {
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    try {
        const status = await (await fetch(`${base}/api/status`)).json();
        assert.equal(status.mode, 'catalog-only');
        assert.equal(status.tryOnAvailable, false);
        const products = await (await fetch(`${base}/api/catalog`)).json();
        assert.equal(products.products.length, 8);
        const response = await fetch(`${base}/api/fit`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: 'shirt', size: 'M', measurements: { chestCm: 100, waistCm: 84, hipCm: 100 } }) });
        assert.equal(response.status, 200);
        const fit = await response.json();
        assert.equal(fit.rows.find(row => row.size === 'M').checks[0].easeCm, 20);
        const bad = await fetch(`${base}/api/fit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        assert.equal(bad.status, 404);
        for (const endpoint of ['/api/try-on', '/api/auth/login']) {
            const unavailable = await fetch(base + endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
            assert.equal(unavailable.status, 503);
            assert.ok((await unavailable.json()).message);
        }
    } finally {
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    }
});
