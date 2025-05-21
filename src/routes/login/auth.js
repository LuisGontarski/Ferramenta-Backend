const express = require('express');
const router = express.Router();
const authController = require('../../controllers/login/authController');
const authenticate = ('../middleware/authenticate');

router.post('/login', authController.login);

module.exports = router;
