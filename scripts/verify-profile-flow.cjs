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
    let profile = { chestCm: 100, waistCm: 84, hipCm: 100, heightCm: 178, inseamCm: 80 };
    let status = 200;
    await context.addInitScript(() => {
        localStorage.setItem('token', 'isolated-browser-fixture');
        localStorage.setItem('user', JSON.stringify({ id: 'profile-fixture' }));
    });
    await page.route('**/api/auth/profile', route => route.fulfill({ status,
        json: status === 200 ? { user: { bodyMeasurements: profile } } : { message: 'Fixture unavailable' } }));
    try {
        await page.goto(`${base}/fitting.html?product=shirt`, { waitUntil: 'networkidle' });
        assert.equal(await page.locator('[name="chestCm"]').inputValue(), '100');
        assert.equal(await page.locator('[name="heightCm"]').inputValue(), '178');
        await page.locator('[name="chestCm"]').fill('105');
        profile = { ...profile, chestCm: 99, waistCm: 82 };
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await page.waitForFunction(() => document.querySelector('[name=waistCm]').value === '82');
        assert.equal(await page.locator('[name="chestCm"]').inputValue(), '105', 'background profile loading must preserve current edits');
        assert.match(await page.locator('#photoRequestMeta').textContent(), /105/);
        await page.locator('#importProfile').click();
        await page.waitForFunction(() => document.querySelector('[name=chestCm]').value === '99');
        await page.locator('[name="chestCm"]').fill('106');
        await page.reload({ waitUntil: 'networkidle' });
        assert.equal(await page.locator('[name="chestCm"]').inputValue(), '106', 'same-account session draft must survive reload');
        status = 503;
        await page.locator('#importProfile').click();
        await page.waitForFunction(() => document.querySelector('#profileSource').textContent.includes('Fixture unavailable'));
        assert.equal(await page.locator('[name="chestCm"]').inputValue(), '106');
        await page.setViewportSize({ width: 390, height: 844 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        assert.deepEqual(errors, []);
        console.log('Profile browser fixture passed: automatic prefill, current laboratory edits win, explicit reload, session draft, error fallback and mobile.');
    } finally { await context.close(); await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
