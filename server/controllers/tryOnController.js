const MAX_IMAGE_BYTES = 7 * 1024 * 1024;
const SPACE_URL = (process.env.TRYON_SPACE_URL || 'https://fashn-ai-fashn-vton-1-5.hf.space').replace(/\/$/, '');
const IDM_SPACE_URL = 'https://yisol-idm-vton.hf.space';
const { randomUUID } = require('node:crypto');

function providerHeaders(headers = {}) {
    return {
        ...(process.env.HF_TOKEN ? { Authorization: `Bearer ${process.env.HF_TOKEN}` } : {}),
        ...headers
    };
}

function readImage(value) {
    if (typeof value !== 'string') return null;
    const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return null;
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return null;
    return { dataUrl: value, buffer, size: buffer.length, mimeType: match[1] };
}

function pause(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
}

async function callSpaceAttempt(data) {
    let start;
    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            start = await fetch(`${SPACE_URL}/gradio_api/call/try_on`, {
                method: 'POST',
                headers: providerHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ data }),
                signal: AbortSignal.timeout(30000)
            });
        } catch (error) {
            if (attempt === 0 && ['TypeError', 'TimeoutError', 'AbortError'].includes(error.name)) {
                await pause(1200);
                continue;
            }
            throw error;
        }

        if (start.ok) break;
        if (attempt === 0 && [429, 502, 503, 504].includes(start.status)) {
            await pause(1200);
            continue;
        }
        throw new Error(`Модель недоступна (${start.status})`);
    }

    const job = await start.json();
    if (!job.event_id) throw new Error('Сервис не вернул идентификатор генерации');

    const resultResponse = await fetch(`${SPACE_URL}/gradio_api/call/try_on/${job.event_id}`, {
        headers: providerHeaders({ Accept: 'text/event-stream' }),
        signal: AbortSignal.timeout(240000)
    });
    if (!resultResponse.ok) throw new Error(`Ошибка ожидания результата (${resultResponse.status})`);

    const stream = await resultResponse.text();
    const dataLines = stream.split(/\r?\n/).filter(line => line.startsWith('data:'));
    if (!dataLines.length) throw new Error('Модель не вернула результат');
    const result = JSON.parse(dataLines[dataLines.length - 1].slice(5).trim());
    if (!result) {
        const error = new Error('Модель вернула пустой результат');
        error.code = 'EMPTY_MODEL_RESULT';
        throw error;
    }
    if (typeof result === 'object' && result.error) throw new Error(String(result.error));
    const image = Array.isArray(result) ? result[0] : result?.data?.[0];
    const imageUrl = image?.url || image?.path;
    if (!imageUrl) {
        const error = new Error('Модель не вернула изображение');
        error.code = 'EMPTY_MODEL_RESULT';
        throw error;
    }

    const absoluteUrl = imageUrl.startsWith('http') ? imageUrl : `${SPACE_URL}/gradio_api/file=${encodeURIComponent(imageUrl)}`;
    const imageResponse = await fetch(absoluteUrl, { headers: providerHeaders(), signal: AbortSignal.timeout(60000) });
    if (!imageResponse.ok) throw new Error('Не удалось загрузить результат модели');
    const output = Buffer.from(await imageResponse.arrayBuffer());
    if (!output.length || output.length > 12 * 1024 * 1024) throw new Error('Размер результата превышает допустимый');
    return `data:${imageResponse.headers.get('content-type') || 'image/png'};base64,${output.toString('base64')}`;
}

async function callSpace(data) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            return await callSpaceAttempt(data);
        } catch (error) {
            if (attempt === 0 && error.code === 'EMPTY_MODEL_RESULT') {
                await pause(1200);
                continue;
            }
            throw error;
        }
    }
    throw new Error('Модель не вернула изображение');
}

