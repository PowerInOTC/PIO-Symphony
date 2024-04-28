"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestPrice = exports.mt5Price = void 0;
const bullmq_1 = require("bullmq");
const config_1 = require("../config");
const axios_1 = __importDefault(require("axios"));
const latestPriceData = {};
const jobKeys = {};
async function retrieveLatestTick(symbol) {
    try {
        const response = await axios_1.default.get(`${config_1.config.apiBaseUrl}/retrieve_latest_tick/${symbol}`);
        return response.data;
    }
    catch (error) {
        console.error(`Error retrieving latest tick for ${symbol}:`, error);
        return { bid: 0, ask: 0 };
    }
}
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
            const { symbolPair, userAddress } = job.data;
            if (symbolPair) {
                const [symbol1, symbol2] = symbolPair.split('/');
                if (symbol1 && symbol2) {
                    const tick1 = await retrieveLatestTick(symbol1);
                    const tick2 = await retrieveLatestTick(symbol2);
                    if (tick1.bid && tick1.ask && tick2.bid && tick2.ask) {
                        const bidRatio = tick1.bid / tick2.bid;
                        const askRatio = tick1.ask / tick2.ask;
                        latestPriceData[`${userAddress}_${symbolPair}`] = {
                            bid: bidRatio,
                            ask: askRatio,
                        };
                    }
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
    console.log(`Mt5Price worker started`);
}
async function mt5Price(symbolPair, updateSpeedMs, updateLengthMin, userAddress) {
    const updateSpeed = updateSpeedMs;
    const updateLength = updateLengthMin;
    const queue = new bullmq_1.Queue('mt5PriceQueue', {
        connection: {
            host: config_1.config.bullmqRedisHost,
            port: config_1.config.bullmqRedisPort,
            password: config_1.config.bullmqRedisPassword,
        },
    });
    const jobKey = `mt5PriceJob_${userAddress}_${symbolPair}`;
    if (jobKeys[jobKey]) {
        const existingJobId = jobKeys[jobKey];
        if (existingJobId) {
            const existingJob = await queue.getJob(existingJobId);
            if (existingJob) {
                try {
                    await existingJob.remove();
                }
                catch (error) {
                    console.error(`Error removing existing job ${existingJobId}:`, error);
                }
            }
        }
    }
    const workerData = {
        symbolPair,
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
function getLatestPrice(userAddress, symbolPair) {
    const key = `${userAddress}_${symbolPair}`;
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
