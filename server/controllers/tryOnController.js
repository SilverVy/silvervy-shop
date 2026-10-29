const MAX_IMAGE_BYTES = 7 * 1024 * 1024;
const QWEN_SPACE_URL = (process.env.QWEN_SPACE_URL || 'https://qwen-qwen-image-edit-2511.hf.space').replace(/\/$/, '');

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

function getFitInstruction(size, recommendedSize, category, fitProfile) {
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const selectedIndex = sizes.indexOf(String(size || '').toUpperCase());
    const recommendedIndex = sizes.indexOf(String(recommendedSize || '').toUpperCase());
    const delta = selectedIndex >= 0 && recommendedIndex >= 0
        ? selectedIndex - recommendedIndex
        : 0;
    const baseFit = String(fitProfile || 'relaxed fit');
    const itemArea = category === 'bottoms'
        ? 'waist, seat, thigh, leg width and trouser length'
        : category === 'one-pieces'
            ? 'chest, waist, hips, sleeves and overall length'
            : 'chest, torso volume, shoulder ease, sleeve width, sleeve length and hem length';
    const fit = delta < 0
        ? `The selected size ${size} is ${Math.abs(delta)} size${Math.abs(delta) === 1 ? '' : 's'} below the profile-based recommendation ${recommendedSize || ''}. Show a clearly visible, closer, less roomy fit in the ${itemArea}; do not limit the change to the hem length.`
        : delta > 0
            ? `The selected size ${size} is ${delta} size${delta === 1 ? '' : 's'} above the profile-based recommendation ${recommendedSize || ''}. Show a clearly visible, roomier fit in the ${itemArea}, with proportionally wider sleeves or legs and longer sleeves or hem where relevant; do not limit the change to the hem length.`
            : `The selected size ${size} matches the profile-based recommendation. Show the intended ${baseFit} with natural ease in the ${itemArea}.`;
    return `${fit} Do not change the person's body shape to fake the fit.`;
}

function buildQwenPrompt({ productName, category, size, recommendedSize, measurements, fitProfile }) {
    const categoryLabel = category === 'bottoms'
        ? 'trousers or other lower-body garment'
        : category === 'one-pieces'
            ? 'one-piece garment'
            : 'top or outerwear';
    const body = [
        ['heightCm', 'height in cm'],
        ['weightKg', 'weight in kg'],
        ['chestCm', 'chest in cm'],
        ['waistCm', 'waist in cm'],
        ['hipCm', 'hips in cm']
    ].map(([key, label]) => measurements?.[key] ? `${label}: ${measurements[key]}` : null).filter(Boolean).join(', ');
    const fitInstruction = getFitInstruction(size, recommendedSize, category, fitProfile);
    return [
        'Create a photorealistic virtual try-on edit using the provided images.',
        'Image 1 is the person and must remain the base image. Image 2 is the exact garment reference.',
        `Replace only the ${categoryLabel} on the person with the garment shown in image 2. The product is "${productName}".`,
        `Preserve the garment's main color, overall silhouette, cut, collar or waistband, sleeves or legs, pockets, seams, buttons, and visible construction details. Do not add labels, logos, accessories, or new design elements.`,
        `The person selected size ${size}. ${body ? `Their profile measurements are ${body}.` : ''}`,
        fitInstruction,
        'Keep the same person, face, hair, pose, body proportions, background, framing, and lighting. Do not alter other clothing except where it is naturally covered by the reference garment.'
    ].filter(Boolean).join(' ');
}

function findImageFile(value) {
    if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/') || value.startsWith('data:'))) {
        return value.startsWith('data:') ? { url: value } : { path: value };
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findImageFile(item);
            if (found) return found;
        }
    } else if (value && typeof value === 'object') {
        if (typeof value.url === 'string' || typeof value.path === 'string') return value;
        for (const item of Object.values(value)) {
            const found = findImageFile(item);
            if (found) return found;
        }
    }
    return null;
}

