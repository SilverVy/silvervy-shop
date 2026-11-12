const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Проверка на существующего пользователя
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }

        // Создание пользователя
        const user = await User.create({ name, email, password });

        // Генерация токена
        const token = generateToken(user);

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при регистрации', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Поиск пользователя
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        // Проверка пароля
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Неверный пароль' });
        }

        // Генерация токена
        const token = generateToken(user);

        res.status(200).json({
            message: 'Вход выполнен успешно',
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при входе', error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    res.status(200).json({
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            bodyMeasurements: req.user.bodyMeasurements || {}
        }
    });
};

exports.updateProfile = async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({ message: 'Передайте объект с мерками.' });
    }
    const allowed = ['heightCm', 'weightKg', 'chestCm', 'waistCm', 'hipCm', 'inseamCm', 'shoulderCm', 'armLengthCm', 'handLengthCm'];
    const ranges = require('../public/fit-engine').ranges;
    const measurements = { ...(req.user.bodyMeasurements || {}) };

    for (const key of allowed) {
        if (!Object.hasOwn(req.body, key)) continue;
        const value = req.body[key];
        if (value === null || value === undefined || value === '') {
            delete measurements[key];
            continue;
        }
        const number = Number(value);
        if (!['number', 'string'].includes(typeof value) || !Number.isFinite(number) || number < ranges[key][0] || number > ranges[key][1]) {
            return res.status(400).json({ message: 'Проверьте введённые параметры' });
        }
        measurements[key] = number;
    }

    try {
        await req.user.update({ bodyMeasurements: measurements });
        res.status(200).json({ message: 'Параметры сохранены', bodyMeasurements: measurements });
    } catch {
        console.error(JSON.stringify({ event: 'profile_save_failed', code: 'PROFILE_DATABASE' }));
        res.status(503).json({ message: 'Не удалось сохранить мерки в базе. Попробуйте позже.', code: 'PROFILE_DATABASE' });
    }
};