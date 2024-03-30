"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestPrice = exports.mt5Price = void 0;
const bullmq_1 = require("bullmq");
const config_1 = require("../config");
const dispatcher_1 = require("./dispatcher");
const latestPriceData = {};
const jobKeys = {};
async function startMt5PriceWorker(config) {
    const queueName = 'mt5PriceQueue';
    const queue = new bullmq_1.Queue(queueName, {
        connection: {
            host: config.bullmqRedisHost,
            port: config.bullmqRedisPort,
            password: config.bullmqRedisPassword,
        },
    });
    const queueEvents = new bullmq_1.QueueEvents(queueName, {
        connection: {
            host: config.bullmqRedisHost,
            port: config.bullmqRedisPort,
            password: config.bullmqRedisPassword,
        },
    });
    const worker = new bullmq_1.Worker(queueName, async (job) => {
        try {
            const symbols = Object.keys(jobKeys);
            const ticks = await (0, dispatcher_1.retrieveLatestTicks)(symbols, 'mt5.ICMarkets');
            for (const [symbol, prices] of Object.entries(ticks)) {
                const userAddress = jobKeys[symbol]?.split('_')[2] || '';
                if (prices.bid && prices.ask) {
                    latestPriceData[`${userAddress}_${symbol}`] = {
                        bid: prices.bid,
                        ask: prices.ask,
                    };
                    console.log(`Price for ${symbol} (${userAddress}): Bid=${prices.bid}, Ask=${prices.ask}`);
                }
            }
        }
        catch (error) {
            console.error('Error processing job:', error);
        }
    }, {
        connection: {
            host: config.bullmqRedisHost,
            port: config.bullmqRedisPort,
            password: config.bullmqRedisPassword,
        },
        concurrency: 1, // Process one job at a time
    });
    console.log('Mt5Price worker started');
}
async function mt5Price(symbol, updateSpeedMs, updateLengthMin, userAddress) {
    const updateSpeed = updateSpeedMs;
    const updateLength = updateLengthMin;
    const queue = new bullmq_1.Queue('mt5PriceQueue', {
        connection: {
            host: config_1.config.bullmqRedisHost,
            port: config_1.config.bullmqRedisPort,
            password: config_1.config.bullmqRedisPassword,
        },
    });
    const jobKey = `mt5PriceJob_${userAddress}_${symbol}`;
    if (jobKeys[jobKey]) {
        const existingJobId = jobKeys[jobKey];
        if (existingJobId) {
            const existingJob = await queue.getJob(existingJobId);
            if (existingJob) {
                try {
                    const failedError = new Error('Job updated');
                    await existingJob.moveToFailed(failedError, 'Job updated');
                }
                catch (error) {
                    if (error instanceof Error) {
                        if (error.message.includes('Lock mismatch')) {
                            console.warn(`Lock mismatch for job ${existingJobId}. Skipping move to failed state.`);
                        }
                        else if (error.message.includes('Missing lock')) {
                            console.warn(`Missing lock for job ${existingJobId}. Skipping move to failed state.`);
                        }
                        else {
                            console.error(`Error moving job ${existingJobId} to failed state:`, error);
                        }
                    }
                    else {
                        console.error(`Unknown error moving job ${existingJobId} to failed state:`, error);
                    }
                }
            }
        }
    }
    const workerData = {
        symbol,
        updateSpeed,
        updateLength,
        userAddress,
    };
    const job = await queue.add(jobKey, workerData, {
        repeat: {
            every: updateSpeed,
        },
    });
    jobKeys[jobKey] = job.id;
}
exports.mt5Price = mt5Price;
function getLatestPrice(userAddress, symbol) {
    const key = `${userAddress}_${symbol}`;
    return latestPriceData[key] || null;
}
exports.getLatestPrice = getLatestPrice;
// Start the Mt5Price worker automatically
startMt5PriceWorker(config_1.config)
    .then(() => {
    console.log('Mt5Price worker started successfully');
})
    .catch((error) => {
    console.error('Error starting Mt5Price worker:', error);
});
