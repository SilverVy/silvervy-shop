const MAX_IMAGE_BYTES = 7 * 1024 * 1024;
const SPACE_URL = (process.env.TRYON_SPACE_URL || 'https://fashn-ai-fashn-vton-1-5.hf.space').replace(/\/$/, '');

function readImage(value) {
    if (typeof value !== 'string') return null;
    const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return null;
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return null;
    return { dataUrl: value, size: buffer.length, mimeType: match[1] };
}

async function callSpace(data) {
    const start = await fetch(`${SPACE_URL}/gradio_api/call/try_on`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
        signal: AbortSignal.timeout(30000)
    });

    if (!start.ok) throw new Error(`Модель недоступна (${start.status})`);
    const job = await start.json();
    if (!job.event_id) throw new Error('Сервис не вернул идентификатор генерации');

    const resultResponse = await fetch(`${SPACE_URL}/gradio_api/call/try_on/${job.event_id}`, {
        headers: { Accept: 'text/event-stream' },
        signal: AbortSignal.timeout(240000)
    });
    if (!resultResponse.ok) throw new Error(`Ошибка ожидания результата (${resultResponse.status})`);

    const stream = await resultResponse.text();
    const dataLines = stream.split(/\r?\n/).filter(line => line.startsWith('data:'));
    if (!dataLines.length) throw new Error('Модель не вернула результат');
    const result = JSON.parse(dataLines[dataLines.length - 1].slice(5).trim());
    if (result.error) throw new Error(String(result.error));
    const image = Array.isArray(result) ? result[0] : result?.data?.[0];
    const imageUrl = image?.url || image?.path;
    if (!imageUrl) throw new Error('В ответе модели нет изображения');

    const absoluteUrl = imageUrl.startsWith('http') ? imageUrl : `${SPACE_URL}/gradio_api/file=${encodeURIComponent(imageUrl)}`;
    const imageResponse = await fetch(absoluteUrl, { signal: AbortSignal.timeout(60000) });
    if (!imageResponse.ok) throw new Error('Не удалось загрузить результат модели');
    const output = Buffer.from(await imageResponse.arrayBuffer());
    if (!output.length || output.length > 12 * 1024 * 1024) throw new Error('Размер результата превышает допустимый');
    return `data:${imageResponse.headers.get('content-type') || 'image/png'};base64,${output.toString('base64')}`;
}

exports.generate = async (req, res) => {
    try {
        const person = readImage(req.body.personImage);
        const garment = readImage(req.body.garmentImage);
        const category = req.body.category;

        if (!person || !garment) {
            return res.status(400).json({ message: 'Загрузите фотографию и проверьте изображение товара' });
        }
        if (!['tops', 'bottoms', 'one-pieces'].includes(category)) {
            return res.status(400).json({ message: 'Для этой категории виртуальная примерка пока недоступна' });
        }

        const image = await callSpace([
            { url: person.dataUrl, size: person.size, mime_type: person.mimeType, orig_name: 'person.jpg', meta: { _type: 'gradio.FileData' } },
            { url: garment.dataUrl, size: garment.size, mime_type: garment.mimeType, orig_name: 'garment.jpg', meta: { _type: 'gradio.FileData' } },
            category,
            'model',
            30,
            1.5,
            Math.floor(Math.random() * 2147483647),
            true
        ]);

        res.status(200).json({ image, provider: 'FASHN VTON 1.5' });
    } catch (error) {
        const status = /timeout|timed out/i.test(error.message) ? 504 : 502;
        res.status(status).json({
            message: status === 504 ? 'Генерация заняла слишком много времени. Попробуйте ещё раз.' : 'Сервис примерки временно не ответил. Попробуйте позже.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
