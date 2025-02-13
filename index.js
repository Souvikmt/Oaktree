const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const connectToCouchbase = require('./database/connection');
require('dotenv').config();
const { ENDPOINT_NOT_FOUND_ERR } = require('./src/middlewares/errors/errors');
const router = require('./src/routes');
const { errorHandler } = require('./src/middlewares/errors/errorMiddleware');
const PORT = 6400;
const moment = require('moment');
const { Server } = require("socket.io");
const http = require("http");
const app = express();
const logger = require('./src/logger/logger');

const server = http.createServer(app);

exports.io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
});

app.use(helmet());
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));

logger.stream = {
    write: (message, encoding) => {
        logger.http(message);
    }
};

app.use(require("morgan")("combined", { "stream": logger.stream }));

app.use('/api/', router);

app.use('*', (req, res, next) => {
    logger.info(`MT Requested URL: ${req.originalUrl}`);
    logger.info(`MT Requested Params: ${req.params}`);
    const error = {
        status: 404,
        message: ENDPOINT_NOT_FOUND_ERR
    };
    next(error);
});

// global error handling middleware
app.use(errorHandler);

const main = async () => {
    try {
        const cluster = await connectToCouchbase();

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (err) {
        console.error("❌ Unable to connect to the database:", err);
        process.exit(1);
    }
};

main();

