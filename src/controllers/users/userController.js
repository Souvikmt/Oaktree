const {
    validateUserLogin
} = require("../../helpers/users/userHelper");

const {
    loginCheck
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