function describeResultShape(value, depth = 0) {
    if (value === null) return 'null';
    if (depth > 3) return Array.isArray(value) ? 'array' : typeof value;
    if (Array.isArray(value)) {
        return `array(${value.length})[${value.slice(0, 2).map(item => describeResultShape(item, depth + 1)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
        return `{${Object.entries(value).slice(0, 5).map(([key, item]) => `${key}:${describeResultShape(item, depth + 1)}`).join(',')}}`;
    }
    return typeof value;
}

function getProviderErrorMessage(value, depth = 0) {
    if (depth > 3 || value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value !== 'object') return '';
    for (const key of ['error', 'message', 'detail', 'msg', 'exception']) {
        const message = getProviderErrorMessage(value[key], depth + 1);
        if (message) return message;
    }
    return '';
}

function sanitizeProviderError(message) {
    return String(message)
        .replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '[image data]')
        .replace(/https?:\/\/[^\s"'<>]+/g, '[url]')
        .slice(0, 300);
}

function parseSseEvents(stream) {
    const events = [];
    const eventNames = [];
    let eventName = 'message';
    let dataLines = [];
    const flush = () => {
        if (eventName !== 'message') eventNames.push(eventName);
        if (dataLines.length) {
            const rawData = dataLines.join('\n');
            let value;
            try {
                value = JSON.parse(rawData);
            } catch {
                value = rawData;
            }
            events.push({ name: eventName, value });
        }
        eventName = 'message';
        dataLines = [];
    };
    for (const line of stream.split(/\r?\n/)) {
        if (!line) {
            flush();
        } else if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).replace(/^ /, ''));
        }
    }
    flush();
    return { events, eventNames };
}

async function callQwen(person, garment, prompt) {
    const form = new FormData();
    form.append('files', new Blob([person.buffer], { type: person.mimeType }), 'person.jpg');
    form.append('files', new Blob([garment.buffer], { type: garment.mimeType }), 'garment.png');
    const uploadResponse = await fetch(`${QWEN_SPACE_URL}/gradio_api/upload`, {
        method: 'POST',
        body: form,
        headers: providerHeaders(),
        signal: AbortSignal.timeout(60000)
    });
    if (!uploadResponse.ok) throw new Error(`Qwen не приняла изображения (${uploadResponse.status})`);
    const uploaded = await uploadResponse.json();
    if (!Array.isArray(uploaded) || uploaded.length !== 2) throw new Error('Qwen не вернула загруженные изображения');

    const gallery = uploaded.map(path => ({
        image: { path, meta: { _type: 'gradio.FileData' } },
        caption: null
    }));
    const eventResponse = await fetch(`${QWEN_SPACE_URL}/gradio_api/call/infer`, {
        method: 'POST',
        headers: providerHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ data: [gallery, prompt, 4217, false, 4, 30, 1024, 768, false] }),
        signal: AbortSignal.timeout(60000)
    });
    if (!eventResponse.ok) throw new Error(`Qwen не запустила генерацию (${eventResponse.status})`);
    const job = await eventResponse.json();
    if (!job.event_id) throw new Error('Qwen не вернула идентификатор генерации');

    const resultResponse = await fetch(`${QWEN_SPACE_URL}/gradio_api/call/infer/${job.event_id}`, {
        headers: providerHeaders({ Accept: 'text/event-stream' }),
        signal: AbortSignal.timeout(300000)
    });
    if (!resultResponse.ok) throw new Error(`Не удалось получить результат Qwen (${resultResponse.status})`);
    const stream = await resultResponse.text();
    const parsedStream = parseSseEvents(stream);
    const events = parsedStream.events;
    const providerError = events.findLast(event => event.name === 'error' || event.value?.error);
    if (providerError) {
        const message = sanitizeProviderError(getProviderErrorMessage(providerError.value));
        console.error('Qwen provider error event:', JSON.stringify({
            eventName: providerError.name,
            resultShape: describeResultShape(providerError.value),
            message: message || undefined
        }));
        throw new Error(message || `Qwen сообщила об ошибке (${describeResultShape(providerError.value)})`);
    }
    let output = null;
    for (let index = events.length - 1; index >= 0 && !output; index -= 1) {
        output = findImageFile(events[index].value);
    }
    const imageUrl = output?.url || output?.path;
    if (!imageUrl) {
        console.error('Qwen SSE diagnostic:', JSON.stringify({
            status: resultResponse.status,
            contentType: resultResponse.headers.get('content-type'),
            streamBytes: Buffer.byteLength(stream),
            eventNames: parsedStream.eventNames,
            dataEvents: events.slice(-4).map(event => `${event.name}:${describeResultShape(event.value)}`)
        }));
        const error = new Error('Qwen не вернула изображение');
        error.code = 'EMPTY_MODEL_RESULT';
        throw error;
    }
    if (imageUrl.startsWith('data:')) return imageUrl;
    const absoluteUrl = imageUrl.startsWith('http')
        ? imageUrl
        : imageUrl.startsWith('/gradio_api/') || imageUrl.startsWith('/file=')
            ? `${QWEN_SPACE_URL}${imageUrl}`
            : `${QWEN_SPACE_URL}/gradio_api/file=${encodeURIComponent(imageUrl)}`;
    const imageResponse = await fetch(absoluteUrl, {
        headers: providerHeaders(),
        signal: AbortSignal.timeout(60000)
    });
    if (!imageResponse.ok) throw new Error('Не удалось загрузить результат Qwen');
    const result = Buffer.from(await imageResponse.arrayBuffer());
    if (!result.length || result.length > 12 * 1024 * 1024) throw new Error('Размер результата Qwen превышает допустимый');
    return `data:${imageResponse.headers.get('content-type') || 'image/png'};base64,${result.toString('base64')}`;
}

exports.generate = async (req, res) => {
    try {
        const person = readImage(req.body.personImage);
        const garment = readImage(req.body.garmentImage);
        const category = req.body.category;
        const productName = String(req.body.productName || '');
        const size = String(req.body.size || '').toUpperCase();
        const recommendedSize = String(req.body.recommendedSize || '').toUpperCase();
        const fitProfile = String(req.body.fitProfile || '');
        const measurements = req.body.measurements || {};

        if (!person || !garment) {
            return res.status(400).json({ message: 'Загрузите фотографию и проверьте изображение товара' });
        }
        if (!['tops', 'bottoms', 'one-pieces'].includes(category)) {
            return res.status(400).json({ message: 'Для этой категории виртуальная примерка пока недоступна' });
        }
        if (!['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(size)) {
            return res.status(400).json({ message: 'Выберите размер для генерации' });
        }
        const safeMeasurements = {};
        for (const key of ['heightCm', 'weightKg', 'chestCm', 'waistCm', 'hipCm']) {
            const value = Number(measurements[key]);
            if (Number.isFinite(value) && value > 0) safeMeasurements[key] = value;
        }

        const prompt = buildQwenPrompt({
            productName,
            category,
            size,
            recommendedSize,
            measurements: safeMeasurements,
            fitProfile
        });
        const image = await callQwen(person, garment, prompt);

        res.status(200).json({ image, provider: 'Qwen Image Edit — size-conditioned preview' });
    } catch (error) {
        console.error('Try-on provider error:', error.name, error.message);
        const quotaReached = /zerogpu quota|quota/i.test(error.message);
        const emptyResult = error.code === 'EMPTY_MODEL_RESULT';
        const status = quotaReached ? 503 : emptyResult ? 502 : /timeout|timed out/i.test(error.message) ? 504 : 502;
        res.status(status).json({
            message: quotaReached
                ? 'У модели примерки закончился лимит вычислений. Проверьте HF_TOKEN в переменных backend на Render и повторите позже.'
                : emptyResult
                    ? 'Модель примерки не вернула изображение. Попробуйте позже; если ошибка повторится, проверьте журнал backend на Render.'
                : status === 504
                    ? 'Генерация заняла слишком много времени. Попробуйте ещё раз.'
                    : 'Сервис примерки временно не ответил. Попробуйте позже.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
