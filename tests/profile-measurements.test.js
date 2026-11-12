const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mergeProfile } = require('../server/public/profile-measurements');
test('profile prefills laboratory but never replaces currently edited values', () => {
    const merged = mergeProfile({ chestCm: '105', waistCm: '' }, { chestCm: 99, waistCm: 83, heightCm: 180 }, new Set(['chestCm']));
    assert.equal(merged.chestCm, '105');
    assert.equal(merged.waistCm, '83');
    assert.equal(merged.heightCm, '180');
    assert.equal(mergeProfile({}, { chestCm: null, waistCm: 'NaN' }).waistCm, undefined);
    const arm = mergeProfile({ armLengthCm: '56' }, { shoulderCm: 36, armLengthCm: 54, handLengthCm: 17 }, new Set(['armLengthCm']));
    assert.equal(arm.armLengthCm, '56');
    assert.equal(arm.shoulderCm, '36');
    assert.equal(arm.handLengthCm, '17');
});
