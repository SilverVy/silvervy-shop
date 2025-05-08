const db = require('../config/db');
const User = require('./User');
const Cart = require('./Cart');

// Связи между моделями (если нужны)
User.hasOne(Cart);
Cart.belongsTo(User);

User.hasOne(Cart, { foreignKey: 'userId' });
Cart.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    User,
    Cart,
    sequelize: db
};