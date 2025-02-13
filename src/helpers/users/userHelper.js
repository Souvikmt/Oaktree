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
