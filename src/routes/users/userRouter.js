const express = require('express');
const router = express.Router();
const {
    loginUser,
    globalSignOut,
    localSignOut,
    refreshToken,
    forgotPassword,
    resetPassword
} = require('../../controllers/users/userController');

// const { authenticate } = require('../../controllers/middlewares/middlewareController');

router.post('/login', loginUser);
router.delete('/globalSignOut', globalSignOut);
router.delete('/localSignOut', localSignOut);
router.patch('/refreshToken', refreshToken);
router.put('/forgotpassword', forgotPassword);
router.put('/resetpassword', resetPassword);
module.exports = router;