const { Cart, User } = require('../models');

exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        let cart = await Cart.findOne({ where: { userId } });

        if (!cart) {
            // Создаем новую корзину, если ее нет
            cart = await Cart.create({ userId, items: [] });
        }

        res.status(200).json(cart.items);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении корзины', error: error.message });
    }
};

exports.updateCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { items } = req.body;

        let cart = await Cart.findOne({ where: { userId } });

        if (!cart) {
            // Создаем новую корзину, если ее нет
            cart = await Cart.create({ userId, items });
        } else {
            // Обновляем существующую корзину
            cart.items = items;
            await cart.save();
        }

        res.status(200).json({ message: 'Корзина обновлена', items: cart.items });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обновлении корзины', error: error.message });
    }
};

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.createOrder = async (req, res) => {
    try {
        const user = req.user;
        const { city, address, notes } = req.body;

        const cart = JSON.parse(localStorage.getItem('cart')) || [];

        // Отправка письма
        await transporter.sendMail({
            from: `"Silver.Vy" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Заказ оформлен',
            html: `
        <h2>Ваш заказ принят!</h2>
        <p>Детали доставки:</p>
        <ul>
          <li>Город: ${city}</li>
          <li>Адрес: ${address}</li>
          ${notes ? `<li>Примечания: ${notes}</li>` : ''}
        </ul>
        <p>В ближайшее время мы свяжемся с вами для уточнения деталей отправки.</p>
      `
        });

        // Очистка корзины
        localStorage.removeItem('cart');

        res.status(200).json({ message: 'Заказ оформлен' });
    } catch (error) {
        console.error('Ошибка отправки письма:', error);
        res.status(500).json({ message: 'Ошибка при оформлении заказа' });
    }
};