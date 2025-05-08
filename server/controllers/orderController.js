// controllers/orderController.js
const { User, Cart } = require('../models');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.createOrder = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: {
                model: Cart,
                where: {
                    items: {
                        [Op.not]: null
                    }
                }
            }
        });

        // Исправленная проверка без оператора ?.
        if (!user || !user.Cart || !user.Cart.items || user.Cart.items.length === 0) {
            return res.status(400).json({ message: 'Корзина пуста' });
        }

        const { city, address, notes } = req.body;

        if (!city || !address) {
            return res.status(400).json({ message: 'Заполните город и адрес' });
        }

        await transporter.sendMail({
            from: `"Silver.Vy" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Заказ оформлен',
            html: `
        <h2>Ваш заказ №${Date.now()} принят!</h2>
        <p>Детали доставки:</p>
        <ul>
          <li>Город: ${city}</li>
          <li>Адрес: ${address}</li>
          ${notes ? `<li>Примечания: ${notes}</li>` : ''}
        </ul>
        <p>Товары:</p>
        <ul>
          ${user.Cart.items.map(item => `
            <li>${item.name} - ${item.price} руб.</li>
          `).join('')}
        </ul>
        <p>Сумма: ${user.Cart.items.reduce((sum, item) => sum + item.price, 0)} руб.</p>
        <p>Мы свяжемся с вами в течение часа для уточнения деталей.</p>
      `
        });

        await Cart.update(
            { items: [] },
            { where: { userId: user.id } }
        );

        res.status(200).json({ message: 'Заказ успешно оформлен' });

    } catch (error) {
        console.error('Ошибка оформления заказа:', error);
        res.status(500).json({ message: 'Ошибка при оформлении заказа' });
    }
};