const {
    validateUserLogin,
    validateGlobalSignOutParams,
    validateLocalSignOutParams,
    validateRefreshTokenParams,
    validateForgotPasswordParams,
    validateResetPasswordParams
} = require("../../helpers/users/userHelper");

const {
    loginCheck,
    globalSignOut,
    localSignOut,
    refreshToken,
    forgotPassword,
    resetPassword
} = require("../../models/queryModels/users/user");

const logger = require('../../logger/logger');
const { getName } = require('../../logger/logFunctionName');

exports.loginUser = async (req, res, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        const validParams = validateUserLogin(req, next);
        if (validParams) {
            logger.info("%s validParams got success response true: %s", getName().functionName, JSON.stringify(validParams));
            const responseData = await loginCheck(validParams);
            if (responseData.data.status) {
                var response = {
                    "success": responseData.data.status,
                    "message": responseData.data.message,
                    "result": responseData.data.result,
                }
                logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
                res.send(response);
            } else {
                var response = {
                    "success": responseData.data.status,
                    "message": responseData.data.message,
                }
                logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
                res.status(400).json(response);
            }
        }
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ message: "Internal Server Error" });
    }
}

exports.globalSignOut = async (req, res, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        // Check in the parameters send by user is all valid
        const validParams = validateGlobalSignOutParams(req, next);
        if (validParams) {
            logger.info("%s validParams got success response true: %s", getName().functionName, JSON.stringify(validParams));
            var params = {
                AccessToken: validParams.data.accesstoken,
            };
            await globalSignOut(params, next, (response) => {
                if (response.success) {
                    logger.info("*** Ending %s of %s ***", getName().functionName, getName().fileName);
                    res.send({ "success": true, "message": response.message });
                }
            })
        }
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ message: "Internal Server Error" });
    }
}

exports.localSignOut = async (req, res, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        // Check in the parameters send by user is all valid
        // const validParams = validateLocalSignOutParams(req, next);
        if (true) {
            // logger.info("%s validParams got success response true: %s", getName().functionName, JSON.stringify(validParams));
            var params = {
                // email: validParams.data.email,
            };
            await localSignOut(params, next, (response) => {
                if (response.success) {
                    logger.info("*** Ending %s of %s ***", getName().functionName, getName().fileName);
                    res.send({ "success": true, "message": response.message });
                }
            })
        }
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ message: "Internal Server Error" });
    }
}

exports.refreshToken = async (req, res, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        const validParams = validateRefreshTokenParams(req, next);
        if (validParams) {
            logger.info("%s validParams got success response true: %s", getName().functionName, JSON.stringify(validParams));
            var params = {
                refreshToken: validParams.data.refreshToken,
            };
            await refreshToken(params, next, (response) => {
                if (response.success) {
                    logger.info("*** Ending %s of %s ***", getName().functionName, getName().fileName);
                    res.send({ "success": true, "data": response.data });
                }
            })
        }
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ message: "Internal Server Error" });
    }
}

exports.forgotPassword = async (req, res, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        const validParams = validateForgotPasswordParams(req, next);
        if (validParams) {
            logger.info("%s validParams got success response true: %s", getName().functionName, JSON.stringify(validParams));
            await forgotPassword(validParams, next, (response) => {
                if (response.success) {
                    logger.info("*** Ending %s of %s ***", getName().functionName, getName().fileName);
                    res.send({ "success": true, "message": response.message });
                }
            })
        }
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ message: "Internal Server Error" });
    }
}

exports.resetPassword = async (req, res, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        const validParams = validateResetPasswordParams(req, next);
        if (validParams) {
            logger.info("%s validParams got success response true: %s", getName().functionName, JSON.stringify(validParams));
            await resetPassword(validParams, next, (response) => {
                if (response.success) {
                    logger.info("*** Ending %s of %s ***", getName().functionName, getName().fileName);
                    res.send({ "success": true, "message": response.message });
                }
            })
        }
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ message: "Internal Server Error" });
    }
}