async function callIdm(person, garment) {
    const form = new FormData();
    form.append('files', new Blob([person.buffer], { type: person.mimeType }), 'person.jpg');
    form.append('files', new Blob([garment.buffer], { type: garment.mimeType }), 'garment.jpg');
    const uploadResponse = await fetch(`${IDM_SPACE_URL}/upload`, {
        method: 'POST',
        body: form,
        headers: providerHeaders(),
        signal: AbortSignal.timeout(60000)
    });
    if (!uploadResponse.ok) throw new Error(`IDM-VTON не приняла изображения (${uploadResponse.status})`);
    const uploaded = await uploadResponse.json();
    if (!Array.isArray(uploaded) || uploaded.length !== 2) throw new Error('IDM-VTON не вернула загруженные изображения');

    const configResponse = await fetch(`${IDM_SPACE_URL}/config`, { headers: providerHeaders(), signal: AbortSignal.timeout(30000) });
    if (!configResponse.ok) throw new Error(`Не удалось получить настройки IDM-VTON (${configResponse.status})`);
    const config = await configResponse.json();
    const functionIndex = config.dependencies?.findIndex(dependency => dependency.api_name === 'tryon');
    if (functionIndex < 0) throw new Error('В IDM-VTON не найдена функция генерации');

    const fileData = (path, origName, mimeType) => ({
        path,
        orig_name: origName,
        mime_type: mimeType,
        meta: { _type: 'gradio.FileData' }
    });
    const sessionHash = randomUUID().replace(/-/g, '');
    const joinResponse = await fetch(`${IDM_SPACE_URL}/queue/join`, {
        method: 'POST',
        headers: providerHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            data: [
                { background: fileData(uploaded[0], 'person.jpg', person.mimeType), layers: [], composite: null },
                fileData(uploaded[1], 'garment.jpg', garment.mimeType),
                'upper-body clothing',
                true,
                false,
                20,
                Math.floor(Math.random() * 2147483647)
            ],
            fn_index: functionIndex,
            session_hash: sessionHash,
            event_data: null
        }),
        signal: AbortSignal.timeout(30000)
    });
    if (!joinResponse.ok) throw new Error(`IDM-VTON не запустила генерацию (${joinResponse.status})`);

    const streamResponse = await fetch(`${IDM_SPACE_URL}/queue/data?session_hash=${encodeURIComponent(sessionHash)}`, {
        headers: providerHeaders({ Accept: 'text/event-stream' }),
        signal: AbortSignal.timeout(240000)
    });
    if (!streamResponse.ok) throw new Error(`Не удалось получить результат IDM-VTON (${streamResponse.status})`);
    const stream = await streamResponse.text();
    const events = stream.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => {
        try {
            return JSON.parse(line.slice(5).trim());
        } catch {
            return null;
        }
    }).filter(Boolean);
    const completed = events.findLast(event => event.msg === 'process_completed');
    const output = completed?.output?.data?.[0];
    const imageUrl = output?.url || output?.path;
    if (!completed?.success || !imageUrl) throw new Error(completed?.output?.error || 'IDM-VTON не вернула изображение');

    const absoluteUrl = imageUrl.startsWith('http') ? imageUrl : `${IDM_SPACE_URL}/file=${encodeURIComponent(imageUrl)}`;
    const imageResponse = await fetch(absoluteUrl, { headers: providerHeaders(), signal: AbortSignal.timeout(60000) });
    if (!imageResponse.ok) throw new Error('Не удалось загрузить результат IDM-VTON');
    const result = Buffer.from(await imageResponse.arrayBuffer());
    if (!result.length || result.length > 12 * 1024 * 1024) throw new Error('Размер результата IDM-VTON превышает допустимый');
    return `data:${imageResponse.headers.get('content-type') || 'image/png'};base64,${result.toString('base64')}`;
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

        const provider = category === 'tops' ? 'IDM-VTON' : 'FASHN VTON 1.5';
        const image = category === 'tops'
            ? await callIdm(person, garment)
            : await callSpace([
                { url: person.dataUrl, size: person.size, mime_type: person.mimeType, orig_name: 'person.jpg', meta: { _type: 'gradio.FileData' } },
                { url: garment.dataUrl, size: garment.size, mime_type: garment.mimeType, orig_name: 'garment.jpg', meta: { _type: 'gradio.FileData' } },
                category,
                'model',
                30,
                1.5,
                Math.floor(Math.random() * 2147483647),
                true
            ]);

        res.status(200).json({ image, provider });
    } catch (error) {
        console.error('Try-on provider error:', error.name, error.message);
        const quotaReached = /zerogpu quota|quota/i.test(error.message);
        const emptyResult = error.code === 'EMPTY_MODEL_RESULT';
        const status = quotaReached ? 503 : emptyResult ? 502 : /timeout|timed out/i.test(error.message) ? 504 : 502;
        res.status(status).json({
            message: quotaReached
                ? 'У внешней модели временно закончился лимит вычислений. Повторите позже или настройте HF_TOKEN в переменных backend на Render.'
                : emptyResult
                    ? 'Модель не вернула изображение. Это может быть временная ошибка сервиса; попробуйте позже.'
                : status === 504
                    ? 'Генерация заняла слишком много времени. Попробуйте ещё раз.'
                    : 'Сервис примерки временно не ответил. Попробуйте позже.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
