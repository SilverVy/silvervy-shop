const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const tryOnController = require('../controllers/tryOnController');

router.post('/', authMiddleware.authenticate, tryOnController.generate);

module.exports = router;
