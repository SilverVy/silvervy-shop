const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');

async function verify() {
    const base = process.env.BASE_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://127.0.0.1:5000');
    const browser = await chromium.launch({
        executablePath: process.env.CHROMIUM_PATH || '/repl/tools/bin/chromium',
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    const errors = [];
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.stack || error.message));
    await fs.mkdir('generated-artifacts', { recursive: true });
    try {
        await page.goto(`${base}/catalog.html`, { waitUntil: 'networkidle' });
        assert.equal(await page.locator('.apparel-card').count(), 8);
        await page.locator('.apparel-card').last().scrollIntoViewIfNeeded();
        await page.waitForFunction(() => [...document.querySelectorAll('.apparel-image img')].every(image => image.complete && image.naturalWidth > 0));
        assert.equal(await page.locator('.shoes-preserved .product-card').count(), 2);
        await page.goto(`${base}/product-shirt.html`, { waitUntil: 'networkidle' });
        assert.match(await page.locator('.product-info h2').innerText(), /Мел/);
        await page.locator('.size[data-size="XL"]').click();
        assert.match(await page.locator('.fit-cta').getAttribute('href'), /size=XL/);
        await page.locator('.thumbnail').last().click();
        await page.waitForFunction(() => document.querySelector('#mainImg').src.endsWith('shirt-model.jpg'));
        await page.locator('.buy-button').click();
        await page.locator('.auth-error-modal').waitFor({ state: 'visible' });
        await page.locator('.auth-error-close').click();
        await page.goto(`${base}/fitting.html?product=shirt&size=M`, { waitUntil: 'networkidle' });
        const values = { heightCm: '178', chestCm: '100', waistCm: '84', hipCm: '100', inseamCm: '79' };
        for (const [key, value] of Object.entries(values)) await page.locator(`[name="${key}"]`).fill(value);
        assert.match(await page.locator('#recommendation').innerText(), /размер: S/);
        assert.equal(await page.locator('#comparison thead th').count(), 6);
        await page.locator('[data-size="XS"]').click();
        const smallDiagram = await page.locator('#schematicCanvas').innerHTML();
        await page.locator('[data-size="XL"]').click();
        assert.notEqual(await page.locator('#schematicCanvas').innerHTML(), smallDiagram);
        assert.match(await page.locator('#schematicCopy').innerText(), /132,0 см/);
        await page.screenshot({ path: 'generated-artifacts/fitting-desktop.jpg', fullPage: true });
        await page.locator('#schematicCanvas').screenshot({ path: 'generated-artifacts/schematic-desktop.jpg' });
        await page.locator('[name="chestCm"]').fill('175');
        await page.locator('[name="waistCm"]').fill('165');
        await page.locator('[name="hipCm"]').fill('180');
        assert.match(await page.locator('#recommendation').innerText(), /не найден/);
        await page.locator('[name="chestCm"]').fill('0');
        assert.equal(await page.locator('[name="chestCm"]').getAttribute('aria-invalid'), 'true');
        await page.locator('[name="chestCm"]').fill('');
        await page.locator('[name="waistCm"]').fill('84');
        await page.locator('[name="hipCm"]').fill('100');
        await page.locator('#productSelect').selectOption('trousers');
        assert.match(await page.locator('#recommendation').innerText(), /размер: M/);
        await page.locator('#photoTitle').click();
        assert.match(await page.locator('#photoAvailability').innerText(), /брюк не поддерживается/);
        await page.locator('#generatePhoto').click();
        assert.match(await page.locator('#photoStatus').innerText(), /только верхнюю/);
        await page.reload({ waitUntil: 'networkidle' });
        assert.equal(await page.locator('[name="waistCm"]').inputValue(), '84');
        await page.setViewportSize({ width: 390, height: 844 });
        await page.locator('#productSelect').selectOption('trousers');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'mobile page overflows');
        await page.screenshot({ path: 'generated-artifacts/fitting-mobile.jpg', fullPage: true });
        await page.locator('#schematicCanvas').screenshot({ path: 'generated-artifacts/schematic-mobile.jpg' });
        await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
        assert.ok(await page.locator('img[src="media/collection/coat-model.jpg"]').evaluate(image => image.naturalWidth > 0));
        assert.deepEqual(errors, []);
        console.log('Browser checks passed: eight products, images, gallery, size links, login modal, body-driven comparison, no-fit state, validation, bottoms restriction, session persistence and mobile layout.');
    } finally {
        await context.close();
        await browser.close();
    }
}
verify().catch(error => { console.error(error); process.exitCode = 1; });
