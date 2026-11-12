const { test } = require('node:test');
const assert = require('node:assert/strict');
const geometry = require('../server/public/fit-geometry');
const { mapLandmarks } = require('../server/public/photo-landmarks');

function landmark(x, y, confidence = 0.95) {
    return { x, y, visibility: confidence, presence: confidence };
}

function samplePose() {
    const pose = Array.from({ length: 33 }, () => landmark(0.5, 0.5, 0));
    Object.assign(pose, {
        0: landmark(.5, .1), 7: landmark(.46, .075), 8: landmark(.54, .075),
        11: landmark(.42, .22), 13: landmark(.35, .38), 15: landmark(.31, .52),
        12: landmark(.58, .22), 14: landmark(.65, .38), 16: landmark(.69, .52),
        23: landmark(.47, .5), 24: landmark(.53, .5),
        27: landmark(.44, .92), 28: landmark(.56, .92),
        29: landmark(.44, .94), 30: landmark(.56, .94),
        31: landmark(.43, .96), 32: landmark(.57, .96)
    });
    return pose;
}

test('photo pose and hand landmarks map to each uploaded image, including screen-side ordering', () => {
    const maskData = new Float32Array(100 * 100);
    for (let y = 20; y <= 55; y++) {
        const halfWidth = y < 34 ? 15 : y < 45 ? 11 : 14;
        for (let x = 50 - halfWidth; x <= 50 + halfWidth; x++) maskData[y * 100 + x] = 0.95;
    }
    const mask = { width: 100, height: 100, getAsFloat32Array: () => maskData };
    const leftHand = Array.from({ length: 21 }, () => landmark(.31, .55));
    const rightHand = Array.from({ length: 21 }, () => landmark(.69, .55));
    leftHand[0] = landmark(.31, .52); leftHand[12] = landmark(.30, .62);
    rightHand[0] = landmark(.69, .52); rightHand[12] = landmark(.70, .62);
    const result = mapLandmarks(samplePose(), [leftHand, rightHand], mask, geometry.defaults);

    assert.equal(result.points.shoulderLeft.x, .42);
    assert.equal(result.points.shoulderRight.x, .58);
    assert.equal(result.points.handTipLeft.x, .3);
    assert.equal(result.points.handTipRight.x, .7);
    assert.ok(result.points.chestLeft.x < result.points.waistLeft.x);
    assert.ok(result.points.hipRight.x > result.points.waistRight.x);
    assert.equal(result.automaticKeys.length + result.estimatedKeys.length, Object.keys(geometry.defaults).length);
    assert.ok(result.estimatedKeys.includes('crown'));
    assert.ok(result.estimatedKeys.includes('feet'));
});

test('photo pose falls back explicitly when torso segmentation and hand detection are unavailable', () => {
    const result = mapLandmarks(samplePose(), [], null, geometry.defaults);
    assert.ok(result.estimatedKeys.includes('chestLeft'));
    assert.ok(result.estimatedKeys.includes('handTipLeft'));
    assert.ok(result.warnings.some(message => message.includes('оценена по позе')));
    assert.ok(result.warnings.some(message => message.includes('Конец кисти')));
    assert.ok(result.automaticKeys.length < Object.keys(geometry.defaults).length);
});

test('photo pose rejects an unclear or partial arm instead of silently reusing its marker', () => {
    const pose = samplePose();
    pose[14] = landmark(.65, .38, 0.1);
    assert.throws(() => mapLandmarks(pose, [], null, geometry.defaults), /оба плеча, локтя и запястья/);
});
