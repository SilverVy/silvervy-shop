const { User, Cart } = require('../models');
const { Op } = require('sequelize');

const UNISENDER_API_KEY = process.env.UNISENDER_API_KEY;
const UNISENDER_LIST_ID = process.env.UNISENDER_LIST_ID;
const SENDER_EMAIL = process.env.UNISENDER_SENDER_EMAIL;

async function sendOrderEmail({ to, orderNumber, city, address, notes, items, totalSum }) {
    if (!UNISENDER_API_KEY || !UNISENDER_LIST_ID || !SENDER_EMAIL) {
        console.error('UniSender не настроен (нет API ключа/списка/отправителя), письмо не отправлено');
        return;
    }

    const html = `
        <h2>Ваш заказ №${orderNumber} принят!</h2>
        <p>Детали доставки:</p>
        <ul>
          <li>Город: ${city}</li>
          <li>Адрес: ${address}</li>
          ${notes ? `<li>Примечания: ${notes}</li>` : ''}
        </ul>
        <p>Товары:</p>
        <ul>
          ${items.map(item => `
            <li>${item.name} - ${item.price} руб.</li>
          `).join('')}
        </ul>
        <p>Сумма: ${totalSum} руб.</p>
        <p>Мы свяжемся с вами в течение часа для уточнения деталей.</p>
      `;

    const params = new URLSearchParams({
        format: 'json',
        api_key: UNISENDER_API_KEY,
        email: to,
        sender_name: 'Silver.Vy',
        sender_email: SENDER_EMAIL,
        subject: 'Заказ оформлен',
        body: html,
        list_id: UNISENDER_LIST_ID
    });

    const response = await fetch(`https://api.unisender.com/ru/api/sendEmail?${params.toString()}`);
    const data = await response.json();

    if (data.error) {
        throw new Error(`UniSender API error: ${data.error}`);
    }
}

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

        // Попытка отправить письмо — не блокирует оформление заказа
        sendOrderEmail({
            to: user.email,
            orderNumber,
            city,
            address,
            notes,
            items: user.Cart.items,
            totalSum
        }).catch(emailErr => {
            console.error('Ошибка отправки письма (заказ всё равно оформлен):', emailErr.message);
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
