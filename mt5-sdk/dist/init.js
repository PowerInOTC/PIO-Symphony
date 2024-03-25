"use strict";
/*
// init
    init db with events
    PionerV1.mintTestNet(1e36):
    set MM address
    init MT5 connection
    login to API ?
    config fill
    max leverage
    */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.rfqQueue = exports.redisClient = void 0;
const config_1 = require("./config");
const redis_1 = require("redis");
const bullmq_1 = require("bullmq");
const client = (0, redis_1.createClient)({
    socket: {
        host: config_1.config.bullmqRedisHost,
        port: config_1.config.bullmqRedisPort,
    },
    password: config_1.config.bullmqRedisPassword,
});
exports.redisClient = client;
const rfqQueue = new bullmq_1.Queue('rfq', {
    connection: {
        host: config_1.config.bullmqRedisHost,
        port: config_1.config.bullmqRedisPort,
        password: config_1.config.bullmqRedisPassword,
    },
});
exports.rfqQueue = rfqQueue;
const pino = require('pino');
const pretty = require('pino-pretty');
const stream = pretty({
    colorize: true,
    colorizeObjects: true,
});
const logger = pino(stream);
exports.logger = logger;
