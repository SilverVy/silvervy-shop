const MAX_IMAGE_BYTES = 7 * 1024 * 1024;
const QWEN_SPACE_URL = (process.env.QWEN_SPACE_URL || 'https://qwen-qwen-image-edit-2511.hf.space').replace(/\/$/, '');
const IDM_SPACE_URL = (process.env.IDM_VTON_SPACE_URL || 'https://yisol-idm-vton.hf.space').replace(/\/$/, '');
const { createHash, randomUUID } = require('node:crypto');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const { assessRequest, parsePersonImage } = require('../services/fit-service');
const { prepareSizeInputs, preserveOutsideMask } = require('../services/fit-image-preparation');
const activeJobs = new Set();
const IDM_GARMENT_DESCRIPTIONS = new Set([
    'long wool coat',
    'bomber jacket',
    'trench coat',
    'denim jacket',
    'shirt',
    'linen shirt',
    'upper-body clothing'
]);

function providerHeaders(headers = {}) {
    const token = (process.env.HF_TOKEN || '').trim();
    if (token && !/^hf_[a-zA-Z0-9]+$/.test(token)) {
        const error = new Error('HF_TOKEN на сервере имеет неверный формат. Используйте только значение hf_… без Bearer и кавычек.');
        error.code = 'HF_CONFIG';
        throw error;
    }
    return {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
        .replace(/\bhf_[a-zA-Z0-9]+\b/g, '[redacted token]')
        .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
        .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted session]')
        .replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '[image data]')
        .replace(/https?:\/\/[^\s"'<>]+/g, '[url]')
        .slice(0, 300);
}

function buildIdmGarmentDescription({ baseDescription, size, recommendedSize, measurements, fitProfile }) {
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const selectedIndex = sizes.indexOf(size);
    const recommendedIndex = sizes.indexOf(recommendedSize);
    const delta = selectedIndex >= 0 && recommendedIndex >= 0 ? selectedIndex - recommendedIndex : 0;
    const fit = /oversize|baggy|свободн/i.test(fitProfile)
        ? 'relaxed oversized cut'
        : 'straight cut';
    const sizeGuidance = delta > 0
        ? `Selected size ${size}, larger than the profile recommendation ${recommendedSize}. Show a visibly roomier fit with a wider torso and sleeves and slightly longer sleeves and hem.`
        : delta < 0
            ? `Selected size ${size}, smaller than the profile recommendation ${recommendedSize}. Show a visibly closer fit with a narrower torso and sleeves and slightly shorter sleeves and hem.`
            : `Selected size ${size}, matching the profile recommendation. Preserve the intended ${fit}.`;
    const body = [
        ['heightCm', 'height'],
        ['weightKg', 'weight'],
        ['chestCm', 'chest'],
        ['waistCm', 'waist'],
        ['hipCm', 'hips']
    ].map(([key, label]) => measurements[key] ? `${label} ${measurements[key]}${key === 'weightKg' ? ' kg' : ' cm'}` : null)
        .filter(Boolean)
        .join(', ');
    return [
        baseDescription,
        body ? `Model body measurements: ${body}.` : '',
        sizeGuidance,
        "Keep the same garment design, color, collar, closure, pockets, seams, and visible details. Do not alter the person's anatomy."
    ].filter(Boolean).join(' ');
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

function checkProviderResponse(response, stage) {
    if (response.ok) return;
    const error = new Error(`IDM-VTON: этап ${stage}, HTTP ${response.status}`);
    error.stage = stage;
    error.upstreamStatus = response.status;
    if ([401, 403].includes(response.status)) error.code = 'HF_AUTH';
    else if (response.status === 429) error.code = 'HF_QUOTA';
    throw error;
}

async function callIdm(person, garment, garmentDescription, prepared) {
    const form = new FormData();
    form.append('files', new Blob([person.buffer], { type: person.mimeType }), 'person.png');
    form.append('files', new Blob([garment.buffer], { type: garment.mimeType }), 'garment.png');
    form.append('files', new Blob([prepared.mask], { type: 'image/png' }), 'size-mask.png');
    const uploadResponse = await fetch(`${IDM_SPACE_URL}/upload`, {
        method: 'POST',
        body: form,
        headers: providerHeaders(),
        signal: AbortSignal.timeout(60000)
    });
    checkProviderResponse(uploadResponse, 'upload');
    const uploaded = await uploadResponse.json();
    if (!Array.isArray(uploaded) || uploaded.length !== 3 || !uploaded.every(item => typeof item === 'string')) throw new Error('IDM-VTON не вернула три загруженных изображения');

    const configResponse = await fetch(`${IDM_SPACE_URL}/config`, {
        headers: providerHeaders(),
        signal: AbortSignal.timeout(30000)
    });
    checkProviderResponse(configResponse, 'config');
    const config = await configResponse.json();
    const functionIndex = config.dependencies?.findIndex(dependency => dependency.api_name === 'tryon');
    if (functionIndex === undefined || functionIndex < 0) throw new Error('В IDM-VTON не найдена функция генерации');
    const dependency = config.dependencies[functionIndex];
    const editor = config.components?.find(component => component.id === dependency.inputs?.[0]);
    if (editor?.type !== 'imageeditor' || dependency.inputs?.length !== 7) {
        throw new Error('Интерфейс IDM-VTON изменился: размерная ручная маска недоступна. Автоматическая подмена текстовым режимом отключена.');
    }

    const fileData = (path, origName, mimeType) => ({
        path,
        orig_name: origName,
        mime_type: mimeType,
        meta: { _type: 'gradio.FileData' }
    });
    const sessionHash = randomUUID().replace(/-/g, '');
    const seed = createHash('sha256').update(prepared.seedPerson).update(prepared.seedGarment).digest().readUInt32BE(0) % 2147483648;
    const joinResponse = await fetch(`${IDM_SPACE_URL}/queue/join`, {
        method: 'POST',
        headers: providerHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            data: [
                { background: fileData(uploaded[0], 'person.png', person.mimeType),
                    layers: [fileData(uploaded[2], 'size-mask.png', 'image/png')], composite: null },
                fileData(uploaded[1], 'garment.png', garment.mimeType),
                garmentDescription,
                false,
                false,
                20,
                seed
            ],
            fn_index: functionIndex,
            session_hash: sessionHash,
            event_data: null
        }),
        signal: AbortSignal.timeout(30000)
    });
    checkProviderResponse(joinResponse, 'queue_join');

    const streamResponse = await fetch(`${IDM_SPACE_URL}/queue/data?session_hash=${encodeURIComponent(sessionHash)}`, {
        headers: providerHeaders({ Accept: 'text/event-stream' }),
        signal: AbortSignal.timeout(240000)
    });
    checkProviderResponse(streamResponse, 'queue_stream');
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
    if (!completed?.success || !imageUrl) {
        const queueError = events.findLast(event => event.msg === 'queue_full' || event.msg === 'unexpected_error' || event.error);
        const error = new Error(completed?.output?.error || getProviderErrorMessage(queueError) ||
            (queueError?.msg === 'queue_full' ? 'IDM-VTON queue quota full' : 'IDM-VTON не вернула изображение'));
        error.stage = 'inference';
        if (!imageUrl && !completed?.output?.error) error.code = 'EMPTY_MODEL_RESULT';
        throw error;
    }

    const absoluteUrl = imageUrl.startsWith('http')
        ? imageUrl
        : `${IDM_SPACE_URL}/file=${encodeURIComponent(imageUrl)}`;
    const imageResponse = await fetch(absoluteUrl, {
        headers: new URL(absoluteUrl).origin === new URL(IDM_SPACE_URL).origin ? providerHeaders() : {},
        signal: AbortSignal.timeout(60000)
    });
    checkProviderResponse(imageResponse, 'download');
    const result = Buffer.from(await imageResponse.arrayBuffer());
    if (!result.length || result.length > 12 * 1024 * 1024) throw new Error('Размер результата IDM-VTON превышает допустимый');
    const metadata = await sharp(result, { limitInputPixels: 16000000 }).metadata();
    const mime = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[metadata.format];
    if (!mime) throw new Error('IDM-VTON вернула неподдерживаемый формат изображения');
    const preserved = await preserveOutsideMask(result, prepared);
    return `data:image/png;base64,${preserved.toString('base64')}`;
}

