"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMt5PriceWorker = exports.getLatestPrice = exports.mt5Price = void 0;
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
    const connection = {
        host: config.bullmqRedisHost,
        port: config.bullmqRedisPort,
        password: config.bullmqRedisPassword,
    };
    const queue = new bullmq_1.Queue(queueName, { connection });
    const queueEvents = new bullmq_1.QueueEvents(queueName, { connection });
    const worker = new bullmq_1.Worker(queueName, async (job) => {
        try {
            const { symbolPair, userAddress } = job.data;
            const [symbol1, symbol2] = symbolPair.split('/');
            const [tick1, tick2] = await Promise.all([
                retrieveLatestTick(symbol1),
                retrieveLatestTick(symbol2),
            ]);
            if (tick1.bid && tick1.ask && tick2.bid && tick2.ask) {
                const bidRatio = tick1.bid / tick2.bid;
                const askRatio = tick1.ask / tick2.ask;
                latestPriceData[`${userAddress}_${symbolPair}`] = {
                    bid: bidRatio,
                    ask: askRatio,
                };
            }
        }
        catch (error) {
            console.error('Error processing job:', error);
        }
    }, { connection, concurrency: 1 });
    console.log(`Mt5Price worker started`);
}
async function mt5Price(symbolPair, updateSpeedMs, updateLengthSec, userAddress) {
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
            await queue.removeRepeatableByKey(existingJobId);
            delete jobKeys[jobKey];
        }
    }
    const workerData = {
        symbolPair,
        updateSpeed: updateSpeedMs,
        updateLength: updateLengthSec,
        userAddress,
    };
    const job = await queue.add(jobKey, workerData, {
        repeat: {
            every: updateSpeedMs,
            limit: Math.floor((updateLengthSec * 1000) / updateSpeedMs),
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
startMt5PriceWorker(config_1.config)
    .then(() => {
    console.log('Mt5Price worker started successfully');
})
    .catch((error) => {
    console.error('Error starting Mt5Price worker:', error);
});
async function initMt5PriceWorker() {
    const connection = {
        host: config_1.config.bullmqRedisHost,
        port: config_1.config.bullmqRedisPort,
        password: config_1.config.bullmqRedisPassword,
    };
    const queue = new bullmq_1.Queue('mt5PriceQueue', { connection });
    // Clear all stored price data
    for (const key in latestPriceData) {
        delete latestPriceData[key];
    }
    // Remove all repeatable jobs from the queue
    const repeatableJobs = await queue.getRepeatableJobs();
    for (const job of repeatableJobs) {
        await queue.removeRepeatableByKey(job.key);
    }
    // Clear the jobKeys object
    for (const key in jobKeys) {
        delete jobKeys[key];
    }
    console.log('Mt5Price worker initialized. All pairs and jobs cleared.');
}
exports.initMt5PriceWorker = initMt5PriceWorker;
