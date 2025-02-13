const express = require('express');
const router = express.Router();
const {
    loginUser
} = require('../../controllers/users/userController');

// const { authenticate } = require('../../controllers/middlewares/middlewareController');

router.post('/login', loginUser);
module.exports = router;