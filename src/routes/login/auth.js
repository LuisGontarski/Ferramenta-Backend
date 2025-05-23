const express = require('express');
const router = express.Router();
const authController = require('../../controllers/login/authController');
const authenticate = ('../middleware/authenticate');

// Recurso: "users"
router.post('/auth/login', authController.postAuthLogin);       
router.post('/user', authController.postCreateUser);               
router.get('/user/:id', authController.getUserById);           
router.put('/user', authController.putUpdateUser);                
router.delete('/user/:id', authController.deleteUser);             

module.exports = router;
