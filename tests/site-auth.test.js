const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
// Stub only the DB module in this isolated test process: no production data or auth bypass in the app.
const modelsPath = require.resolve('../server/models');
const fakeUser = { id: 'fixture-user' };
require.cache[modelsPath] = { id: modelsPath, filename: modelsPath, loaded: true, exports: { User: { findByPk: async () => fakeUser } } };
const { authenticate } = require('../server/middlewares/authMiddleware');
function response() {
    return { statusCode: 200, data: null, status(code) { this.statusCode = code; return this; },
        json(data) { this.data = data; return this; } };
}
test('site authentication distinguishes missing, expired, provider tokens, bad signature and DB failures', async t => {
    const prior = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'isolated-test-secret-not-a-real-credential';
    t.after(() => { if (prior === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = prior; });
    const logs = [];
    t.mock.method(console, 'warn', value => logs.push(value));
    for (const [token, expected] of [
        ['', 'AUTH_REQUIRED'], ['hf_fixtureNotARealCredential', 'AUTH_WRONG_TOKEN_TYPE'],
        [jwt.sign({ id: fakeUser.id }, process.env.JWT_SECRET, { expiresIn: -1 }), 'AUTH_EXPIRED'],
        [jwt.sign({ id: fakeUser.id }, 'different-isolated-key'), 'AUTH_INVALID']
    ]) {
        const res = response();
        await authenticate({ header: () => token ? `Bearer ${token}` : undefined }, res, () => assert.fail('must not authorize'));
        assert.equal(res.statusCode, 401); assert.equal(res.data.code, expected); assert.ok(res.data.requestId);
        if (token) assert.ok(!JSON.stringify(logs).includes(token), 'logs must not contain any token');
    }
    const token = jwt.sign({ id: fakeUser.id }, process.env.JWT_SECRET);
    let called = false;
    const req = { header: () => `Bearer ${token}` };
    await authenticate(req, response(), () => { called = true; });
    assert.ok(called); assert.equal(req.user, fakeUser);
    require.cache[modelsPath].exports.User.findByPk = async () => { throw new Error('internal database failure'); };
    const database = response();
    await authenticate(req, database, () => assert.fail());
    assert.equal(database.statusCode, 503); assert.equal(database.data.code, 'AUTH_DATABASE');
    assert.ok(!JSON.stringify(database.data).includes('internal database failure'));
});
