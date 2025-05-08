const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports.authenticate = async (req, res, next) => {
    try {
        // Заменяем опциональную цепочку на стандартную проверку
        const authHeader = req.header('Authorization');
        const token = authHeader && authHeader.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Необходима авторизация' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'Пользователь не найден' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Неверный токен', error: error.message });
    }
};