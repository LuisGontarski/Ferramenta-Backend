const express = require('express');
const router = express.Router();
const authController = require('../../controllers/login/authController');
const authenticate = ('../middleware/authenticate');

router.post('/login', authController.login);
router.get('/user', authController.getUserById)
router.post('/create', authController.create);
router.put('/update', authController.update);
router.delete('/delete', authController.delete);

module.exports = router;
