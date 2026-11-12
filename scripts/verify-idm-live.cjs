// Explicit opt-in adapter smoke test. Uses an AI-generated catalog model, never a user's photo.
const fs = require('node:fs/promises');
const { generate } = require('../server/controllers/tryOnController');
const { defaults } = require('../server/public/fit-geometry');
async function main() {
    if (process.env.RUN_LIVE_IDM !== '1') throw new Error('Live inference is opt-in: RUN_LIVE_IDM=1 node scripts/verify-idm-live.cjs');
    const runName = process.env.IDM_RUN_NAME || 'live';
    if (!/^[a-z0-9-]+$/.test(runName)) throw new Error('Use a simple run label containing letters, digits and hyphens.');
    const image = await fs.readFile('server/public/media/collection/shirt-model.jpg');
    const points = { ...structuredClone(defaults),
        crown: { x: .5, y: .055 }, feet: { x: .5, y: .942 }, neck: { x: .5, y: .193 },
        chestLeft: { x: .285, y: .30 }, chestRight: { x: .716, y: .30 },
        waistLeft: { x: .265, y: .40 }, waistRight: { x: .73, y: .40 },
        hipLeft: { x: .27, y: .51 }, hipRight: { x: .73, y: .51 },
        wristLeft: { x: .29, y: .53 }, wristRight: { x: .69, y: .53 } };
    await fs.mkdir('generated-artifacts/tryon', { recursive: true });
    for (const size of ['XS', 'XL']) {
        const req = { user: { id: 'synthetic-adapter-smoke' }, body: {
            productId: 'shirt', size, measurements: { heightCm: 178, chestCm: 100, waistCm: 84, hipCm: 100 },
            calibration: { confirmed: true, points }, personImage: 'data:image/jpeg;base64,' + image.toString('base64')
        } };
        const res = { statusCode: 200, status(code) { this.statusCode = code; return this; },
            set() { return this; }, json(data) { this.data = data; return this; } };
        await generate(req, res);
        const { image: result, ...report } = res.data;
        await fs.writeFile(`generated-artifacts/tryon/${runName}-${size}.json`, JSON.stringify({ status: res.statusCode, ...report }, null, 2));
        console.log(JSON.stringify({ size, status: res.statusCode, code: report.code, message: report.message,
            method: report.sizeConditioning, hasImage: Boolean(result) }));
        if (!result) { process.exitCode = 2; break; }
        await fs.writeFile(`generated-artifacts/tryon/${runName}-${size}.png`, Buffer.from(result.split(',')[1], 'base64'));
    }
}
main().catch(error => { console.error(error.name, error.message); process.exitCode = 1; });
