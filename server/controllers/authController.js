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