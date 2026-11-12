(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.SilverVyPhotoLandmarks = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const version = '0.10.14';
    const wasmRoot = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${version}/wasm`;
    const poseModel = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
    const handModel = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
    let visionPromise;
    let posePromise;
    let handPromise;

    function pointOf(landmark) {
        return landmark && Number.isFinite(landmark.x) && Number.isFinite(landmark.y)
            ? { x: landmark.x, y: landmark.y } : null;
    }
    function confidence(landmark) {
        if (!landmark) return 0;
        const values = [landmark.visibility, landmark.presence].filter(Number.isFinite);
        return values.length ? Math.min(...values) : 0.6;
    }
    function usable(landmark, threshold = 0.35) {
        const point = pointOf(landmark);
        return point && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1 &&
            confidence(landmark) >= threshold ? point : null;
    }
    function average(points) {
        const valid = points.filter(Boolean);
        if (!valid.length) return null;
        return { x: valid.reduce((sum, point) => sum + point.x, 0) / valid.length,
            y: valid.reduce((sum, point) => sum + point.y, 0) / valid.length };
    }
    function clampPoint(point) {
        return { x: Math.max(0.005, Math.min(0.995, point.x)), y: Math.max(0.005, Math.min(0.995, point.y)) };
    }
    function maskSpan(mask, y, centerX) {
        if (!mask) return null;
        try {
            const width = mask.width || mask.getWidth?.();
            const height = mask.height || mask.getHeight?.();
            const data = mask.getAsFloat32Array?.() || mask.getAsUint8Array?.();
            if (!width || !height || !data || data.length < width * height) return null;
            const byteMask = data instanceof Uint8Array;
            const threshold = byteMask ? 72 : 0.33;
            const row = Math.max(0, Math.min(height - 1, Math.round(y * (height - 1))));
            const offsets = [-2, -1, 0, 1, 2].map(delta => Math.max(0, Math.min(height - 1, row + delta)));
            const spans = [];
            for (const rowIndex of offsets) {
                const hits = [];
                const start = rowIndex * width;
                for (let x = 0; x < width; x++) if (data[start + x] >= threshold) hits.push(x);
                if (!hits.length) continue;
                const runs = [];
                let runStart = hits[0], last = hits[0];
                for (const x of hits.slice(1)) {
                    if (x > last + 1) { runs.push([runStart, last]); runStart = x; }
                    last = x;
                }
                runs.push([runStart, last]);
                const center = centerX * width;
                const chosen = runs.find(([left, right]) => center >= left && center <= right) ||
                    runs.sort((a, b) => Math.min(Math.abs(center - a[0]), Math.abs(center - a[1])) -
                        Math.min(Math.abs(center - b[0]), Math.abs(center - b[1])))[0];
                if (chosen) spans.push({ left: chosen[0] / width, right: chosen[1] / width });
            }
            if (!spans.length) return null;
            return {
                left: spans.reduce((sum, span) => sum + span.left, 0) / spans.length,
                right: spans.reduce((sum, span) => sum + span.right, 0) / spans.length
            };
        } catch {
            return null;
        }
    }

    function mapLandmarks(pose, hands = [], mask = null, defaults = {}) {
        if (!Array.isArray(pose) || pose.length < 33) throw new Error('Не удалось распознать человека. Расставьте точки вручную.');
        const points = structuredClone(defaults || {});
        const automaticKeys = [];
        const estimatedKeys = [];
        const warnings = [];
        const assign = (key, point, estimated = false) => {
            if (!point || !points[key]) return;
            points[key] = clampPoint(point);
            (estimated ? estimatedKeys : automaticKeys).push(key);
        };
        const visible = index => usable(pose[index]);
        const anatomicalSides = [
            { shoulder: visible(11), elbow: visible(13), wrist: visible(15) },
            { shoulder: visible(12), elbow: visible(14), wrist: visible(16) }
        ].filter(side => side.shoulder && side.elbow && side.wrist)
            .sort((a, b) => a.shoulder.x - b.shoulder.x);
        if (anatomicalSides.length !== 2) throw new Error('Не удалось уверенно определить оба плеча, локтя и запястья. Проверьте фронтальную позу и расставьте точки вручную.');

        const imageLeft = anatomicalSides[0];
        const imageRight = anatomicalSides[1];
        for (const [sideName, side] of [['Left', imageLeft], ['Right', imageRight]]) {
            assign(`shoulder${sideName}`, side.shoulder);
            assign(`elbow${sideName}`, side.elbow);
            assign(`wrist${sideName}`, side.wrist);
        }

        const shoulders = average([imageLeft.shoulder, imageRight.shoulder]);
        const hips = average([visible(23), visible(24)]);
        if (!hips) throw new Error('Не удалось уверенно определить линию бёдер. Расставьте точки вручную.');
        const shoulderSpan = Math.abs(imageRight.shoulder.x - imageLeft.shoulder.x);
        const hipSpan = Math.abs((visible(24)?.x ?? hips.x) - (visible(23)?.x ?? hips.x));
        const chestY = shoulders.y + (hips.y - shoulders.y) * 0.22;
        const waistY = shoulders.y + (hips.y - shoulders.y) * 0.68;
        const torsoCenterX = (shoulders.x + hips.x) / 2;
        const detectedChestSpan = maskSpan(mask, chestY, torsoCenterX);
        const detectedWaistSpan = maskSpan(mask, waistY, torsoCenterX);
        const detectedHipSpan = maskSpan(mask, hips.y, torsoCenterX);
        const chestSpan = detectedChestSpan ||
            { left: torsoCenterX - shoulderSpan * 0.41, right: torsoCenterX + shoulderSpan * 0.41 };
        const waistSpan = detectedWaistSpan ||
            { left: torsoCenterX - hipSpan * 0.51, right: torsoCenterX + hipSpan * 0.51 };
        const hipSpanAtBody = detectedHipSpan ||
            { left: torsoCenterX - hipSpan * 0.56, right: torsoCenterX + hipSpan * 0.56 };
        const chestEstimated = !detectedChestSpan, waistEstimated = !detectedWaistSpan, hipEstimated = !detectedHipSpan;
        if (chestEstimated || waistEstimated || hipEstimated) warnings.push('Часть линий торса оценена по позе, а не найдена по контуру; проверьте грудь, талию и бёдра вручную.');
        assign('chestLeft', { x: chestSpan.left, y: chestY }, chestEstimated);
        assign('chestRight', { x: chestSpan.right, y: chestY }, chestEstimated);
        assign('waistLeft', { x: waistSpan.left, y: waistY }, waistEstimated);
        assign('waistRight', { x: waistSpan.right, y: waistY }, waistEstimated);
        assign('hipLeft', { x: hipSpanAtBody.left, y: hips.y }, hipEstimated);
        assign('hipRight', { x: hipSpanAtBody.right, y: hips.y }, hipEstimated);

        const ears = [visible(7), visible(8)].filter(Boolean);
        const nose = visible(0);
        const headWidth = ears.length === 2 ? Math.abs(ears[1].x - ears[0].x) : shoulderSpan * 0.32;
        const crownY = Math.max(0.005, Math.min(...ears.map(point => point.y), nose?.y ?? shoulders.y) - headWidth * 0.34);
        assign('crown', { x: shoulders.x, y: crownY }, true);
        assign('neck', { x: shoulders.x, y: shoulders.y - shoulderSpan * 0.10 }, true);
        const feet = [27, 28, 29, 30, 31, 32].map(visible).filter(Boolean);
        if (feet.length) assign('feet', { x: average(feet).x, y: Math.max(...feet.map(point => point.y)) }, true);
        else warnings.push('Не удалось найти стопы целиком; проверьте нижнюю точку масштаба.');

        const remainingHands = hands.filter(hand => Array.isArray(hand) && hand.length > 12);
        for (const [sideName, side] of [['Left', imageLeft], ['Right', imageRight]]) {
            let bestIndex = -1, bestDistance = Infinity;
            remainingHands.forEach((hand, index) => {
                const handWrist = pointOf(hand[0]);
                if (!handWrist) return;
                const distance = Math.hypot(handWrist.x - side.wrist.x, handWrist.y - side.wrist.y);
                if (distance < bestDistance) { bestDistance = distance; bestIndex = index; }
            });
            if (bestIndex >= 0 && bestDistance < 0.17) {
                const hand = remainingHands.splice(bestIndex, 1)[0];
                assign(`handTip${sideName}`, pointOf(hand[12]));
            } else {
                assign(`handTip${sideName}`, {
                    x: side.wrist.x + (side.wrist.x - side.elbow.x) * 0.55,
                    y: side.wrist.y + (side.wrist.y - side.elbow.y) * 0.55
                }, true);
                warnings.push(`Конец кисти ${sideName === 'Left' ? 'слева' : 'справа'} оценён по направлению предплечья; проверьте его вручную.`);
            }
        }
        return { points, automaticKeys, estimatedKeys, warnings };
    }

    async function loadVision() {
        if (!visionPromise) visionPromise = import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${version}/vision_bundle.mjs`);
        return visionPromise;
    }
    async function createTask(TaskClass, wasm, options) {
        try {
            return await TaskClass.createFromOptions(wasm, { ...options, baseOptions: { ...options.baseOptions, delegate: 'GPU' } });
        } catch {
            return TaskClass.createFromOptions(wasm, { ...options, baseOptions: { ...options.baseOptions, delegate: 'CPU' } });
        }
    }
    async function getPoseLandmarker() {
        if (!posePromise) posePromise = (async () => {
            const vision = await loadVision();
            const wasm = await vision.FilesetResolver.forVisionTasks(wasmRoot);
            return createTask(vision.PoseLandmarker, wasm, {
                baseOptions: { modelAssetPath: poseModel }, runningMode: 'IMAGE', numPoses: 1, outputSegmentationMasks: true
            });
        })();
        return posePromise;
    }
    async function getHandLandmarker() {
        if (!handPromise) handPromise = (async () => {
            const vision = await loadVision();
            const wasm = await vision.FilesetResolver.forVisionTasks(wasmRoot);
            return createTask(vision.HandLandmarker, wasm, {
                baseOptions: { modelAssetPath: handModel }, runningMode: 'IMAGE', numHands: 2
            });
        })();
        return handPromise;
    }
    async function estimate(image, defaults) {
        const poseTask = await getPoseLandmarker();
        const result = poseTask.detect(image);
        const pose = result.landmarks?.[0];
        if (!pose) throw new Error('Человек не найден. Проверьте, что фото показывает человека целиком анфас.');
        let hands = [];
        const warnings = [];
        try {
            const handTask = await getHandLandmarker();
            hands = handTask.detect(image).landmarks || [];
        } catch {
            warnings.push('Модель кистей не загрузилась; точки конца кисти оценены по направлению предплечья.');
        }
        const mapped = mapLandmarks(pose, hands, result.segmentationMasks?.[0] || null, defaults);
        if (result.segmentationMasks?.[0]?.close) result.segmentationMasks[0].close();
        return { ...mapped, warnings: [...warnings, ...mapped.warnings] };
    }

    return { mapLandmarks, estimate };
});
