const logger = require("../../logger/logger");
const { getName } = require('../../logger/logFunctionName');
const { SERVER_ERR } = require("./errors");

exports.errorHandler = async (err, req, res, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        let status = err.status || 500;
        let message = err.message || SERVER_ERR;
        if (err.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            logger.error('Error Response Data:', err.response.data);
            status = err.response.status;
            message = err.response.data?.error?.error_user_msg || err.response.data?.error?.message;
        } else if (err.request) {
            // The request was made but no response was received
            logger.error('The request was made but no response was received:', err.request);
        } 
        logger.error('Error occur due to %s in %s of %s', message, getName().functionName, getName().fileName);
        res.status(status).json({
            success: false,
            message
        })
    } catch (err) {
        logger.error('Error occur due to %s', err.message || JSON.stringify(err));
        res.status(500).json({
            success: false,
            message: err.message || JSON.stringify(err)
        })
    }
}