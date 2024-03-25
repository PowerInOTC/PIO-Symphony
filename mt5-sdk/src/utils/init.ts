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

import { config } from '../config';
import { createClient, RedisClientType } from 'redis';
import { Queue } from 'bullmq';

const client: RedisClientType = createClient({
  socket: {
    host: config.bullmqRedisHost,
    port: config.bullmqRedisPort,
  },
  password: config.bullmqRedisPassword,
});

const rfqQueue = new Queue('rfq', {
  connection: {
    host: config.bullmqRedisHost,
    port: config.bullmqRedisPort,
    password: config.bullmqRedisPassword,
  },
});

const pino = require('pino');
const pretty = require('pino-pretty');
const stream = pretty({
  colorize: true,
  colorizeObjects: true,
});
const logger = pino(stream);

export { client as redisClient, rfqQueue, logger };
