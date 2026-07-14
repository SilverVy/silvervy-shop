// controllers/orderController.js
const { User, Cart } = require('../models');
const { Op } = require('sequelize');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'info@silvervy.ru';

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

        if (!user || !user.Cart || !user.Cart.items || user.Cart.items.length === 0) {
            return res.status(400).json({ message: 'Корзина пуста' });
        }

        const { city, address, notes } = req.body;

        if (!city || !address) {
            return res.status(400).json({ message: 'Заполните город и адрес' });
        }

        const orderNumber = Date.now();
        const totalSum = user.Cart.items.reduce((sum, item) => sum + item.price, 0);

        // Отправка письма через Resend
        await resend.emails.send({
            from: `Silver.Vy <${FROM_EMAIL}>`,
            to: user.email,
            subject: `Заказ №${orderNumber} оформлен`,
            html: `
                <h2>Ваш заказ №${orderNumber} принят!</h2>
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
                <p><strong>Сумма: ${totalSum} руб.</strong></p>
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
