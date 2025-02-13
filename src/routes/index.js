const express = require('express');
const router = express.Router();

const userRouter = require('../routes/users/userRouter');
// const { authenticate } = require('../../universal/controllers/middlewares/middlewareController');

router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Session');
    res.header('Access-Control-Allow-Headers', 'Authorization');
    res.header('Access-Control-Allow-Headers', 'Accesstoken');
    res.header('Access-Control-Allow-Headers', 'language');
    res.header('Access-Control-Allow-Headers', 'qlanguage');
    next();
});

router.use('/users', userRouter);
module.exports = router;