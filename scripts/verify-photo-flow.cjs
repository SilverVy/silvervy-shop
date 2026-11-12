const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');

async function verify() {
    const base = process.env.BASE_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://127.0.0.1:5000');
    const browser = await chromium.launch({
        executablePath: process.env.CHROMIUM_PATH || '/repl/tools/bin/chromium',
        headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.stack || error.message));
    const image = 'data:image/jpeg;base64,' + (await fs.readFile('server/public/media/collection/shirt-model.jpg')).toString('base64');
    const requests = [];
    const profileWrites = [];
    let scenario = 'success';
    let finishDelay;
    let startDelay;
    await page.route('**/photo-landmarks.js', route => route.fulfill({
        contentType: 'application/javascript',
        body: `window.SilverVyPhotoLandmarks = { estimate: async (_image, defaults) => {
            const automaticKeys = ['shoulderLeft', 'shoulderRight', 'elbowLeft', 'elbowRight', 'wristLeft', 'wristRight'];
            return { points: structuredClone(defaults), automaticKeys,
                estimatedKeys: Object.keys(defaults).filter(key => !automaticKeys.includes(key)), warnings: ['Browser-test estimate'] };
        } };`
    }));
    await page.route('**/api/auth/profile', async route => {
        if (route.request().method() === 'GET') return route.fulfill({ json: { user: { bodyMeasurements: {
            chestCm: 100, waistCm: 84, hipCm: 100, heightCm: 178, shoulderCm: 36,
            armLengthCm: 54, handLengthCm: 17, weightKg: 85
        } } } });
        const payload = route.request().postDataJSON();
        profileWrites.push(payload);
        return route.fulfill({ json: { message: 'Параметры сохранены', bodyMeasurements: payload } });
    });
    await page.route('**/api/status', route => route.fulfill({
        json: { mode: 'full', tryOnAvailable: true, message: 'Controlled browser-test fixture; not a live provider.' }
    }));
    await page.route('**/api/try-on', async route => {
        requests.push(route.request().postDataJSON());
        const selected = scenario;
        if (selected === 'deferred') await new Promise(resolve => { finishDelay = resolve; startDelay(); });
        if (selected === 'quota') return route.fulfill({ status: 503, json: { message: 'У модели исчерпана квота. Попробуйте позже.' } });
        if (selected === 'expired') return route.fulfill({ status: 401, json: { code: 'AUTH_EXPIRED', message: 'Сеанс истёк. Войдите заново.' } });
        if (selected === 'invalid') return route.fulfill({ json: {} });
        return route.fulfill({ json: {
            image, provider: 'Fixture only — no live inference', sizeConditioning: 'calibrated-mask-reference-v1',
            fitNotice: 'Browser test fixture, not real generated output.', fit: { recommendedSize: 'S' }
        } });
    });
    async function waitText(text) {
        await page.waitForFunction(value => document.querySelector('#photoStatus').textContent.includes(value), text);
    }
    try {
        await page.goto(`${base}/fitting.html?product=shirt&size=M`, { waitUntil: 'networkidle' });
        for (const [key, value] of Object.entries({ chestCm: '100', waistCm: '84', hipCm: '100', heightCm: '178',
            shoulderCm: '36', armLengthCm: '54', handLengthCm: '17' })) {
            await page.locator(`[name="${key}"]`).fill(value);
        }
        await page.locator('#photoTitle').click();
        await page.locator('#generatePhoto').click();
        await waitText('войдите в аккаунт');
        assert.equal(requests.length, 0);
        await page.evaluate(() => localStorage.setItem('token', 'browser-fixture-only-not-a-real-token'));
        await page.evaluate(() => localStorage.setItem('user', JSON.stringify({
            id: 'browser-fixture', name: 'Test', email: 'test@example.invalid'
        })));
        await page.locator('#importProfile').click();
        await page.waitForFunction(() => document.querySelector('[name="handLengthCm"]').value === '17');
        assert.equal(await page.locator('[name="weightKg"]').count(), 0, 'profile-only weight must stay out of lab inputs');
        await page.locator('#generatePhoto').click();
        await waitText('подтвердите отдельное согласие');
        await page.locator('#personPhoto').setInputFiles('server/public/media/collection/shirt-model.jpg');
        await page.locator('#generatePhoto').click();
        assert.equal(requests.length, 0, 'photo must not be sent before consent');
        await page.locator('#photoConsent').check();
        await page.locator('.calibration-stage svg').waitFor();
        await page.waitForFunction(() => !document.querySelector('.calibration-detection-status').textContent.includes('Выполняется'));
        assert.match(await page.locator('.calibration-status').textContent(), /рукав 61 см/);
        await page.locator('#generatePhoto').click();
        await waitText('опорные точки на фото');
        assert.equal(requests.length, 0);
        assert.ok(await page.locator('.calibration-confirm').isDisabled(), 'automatic suggestions still require review');
        for (let i = 0; i < 17; i++) await page.locator('.calibration-review').click();
        assert.ok(await page.locator('.calibration-confirm').isEnabled());
        assert.match(await page.locator('.calibration-reference img').getAttribute('src'), /coat-calibrated-XL\.png/);
        await page.locator('.calibration-reset').click();
        assert.ok(await page.locator('.calibration-confirm').isDisabled());
        assert.match(await page.locator('.calibration-review-status').textContent(), /отмечено: 0 из 17/);
        for (let i = 0; i < 17; i++) await page.locator('.calibration-review').click();
        await page.locator('.calibration-confirm').check();
        await page.locator('#photoCalibration').screenshot({ path: 'generated-artifacts/calibration-desktop.jpg' });
        await page.locator('#generatePhoto').click();
        await waitText('Модель вернула изображение');
        assert.match(await page.locator('#photoStatus').textContent(), /посадка не подтверждена/i);
        assert.match(await page.locator('#photoResult').textContent(),
            /Проверьте манжеты, кисти, остатки исходной одежды, цвет и силуэт вручную/i);
        assert.equal(await page.locator('#photoResult img').count(), 1);
        assert.equal(requests[0].productId, 'shirt');
        assert.equal(requests[0].size, 'M');
        assert.equal(requests[0].measurements.chestCm, 100);
        assert.equal(requests[0].calibration.confirmed, true);
        assert.equal(Object.keys(requests[0].calibration.points).length, 17);
        assert.equal(requests[0].measurements.shoulderCm, 36);
        assert.equal(requests[0].measurements.armLengthCm, 54);
        assert.equal(requests[0].measurements.handLengthCm, 17);
        assert.equal(requests[0].garmentImage, undefined);
        assert.match(requests[0].personImage, /^data:image\/jpeg;base64,/);
        await page.locator('[name="waistCm"]').fill('85');
        assert.equal(await page.locator('#photoResult img').count(), 0, 'previous photo must disappear when measurements change');
        await page.waitForFunction(() => document.querySelector('#profileSource').textContent.includes('синхронизированы'));
        assert.equal(profileWrites.at(-1).waistCm, 85);
        assert.equal(Object.hasOwn(profileWrites.at(-1), 'weightKg'), false, 'lab sync must not overwrite profile-only weight');
        await page.locator('[data-size="XL"]').click();
        assert.match(await page.locator('.calibration-status').textContent(), /рукав 62.4 см/);
        await page.locator('[name="chestCm"]').fill('118');
        await page.locator('[data-size="XS"]').click();
        assert.equal(await page.locator('#generatePhoto').isDisabled(), true);
        assert.match(await page.locator('#photoSizeFitNotice').textContent(), /меньше тела/);
        await page.locator('[name="chestCm"]').fill('100');
        await page.locator('[data-size="XL"]').click();
        assert.equal(await page.locator('#generatePhoto').isEnabled(), true);
        for (const [selected, text] of [['quota', 'исчерпана квота'], ['expired', 'Войдите заново'], ['invalid', 'не вернул корректное изображение']]) {
            await page.evaluate(() => localStorage.setItem('token', 'browser-fixture-only-not-a-real-token'));
            scenario = selected;
            await page.locator('#generatePhoto').click();
            await waitText(text);
            assert.equal(await page.locator('#photoResult img').count(), 0);
            assert.equal(await page.locator('#generatePhoto').isEnabled(), true);
            if (selected === 'expired') assert.equal(await page.evaluate(() => localStorage.getItem('token')), null);
        }
        assert.equal(requests.at(-1).size, 'XL');
        scenario = 'deferred';
        const started = new Promise(resolve => { startDelay = resolve; });
        await page.locator('#generatePhoto').click();
        await started;
        await page.locator('[name="chestCm"]').fill('101');
        finishDelay();
        await waitText('Устаревший результат скрыт');
        assert.equal(await page.locator('#photoResult img').count(), 0);
        const count = requests.length;
        await page.locator('#productSelect').selectOption('trousers');
        await page.locator('#generatePhoto').click();
        await waitText('только верхнюю одежду');
        assert.equal(requests.length, count);
        const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
        assert.ok(!stored.includes('data:image/'), 'photo must never be put in browser storage');
        assert.deepEqual(errors, []);
        console.log('Photo UI fixture checks passed: profile import/save, calibration review, reference image, consent, payload, too-small-size block, provider failure states, stale-result suppression, bottoms restriction and no photo storage. No live inference request was made.');
    } finally {
        if (finishDelay) finishDelay();
        await context.close();
        await browser.close();
    }
}
verify().catch(error => { console.error(error); process.exitCode = 1; });
