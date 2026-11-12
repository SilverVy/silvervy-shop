const { test } = require('node:test');
const assert = require('node:assert/strict');
const models = require.resolve('../server/models');
require.cache[models] = { id: models, filename: models, loaded: true, exports: { User: {} } };
const { updateProfile } = require('../server/controllers/authController');
function response() { return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } }; }
test('profile saves decimal arm measurements, clears omitted optional fields and rejects invalid values', async () => {
    const saved = [];
    const user = { update: async data => saved.push(data.bodyMeasurements) };
    const body = { heightCm: 160, chestCm: 82, waistCm: 64, hipCm: 88, shoulderCm: '36.5', armLengthCm: '54.5', handLengthCm: '17.2' };
    const res = response();
    await updateProfile({ user, body }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(saved[0], { ...body, shoulderCm: 36.5, armLengthCm: 54.5, handLengthCm: 17.2 });
    for (const key of ['shoulderCm', 'armLengthCm', 'handLengthCm']) {
        const invalid = response();
        await updateProfile({ user, body: { ...body, [key]: -1 } }, invalid);
        assert.equal(invalid.statusCode, 400);
    }
    await updateProfile({ user, body: { heightCm: 160, shoulderCm: '', armLengthCm: null, handLengthCm: '' } }, response());
    assert.deepEqual(saved[1], { heightCm: 160 });
    assert.equal(saved.length, 2);
});
