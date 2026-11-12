const outerwear = Object.freeze({
    id: 'outerwear-full-frame-v1',
    mode: 'outerwear',
    crop: null
});

// These crops remove only the large empty margins around the isolated short
// garments. Fractions are measured against each original 512 × 1024 front image.
// They are image bounds, not garment measurements or pattern pieces.
const profiles = Object.freeze({
    coat: outerwear,
    trench: outerwear,
    shirt: {
        id: 'shirt-cropped-reference-v1',
        mode: 'short-top',
        crop: { left: 0.02, top: 0.15, width: 0.96, height: 0.67 }
    },
    bomber: {
        id: 'bomber-cropped-reference-v1',
        mode: 'short-top',
        crop: { left: 0.01, top: 0.18, width: 0.98, height: 0.63 }
    },
    denim: {
        id: 'denim-cropped-reference-v1',
        mode: 'short-top',
        crop: { left: 0.03, top: 0.19, width: 0.94, height: 0.62 }
    },
    linen: {
        id: 'linen-short-sleeve-reference-v1',
        mode: 'short-top',
        crop: { left: 0, top: 0.18, width: 1, height: 0.64 }
    }
});

function getPreprocessingProfile(productId) {
    const profile = profiles[productId];
    if (!profile) throw new Error(`Нет отдельного профиля препроцессинга для изделия "${productId}".`);
    return profile;
}

function getCropRect(profile, sourceWidth, sourceHeight) {
    if (!profile.crop) return null;
    const { left, top, width, height } = profile.crop;
    if (![left, top, width, height, sourceWidth, sourceHeight].every(Number.isFinite) ||
        left < 0 || top < 0 || width <= 0 || height <= 0 ||
        left + width > 1 || top + height > 1 || sourceWidth <= 0 || sourceHeight <= 0) {
        throw new Error(`Некорректная область кадрирования для "${profile.id}".`);
    }
    const x0 = Math.max(0, Math.floor(left * sourceWidth));
    const y0 = Math.max(0, Math.floor(top * sourceHeight));
    const x1 = Math.min(sourceWidth, Math.ceil((left + width) * sourceWidth));
    const y1 = Math.min(sourceHeight, Math.ceil((top + height) * sourceHeight));
    const rect = { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
    return {
        ...rect,
        sourceCrop: {
            x: rect.left / sourceWidth,
            y: rect.top / sourceHeight,
            width: rect.width / sourceWidth,
            height: rect.height / sourceHeight
        }
    };
}

module.exports = { getPreprocessingProfile, getCropRect };
