"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestMaxNotional = exports.brokerHealth = void 0;
const bullmq_1 = require("bullmq");
const config_1 = require("../config");
const dispatcher_1 = require("./dispatcher");
const latestMaxNotionalData = {};
const jobKeys = {};
async function startBrokerHealthWorker(config) {
    const queueName = 'brokerHealthQueue';
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
            const { broker } = job.data;
            const maxNotional = await (0, dispatcher_1.retrieveMaxNotional)(broker);
            latestMaxNotionalData[broker] = maxNotional;
            console.log(`Max notional for ${broker}: ${maxNotional}`);
        }
        catch (error) {
            console.error(`Error processing job for broker ${job.data.broker}:`, error);
        }
    }, {
        connection: {
            host: config.bullmqRedisHost,
            port: config.bullmqRedisPort,
            password: config.bullmqRedisPassword,
        },
        concurrency: 1, // Process one job at a time
    });
    console.log('BrokerHealth worker started');
}
async function brokerHealth(broker, updateSpeedMs, updateLengthMin) {
    const updateSpeed = updateSpeedMs;
    const updateLength = updateLengthMin;
    const queue = new bullmq_1.Queue('brokerHealthQueue', {
        connection: {
            host: config_1.config.bullmqRedisHost,
            port: config_1.config.bullmqRedisPort,
            password: config_1.config.bullmqRedisPassword,
        },
    });
    const jobKey = `brokerHealthJob_${broker}`;
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
        broker,
        updateSpeed,
        updateLength,
    };
    const job = await queue.add(jobKey, workerData, {
        repeat: {
            every: updateSpeed,
        },
    });
    jobKeys[jobKey] = job.id;
}
exports.brokerHealth = brokerHealth;
function getLatestMaxNotional(broker) {
    return latestMaxNotionalData[broker] || null;
}
exports.getLatestMaxNotional = getLatestMaxNotional;
// Start the BrokerHealth worker automatically
startBrokerHealthWorker(config_1.config)
    .then(() => {
    console.log('BrokerHealth worker started successfully');
})
    .catch((error) => {
    console.error('Error starting BrokerHealth worker:', error);
});
