const express = require('express');
const { register, login, resetPassword, me } = require('../controllers/authController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.get('/me', requireAuth, me);

module.exports = router;
