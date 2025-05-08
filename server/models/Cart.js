const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Cart = db.define('Cart', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    items: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
    }
});

module.exports = Cart;