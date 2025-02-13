const winston = require('winston');
const { format } = winston;
const EV = require('../environment');

// const AWS = require('aws-sdk');
// const CloudWatchLogsTransport = require('winston-cloudwatch');
// var pjson = require('../../package.json');

const logFormat = format.printf(({ level, message, timestamp, metadata = null }) => {
    let msg = `${timestamp} [${level}] : ${message} `
    if (metadata) {
        msg += JSON.stringify(metadata)
    }
    return msg
});

let customLevels = {};


let loggerSettings = {
    format: format.combine(
        format.colorize({ all: true }),
        format.splat(),
        format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new winston.transports.Console()
    ]
    /*transports: [
        //new winston.transports.Console(),
        // new winston.transports.File({ filename: 'combined.log' })
        // Logs on CloudWatch
        new CloudWatchLogsTransport({
            logGroupName: `${pjson.name}_${EV.PROJECT_ENVIROMENT}_app_LG`,
            logStreamName: `${new Date().toISOString().split('T')[0]}_LS`,
            awsAccessKeyId: EV.ACCESS_KEY_ID,
            awsSecretKey: EV.SECRECT_ACCESS_KEY,
            awsRegion: EV.REGION
        })
    ]*/
}

if (EV.NODE_ENV !== 'development') {
    //loggerSettings["level"]='error'
    customLevels = {
        levels: {
            error: 0,
            http: 1,
            debug: 2,
            info: 3
        },
        colors: {
            error: 'red',
            http: 'magenta',
            debug: 'yellow',
            info: 'green'
        }
    };
    loggerSettings["levels"] = customLevels.levels,
        winston.addColors(customLevels.colors);
}
if (EV.NODE_ENV === 'development') {
    customLevels = {
        levels: {
            error: 0,
            http: 1,
            debug: 2,
            info: 3
        },
        colors: {
            error: 'red',
            http: 'magenta',
            debug: 'yellow',
            info: 'green'
        }
    };
    loggerSettings["levels"] = customLevels.levels,
        winston.addColors(customLevels.colors);
}


const logger = winston.createLogger(loggerSettings);
module.exports = logger;