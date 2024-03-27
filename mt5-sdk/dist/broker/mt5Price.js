"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mt5Price = void 0;
const bullmq_1 = require("bullmq");
const config_1 = require("../config");
const dispatcher_1 = require("./dispatcher");
const workers = {};
async function mt5Price(symbol, updateSpeedMs, updateLengthMin, userAddress) {
    try {
        const updateSpeed = updateSpeedMs;
        const updateLength = updateLengthMin;
        const queueName = `mt5Price_${userAddress}_${symbol}`;
        if (workers[userAddress]) {
            const workerOpts = workers[userAddress].opts;
            if (workers[userAddress].name !== queueName ||
                (workerOpts &&
                    workerOpts.limiter &&
                    workerOpts.limiter.duration !== updateSpeed)) {
                await workers[userAddress].close();
                delete workers[userAddress];
            }
            else {
                return;
            }
        }
        const queue = new bullmq_1.Queue(queueName, {
            connection: {
                host: config_1.config.bullmqRedisHost,
                port: config_1.config.bullmqRedisPort,
                password: config_1.config.bullmqRedisPassword,
            },
        });
        const queueEvents = new bullmq_1.QueueEvents(queueName, {
            connection: {
                host: config_1.config.bullmqRedisHost,
                port: config_1.config.bullmqRedisPort,
                password: config_1.config.bullmqRedisPassword,
            },
        });
        const workerData = {
            symbol,
            updateSpeed,
            updateLength,
            userAddress,
        };
        const worker = new bullmq_1.Worker(queueName, async (job) => {
            try {
                const { symbol } = job.data;
                const { bid, ask } = await (0, dispatcher_1.retrieveLatestTick)(symbol, 'mt5.ICMarkets');
                console.log(`Price for ${symbol}: Bid=${bid}, Ask=${ask}`);
            }
            catch (error) {
                console.error(`Error processing job for symbol ${job.data.symbol}:`, error);
            }
        }, {
            connection: {
                host: config_1.config.bullmqRedisHost,
                port: config_1.config.bullmqRedisPort,
                password: config_1.config.bullmqRedisPassword,
            },
            limiter: {
                max: 1,
                duration: updateSpeed,
            },
        });
        await queue.add(`mt5PriceJob_${userAddress}_${symbol}`, workerData, {
            repeat: {
                every: updateSpeed,
            },
        });
        setTimeout(() => {
            worker.close();
            queueEvents.close();
        }, updateLength);
        workers[userAddress] = worker;
    }
    catch (error) {
        console.error(`Error in mt5Price for symbol ${symbol} and user ${userAddress}:`, error);
    }
}
exports.mt5Price = mt5Price;
