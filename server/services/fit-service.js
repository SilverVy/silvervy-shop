const catalog = require('../public/catalog-data');
const fitEngine = require('../public/fit-engine');

class FitError extends Error {
    constructor(status, message, errors) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
}

function assessRequest(body = {}, { forGeneration = false } = {}) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new FitError(400, 'Передайте объект с товаром и мерками');
    }
    const product = catalog.getProduct(String(body.productId || ''));
    if (!product) throw new FitError(404, 'Товар учебной коллекции не найден');
    const measurements = body.measurements || {};
    const preference = body.preference === undefined ? 'intended' : body.preference;
    const fit = fitEngine.evaluate(product, measurements, preference);
    if (fit.status !== 'ready') throw new FitError(400, 'Проверьте мерки тела и выбранную посадку', fit.errors);
    const size = String(body.size || fit.recommendedSize || '');
    const garment = product.sizes.find(row => row.size === size);
    if (!garment) throw new FitError(400, 'Выберите существующий размер изделия');
    if (forGeneration && product.category !== 'tops') {
        throw new FitError(422, 'IDM-VTON не поддерживает примерку брюк. Сравнение мерок и схема доступны без генерации.');
    }
    const comparison = fit.rows.find(row => row.size === size);
    const values = comparison.checks.map(check =>
        `${check.key}: garment ${check.garmentCm} cm, body ${check.bodyCm} cm, circumference ease ${check.easeCm} cm`
    ).join('; ');
    const description = [
        product.garmentDescription,
        `Product "${product.name}", selected demonstration size ${size}.`,
        `Design measurements (fictional educational specifications): ${values}.`,
        `Garment length ${garment.lengthCm} cm${garment.sleeveCm ? `, sleeve length ${garment.sleeveCm} cm` : ''}.`,
        'Use this as approximate visual fit guidance only; do not change the person’s anatomy.',
        'Preserve the reference garment color, cut, collar, pockets, closures and construction details.'
    ].join(' ');
    return { product, garment, fit, description, size };
}

function parsePersonImage(value) {
    if (typeof value !== 'string') return null;
    const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match || match[2].length > Math.ceil(7 * 1024 * 1024 * 4 / 3) + 4) return null;
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length < 12 || buffer.length > 7 * 1024 * 1024) return null;
    const valid = match[1] === 'image/jpeg'
        ? buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
        : match[1] === 'image/png'
            ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            : buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    return valid ? { buffer, mimeType: match[1], size: buffer.length } : null;
}

module.exports = { assessRequest, parsePersonImage, FitError };
