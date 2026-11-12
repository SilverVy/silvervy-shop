const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
async function main() {
    const base = process.env.BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/repl/tools/bin/chromium',
        headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let profile = { chestCm: 100, waistCm: 84, hipCm: 100, heightCm: 178, inseamCm: 80, shoulderCm: 36, armLengthCm: 54, handLengthCm: 17 };
    let status = 200;
    await context.addInitScript(() => {
        localStorage.setItem('token', 'isolated-browser-fixture');
        localStorage.setItem('user', JSON.stringify({ id: 'profile-fixture' }));
    });
    let saved = null;
    await page.route('**/api/auth/profile', route => {
        if (route.request().method() === 'PUT') {
            saved = route.request().postDataJSON();
            profile = Object.fromEntries(Object.entries(saved).filter(([, value]) => value !== '' && value != null)
                .map(([key, value]) => [key, Number(value)]));
            return route.fulfill({ json: { message: 'Параметры сохранены', bodyMeasurements: profile } });
        }
        return route.fulfill({ status,
            json: status === 200 ? { user: { bodyMeasurements: profile } } : { message: 'Fixture unavailable' } });
    });
    try {
        await page.goto(`${base}/fitting.html?product=shirt`, { waitUntil: 'networkidle' });
        assert.equal(await page.locator('[name="chestCm"]').inputValue(), '100');
        assert.equal(await page.locator('[name="heightCm"]').inputValue(), '178');
        for (const key of ['shoulderCm', 'armLengthCm', 'handLengthCm']) assert.equal(await page.locator(`[name="${key}"]`).inputValue(), String(profile[key]));
        await page.locator('[name="armLengthCm"]').fill('55.5');
        await page.locator('[name="chestCm"]').fill('105');
        profile = { ...profile, chestCm: 99, waistCm: 82 };
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await page.waitForFunction(() => document.querySelector('[name=waistCm]').value === '82');
        assert.equal(await page.locator('[name="chestCm"]').inputValue(), '105', 'background profile loading must preserve current edits');
        assert.equal(await page.locator('[name="armLengthCm"]').inputValue(), '55.5');
        assert.match(await page.locator('#photoRequestMeta').textContent(), /рука 55.5/);
        assert.match(await page.locator('.sv-sleeve-summary').textContent(), /кисти/);
        assert.match(await page.locator('#photoRequestMeta').textContent(), /105/);
        await page.locator('#importProfile').click();
        await page.waitForFunction(() => document.querySelector('[name=chestCm]').value === '99');
        assert.equal(await page.locator('[name="armLengthCm"]').inputValue(), '54');
        await page.locator('[name="chestCm"]').fill('106');
        await page.reload({ waitUntil: 'networkidle' });
        assert.equal(await page.locator('[name="chestCm"]').inputValue(), '106', 'same-account session draft must survive reload');
        assert.equal(await page.locator('[name="handLengthCm"]').inputValue(), '17');
        status = 503;
        await page.locator('#importProfile').click();
        await page.waitForFunction(() => document.querySelector('#profileSource').textContent.includes('Fixture unavailable'));
        assert.equal(await page.locator('[name="chestCm"]').inputValue(), '106');
        await page.setViewportSize({ width: 390, height: 844 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        status = 200;
        await page.goto(`${base}/account.html`, { waitUntil: 'networkidle' });
        const account = page.locator('#bodyMeasurementsForm');
        await account.waitFor();
        for (const [key, value] of Object.entries({ heightCm: '165', chestCm: '82', waistCm: '64', hipCm: '88',
            shoulderCm: '36.5', armLengthCm: '54.5', handLengthCm: '17.2' })) {
            await account.locator(`[name="${key}"]`).fill(value);
        }
        await account.locator('button[type=submit]').click();
        await page.waitForFunction(() => document.querySelector('#measurementsStatus').textContent.includes('сохранены'));
        assert.equal(Number(saved.armLengthCm), 54.5);
        assert.equal(Number(saved.shoulderCm), 36.5);
        assert.equal(Number(saved.handLengthCm), 17.2);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await page.goto(`${base}/fitting.html?product=shirt&size=XL`, { waitUntil: 'networkidle' });
        await page.locator('#importProfile').click();
        await page.waitForFunction(() => document.querySelector('[name=armLengthCm]').value === '54.5');
        assert.equal(await page.locator('[name=shoulderCm]').inputValue(), '36.5');
        assert.equal(await page.locator('[name=handLengthCm]').inputValue(), '17.2');
        assert.match(await page.locator('.sv-sleeve-summary').textContent(), /всю кисть/);
        await page.locator('#bodyForm').screenshot({ path: 'generated-artifacts/arm-fields-mobile.jpg' });
        await page.locator('.sv-sleeve-summary').screenshot({ path: 'generated-artifacts/arm-summary-mobile.jpg' });
        await page.setViewportSize({ width: 1280, height: 1000 });
        await page.locator('.schematic').screenshot({ path: 'generated-artifacts/arm-schematic-desktop.jpg' });
        profile = { chestCm: 82, waistCm: 64, hipCm: 88, heightCm: 165 };
        await page.locator('#importProfile').click();
        await page.waitForFunction(() => document.querySelector('[name=armLengthCm]').value === '');
        assert.match(await page.locator('.sv-sleeve-summary').textContent(), /укажите/);
        assert.deepEqual(errors, []);
        console.log('Profile browser fixture passed: account save, new optional fields, full-hand XL estimate, current edits win, old profiles, errors and mobile.');
    } finally { await context.close(); await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
