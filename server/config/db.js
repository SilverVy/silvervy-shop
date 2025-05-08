const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
);

// Проверка подключения
sequelize.authenticate()
    .then(() => {
        console.log('Подключение к PostgreSQL установлено');
    })
    .catch(err => {
        console.error('Ошибка подключения к PostgreSQL:', err);
    });

module.exports = sequelize;