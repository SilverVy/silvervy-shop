const { test } = require('node:test');
const assert = require('node:assert/strict');
const models = require.resolve('../server/models');
require.cache[models] = { id: models, filename: models, loaded: true, exports: { User: {} } };
const { updateProfile } = require('../server/controllers/authController');
function response() { return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } }; }
test('profile keeps omitted values, explicitly clears optional fields and validates shared ranges', async () => {
    const saved = [];
    const user = {
        bodyMeasurements: { weightKg: 85, inseamCm: 80 },
        update: async data => { user.bodyMeasurements = data.bodyMeasurements; saved.push(structuredClone(data.bodyMeasurements)); }
    };
    const body = { heightCm: 160, chestCm: 82, waistCm: 64, hipCm: 88, shoulderCm: '36.5', armLengthCm: '54.5', handLengthCm: '17.2' };
    const res = response();
    await updateProfile({ user, body }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(saved[0], { weightKg: 85, inseamCm: 80, ...body, shoulderCm: 36.5, armLengthCm: 54.5, handLengthCm: 17.2 });
    for (const key of ['shoulderCm', 'armLengthCm', 'handLengthCm']) {
        const invalid = response();
        await updateProfile({ user, body: { ...body, [key]: -1 } }, invalid);
        assert.equal(invalid.statusCode, 400);
    }
    await updateProfile({ user, body: { heightCm: 160, shoulderCm: '', armLengthCm: null, handLengthCm: '' } }, response());
    assert.deepEqual(saved[1], { weightKg: 85, inseamCm: 80, heightCm: 160, chestCm: 82, waistCm: 64, hipCm: 88 });
    assert.equal(saved.length, 2);
});

test('profile accepts every shared boundary and rejects values just outside it', async () => {
    const ranges = require('../server/public/fit-engine').ranges;
    const user = { bodyMeasurements: {}, update: async data => { user.bodyMeasurements = data.bodyMeasurements; } };
    for (const [key, [min, max]] of Object.entries(ranges)) {
        for (const value of [min, max]) {
            const valid = response();
            await updateProfile({ user, body: { [key]: value } }, valid);
            assert.equal(valid.statusCode, 200, `${key}=${value}`);
        }
        for (const value of [min - 0.1, max + 0.1]) {
            const invalid = response();
            await updateProfile({ user, body: { [key]: value } }, invalid);
            assert.equal(invalid.statusCode, 400, `${key}=${value}`);
        }
    }
});
