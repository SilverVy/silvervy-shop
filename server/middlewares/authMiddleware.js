const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');
const { User } = require('../models');

function reject(res, status, code, message, reason) {
    const requestId = randomUUID();
    // Never log the Authorization header, token, JWT payload or personal details.
    console.warn(JSON.stringify({ event: 'site_auth_rejected', requestId, code, reason }));
    return res.status(status).json({ code, message, requestId });
}

module.exports.authenticate = async (req, res, next) => {
    const header = req.header('Authorization') || '';
    const match = header.match(/^Bearer\s+(\S+)\s*$/i);
    if (!match) return reject(res, 401, 'AUTH_REQUIRED', 'Войдите в аккаунт сайта для продолжения.', 'missing_bearer');
    const token = match[1];
    if (token.startsWith('hf_')) {
        return reject(res, 401, 'AUTH_WRONG_TOKEN_TYPE',
            'Это токен Hugging Face, а не сессия Silver.Vy. Войдите в аккаунт сайта. HF_TOKEN настраивается только на сервере.',
            'provider_token_used_for_site');
    }
    if (!process.env.JWT_SECRET) {
        return reject(res, 503, 'AUTH_CONFIG', 'Авторизация сайта не настроена на сервере. Администратору нужно проверить JWT_SECRET.', 'jwt_secret_missing');
    }
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        if (!decoded || typeof decoded !== 'object' || !decoded.id) throw new Error('Invalid payload');
    } catch (error) {
        const expired = error.name === 'TokenExpiredError';
        return reject(res, 401, expired ? 'AUTH_EXPIRED' : 'AUTH_INVALID',
            expired ? 'Сессия сайта истекла. Войдите заново; токен Hugging Face менять не нужно.'
                : 'Сессия сайта недействительна. Войдите заново; это не ошибка токена Hugging Face.',
            expired ? 'expired' : 'invalid_signature_or_format');
    }
    try {
        const user = await User.findByPk(decoded.id);
        if (!user) return reject(res, 401, 'AUTH_USER_MISSING', 'Аккаунт сессии не найден. Войдите заново.', 'user_missing');
        req.user = user;
        return next();
    } catch {
        return reject(res, 503, 'AUTH_DATABASE', 'Не удалось проверить аккаунт: база данных временно недоступна.', 'database_unavailable');
    }
};
