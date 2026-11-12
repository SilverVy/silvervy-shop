const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const { products } = require('../server/public/catalog-data');

async function prepare() {
    const output = path.resolve('server/public/media/collection');
    await fs.mkdir(output, { recursive: true });
    await fs.mkdir('generated-artifacts', { recursive: true });
    const thumbnails = [];
    for (const [index, product] of products.entries()) {
        const source = `attached_assets/generated_images/collection/${product.id}-diptych.jpg`;
        const meta = await sharp(source).metadata();
        const middle = Math.floor(meta.width / 2);
        if (middle < 400 || meta.height < 700) throw new Error(`Image resolution too low: ${source}`);
        for (const [panel, left, width] of [['front', 0, middle], ['model', middle, meta.width - middle]]) {
            const buffer = await sharp(source).extract({ left, top: 0, width, height: meta.height })
                .jpeg({ quality: 88, mozjpeg: true }).toBuffer();
            await fs.writeFile(path.join(output, `${product.id}-${panel}.jpg`), buffer);
            thumbnails.push({
                input: await sharp(buffer).resize(128, 256, { fit: 'contain' }).toBuffer(),
                left: (index % 4) * 256 + (panel === 'model' ? 128 : 0),
                top: Math.floor(index / 4) * 256
            });
        }
    }
    await sharp({ create: { width: 1024, height: 512, channels: 3, background: '#eee8df' } })
        .composite(thumbnails).jpeg({ quality: 88 }).toFile('generated-artifacts/collection-contact-sheet.jpg');
    await fs.writeFile(path.join(output, 'provenance.json'), JSON.stringify({
        type: 'AI-generated educational collection',
        generated: '2026-11-12',
        notice: 'Not photographs of manufactured stock. Model panels do not validate the designed garment measurements or physical fit.',
        processing: 'Each generated diptych was split at its vertical midpoint; left = clean front reference, right = illustrative model photo.',
        products: products.map(product => ({ id: product.id, front: product.images.front, model: product.images.model }))
    }, null, 2));
    console.log(`Prepared ${products.length * 2} catalog photographs and provenance.`);
}
prepare().catch(error => { console.error(error.message); process.exitCode = 1; });