exports.generate = async (req, res) => {
    const requestId = randomUUID();
    const startedAt = Date.now();
    const userKey = String(req.user.id);
    if (activeJobs.has(userKey)) {
        res.set('Retry-After', '15');
        return res.status(429).json({ message: 'Дождитесь завершения текущей примерки.' });
    }
    try {
        const assessment = assessRequest(req.body, { forGeneration: true });
        const person = parsePersonImage(req.body.personImage);
        if (!person) return res.status(400).json({ message: 'Загрузите корректное фото JPEG, PNG или WebP до 7 МБ.' });
        activeJobs.add(userKey);
        let metadata;
        try {
            metadata = await sharp(person.buffer, { limitInputPixels: 16000000 }).metadata();
        } catch {
            return res.status(400).json({ message: 'Изображение повреждено или содержит слишком много пикселей.' });
        }
        if (metadata.width < 256 || metadata.height < 384 || metadata.height <= metadata.width) {
            return res.status(400).json({ message: 'Нужно вертикальное фото анфас в полный рост достаточного разрешения.' });
        }
        const garmentBuffer = await readFile(path.join(__dirname, '../public', assessment.product.images.front));
        const prepared = await prepareSizeInputs(person, garmentBuffer, assessment, req.body.calibration);
        console.info(JSON.stringify({ event: 'tryon_started', requestId, productId: assessment.product.id,
            size: assessment.size, method: prepared.metadata.method, hfTokenConfigured: Boolean(process.env.HF_TOKEN) }));
        const comparison = assessment.fit.rows.find(row => row.size === assessment.size);
        const fitWords = comparison.checks.some(check => check.easeCm < 0) ? 'tight close-fitting'
            : comparison.checks.some(check => check.status === 'loose') ? 'very loose oversized' : 'relaxed';
        const prompt = `${fitWords} ${assessment.product.garmentDescription}, size ${assessment.size}. Follow the provided silhouette and hem length, keep garment details and anatomy. ${assessment.description}`;
        const image = await callIdm(prepared.person, prepared.garment, prompt, prepared);
        console.info(JSON.stringify({ event: 'tryon_completed', requestId, elapsedMs: Date.now() - startedAt }));

        res.status(200).json({
            image,
            productId: assessment.product.id,
            size: assessment.size,
            provider: 'IDM-VTON',
            requestId,
            sizeConditioning: prepared.metadata.method,
            geometry: prepared.metadata,
            fitNotice: 'Размер управляет калиброванной маской, масштабом референса и текстом. Область вне маски сохранена из исходного фото. Это экспериментальное геометрическое приближение, не физическая симуляция ткани и не гарантия посадки.',
            fit: assessment.fit
        });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message, errors: error.errors, requestId });
        const quotaReached = ['HF_QUOTA'].includes(error.code) || /zerogpu quota|quota|queue full/i.test(error.message);
        const emptyResult = error.code === 'EMPTY_MODEL_RESULT';
        console.error(JSON.stringify({ event: 'tryon_failed', requestId, stage: error.stage || 'prepare_or_provider',
            code: error.code || (quotaReached ? 'HF_QUOTA' : 'PROVIDER_ERROR'), upstreamStatus: error.upstreamStatus,
            message: error.stage === 'inference' ? (quotaReached ? 'Provider quota exhausted' : emptyResult ? 'Provider returned no image' : 'Provider inference failed')
                : sanitizeProviderError(error.message), elapsedMs: Date.now() - startedAt }));
        const status = quotaReached ? 503 : emptyResult ? 502 : /timeout|timed out/i.test(error.message) ? 504 : 502;
        res.status(status).json({
            requestId,
            code: error.code || (quotaReached ? 'HF_QUOTA' : emptyResult ? 'HF_EMPTY_RESULT' : 'HF_PROVIDER_ERROR'),
            message: error.code === 'HF_AUTH'
                ? 'Hugging Face отклонил доступ. Проверьте серверный HF_TOKEN и доступ аккаунта к Space. Сессия входа Silver.Vy здесь ни при чём.'
                : error.code === 'HF_CONFIG' ? error.message
                : quotaReached
                ? 'У публичной модели исчерпан лимит вычислений. Сравнение размеров работает без генерации; изображение можно попробовать позже.'
                : emptyResult
                    ? 'Модель не вернула изображение. Сравнение размеров остаётся доступным; попробуйте генерацию позже.'
                : status === 504
                    ? 'Генерация заняла слишком много времени. Попробуйте ещё раз.'
                    : 'Сервис примерки временно не ответил. Попробуйте позже.',
        });
    } finally {
        activeJobs.delete(userKey);
    }
};
