const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const cartController = require('../controllers/cartController');

router.use(authMiddleware.authenticate);

router.get('/', cartController.getCart);
router.put('/', cartController.updateCart);

module.exports = router;