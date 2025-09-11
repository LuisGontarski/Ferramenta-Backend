const express = require('express');
const router = express.Router();
const authController = require('../../controllers/login/authController');
//const authenticate = ('../middleware/authenticate');
const passwordMiddleware = require('../../middleware/login/passwordMiddleware');

router.get('/user', authController.getAllUsers);
router.post('/auth/login', authController.postAuthLogin);       
router.post('/user',passwordMiddleware, authController.postCreateUser);               
router.get('/user/:usuario_id', authController.getUserById);           
router.put('/user/:id', authController.putUpdateUser);                
router.delete('/user/:id', authController.deleteUser);   

router.put('/user/github/update', authController.updateUserGithub);
router.get('/user/github/exists/:usuario_id', authController.checkUserGithubExists);



module.exports = router;
