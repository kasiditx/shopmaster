const express = require('express');
const { register, login, refreshToken, logout, currentUser } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { loginLimiter, registrationLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', registrationLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', auth, logout);
router.get('/me', auth, currentUser);

module.exports = router;
