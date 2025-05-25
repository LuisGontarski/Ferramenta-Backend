const express = require('express');
const router = express.Router();
const authController = require('../../controllers/login/authController');
const authenticate = ('../middleware/authenticate');

router.get('/user', authController.getAllUsers);
router.post('/auth/login', authController.postAuthLogin);       
router.post('/user', authController.postCreateUser);               
router.get('/user/:usuario_id', authController.getUserById);           
router.put('/user/:id', authController.putUpdateUser);                
router.delete('/user/:id', authController.deleteUser);             

module.exports = router;
