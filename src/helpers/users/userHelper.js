const logger = require('../../logger/logger');
const { getName } = require('../../logger/logFunctionName');
const Joi = require('joi');

exports.validateUserLogin = (req, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        let data = req.body;
        const schemas = Joi.object({
            email: Joi.string().required().email(),
            password: Joi.string().min(6).required()
        });
        const validation = schemas.validate(data);
        if (validation.error) {
            next({ "status": 400, "success": false, "message": validation.error.details[0].message });
        } else {
            return ({ "status": 200, "success": true, "data": validation.value });
        }
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ "status": 500, "success": false, "message": "Internal Server Error" });
    }
}

exports.validateGlobalSignOutParams = (req, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        let headerparams = req.headers;
        let accesstoken = headerparams.accesstoken;
        if (!accesstoken || accesstoken.trim() == '') {
            logger.error("User accesstoken is required in %s ", getName().functionName);
            next({ "success": false, "message": "USER_ACCESS_TOKEN_REQUIRED" });
        }
        logger.info("%s parameters received in headers[accesstoken]: %s", getName().functionName, accesstoken);
        const params = {};
        params["accesstoken"] = accesstoken;
        logger.info("*** Ending %s of %s ***", getName().functionName, getName().fileName);
        return { "success": true, "data": params };
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ "status": 500, "success": false, "message": "Internal Server Error" });
    }
}

exports.validateLocalSignOutParams = (req, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        let data = req.body;
        const schemas = Joi.object({
            email: Joi.string().required().email()
        });
        const validation = schemas.validate(data);
        if (validation.error) {
            next({ "status": 400, "success": false, "message": validation.error.details[0].message });
        } else {
            return ({ "status": 200, "success": true, "data": validation.value });
        }
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ "status": 500, "success": false, "message": "Internal Server Error" });
    }
}


exports.validateRefreshTokenParams = (req, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        const headerparams = req.headers;
        const refreshToken = headerparams.refreshtoken;
        let required_parameters_hash = {refreshToken:refreshToken}
        const schemas = Joi.object({
            refreshToken: Joi.string().min(1).required(),
            clientId: Joi.string()
        });
        const validation = schemas.validate(required_parameters_hash);
        if (validation.error) {
            next({ "status": 400, "success": false, "message": validation.error.details[0].message });
            return;
        } else {
            return ({ "status": 200, "success": true, "data": validation.value });
        }
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ "status": 500, "success": false, "message": "Internal Server Error" });
    }
}

exports.validateForgotPasswordParams = (req, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        let data = req.body;
        const schemas = Joi.object({
            email: Joi.string().required().email()
        });
        const validation = schemas.validate(data);
        if (validation.error) {
            next({ "status": 400, "success": false, "message": validation.error.details[0].message });
        } else {
            return ({ "status": 200, "success": true, "data": validation.value });
        }
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ "status": 500, "success": false, "message": "Internal Server Error" });
    }
}

exports.validateResetPasswordParams = (req, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        let data = req.body;
        const schemas = Joi.object({
            email: Joi.string().required().email(),
            password: Joi.string().min(6).required(),
            user_type: Joi.string(),
            verificationCode: Joi.string().min(4).required(),
        });
        const validation = schemas.validate(data);
        if (validation.error) {
            next({ "status": 400, "success": false, "message": validation.error.details[0].message });
        } else {
            return ({ "status": 200, "success": true, "data": validation.value });
        }
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ "status": 500, "success": false, "message": "Internal Server Error" });
    }
}