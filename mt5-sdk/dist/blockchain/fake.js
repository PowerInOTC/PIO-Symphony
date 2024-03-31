"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = void 0;
const ethers_1 = require("ethers");
const blockchain_client_1 = require("@pionerfriends/blockchain-client");
const init_1 = require("../utils/init");
const bullmq_1 = require("bullmq");
const config_1 = require("../config");
const blockchainInterface_1 = require("./blockchainInterface");
const rpcURL = 'https://rpc.sonic.fantom.network/';
const rpcKey = '';
const queueEvents = new bullmq_1.QueueEvents('retryQueue', {
    connection: {
        host: config_1.config.bullmqRedisHost,
        port: config_1.config.bullmqRedisPort,
        password: config_1.config.bullmqRedisPassword,
    },
});
const retryQueue = new bullmq_1.Queue('retryQueue', {
    connection: {
        host: config_1.config.bullmqRedisHost,
        port: config_1.config.bullmqRedisPort,
        password: config_1.config.bullmqRedisPassword,
    },
});
const retryWorker = new bullmq_1.Worker('retryQueue', async (job) => {
    const { blockchainInterfaceIndex, functionName, args } = job.data;
    const blockchainInterface = blockchainInterface_1.blockchainInterfaceLib.getInterfaceByIndex(blockchainInterfaceIndex);
    try {
        let result;
        if (functionName === 'mint') {
            result = await blockchainInterface.mint(...args);
        }
        else if (functionName === 'approve') {
            result = await blockchainInterface.approve(...args);
        }
        else if (functionName === 'deposit') {
            result = await blockchainInterface.deposit(...args);
        }
        init_1.logger.info(` ${functionName} succeeded: ${JSON.stringify(result)}`);
    }
    catch (error) {
        init_1.logger.error(`Transaction failed in ${functionName} function: ${error}`);
        if (job.attemptsMade >= 5) {
            // Log the full error details when the maximum number of attempts is reached
            init_1.logger.error(`Transaction failed in ${functionName} function after 5 attempts: ${error}`);
            throw new Error(`Transaction failed in ${functionName} function after 5 attempts: ${error}`);
        }
        throw error;
    }
}, {
    connection: {
        host: config_1.config.bullmqRedisHost,
        port: config_1.config.bullmqRedisPort,
        password: config_1.config.bullmqRedisPassword,
    },
    concurrency: 1,
});
async function mint(blockchainInterfaceIndex, amount) {
    const jobData = {
        blockchainInterfaceIndex,
        functionName: 'mint',
        args: [amount.toString()],
    };
    try {
        const job = await retryQueue.add('retryJob', jobData, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: true,
            removeOnFail: true,
            jobId: `interface${blockchainInterfaceIndex}_mint`,
        });
        await job.waitUntilFinished(queueEvents);
    }
    catch (error) {
        init_1.logger.error(`Error in mint function: ${error.message}`);
        throw error;
    }
}
async function approve(blockchainInterfaceIndex, spender, amount) {
    const jobData = {
        blockchainInterfaceIndex,
        functionName: 'approve',
        args: [spender, amount.toString()],
    };
    try {
        const job = await retryQueue.add('retryJob', jobData, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: true,
            removeOnFail: true,
            jobId: `interface${blockchainInterfaceIndex}_approve`,
        });
        await job.waitUntilFinished(queueEvents);
    }
    catch (error) {
        init_1.logger.error(`Error in approve function: ${error.message}`);
        throw error;
    }
}
async function deposit(blockchainInterfaceIndex, amount, depositType, recipient) {
    const jobData = {
        blockchainInterfaceIndex,
        functionName: 'deposit',
        args: [amount.toString(), depositType, recipient],
    };
    try {
        const job = await retryQueue.add('retryJob', jobData, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: true,
            removeOnFail: true,
            jobId: `interface${blockchainInterfaceIndex}_deposit`,
        });
        await job.waitUntilFinished(queueEvents);
    }
    catch (error) {
        init_1.logger.error(`Error in deposit function: ${error.message}`);
        throw error;
    }
}
async function test() {
    try {
        await mint(0, ethers_1.ethers.parseUnits('10000', 18));
        await approve(0, blockchain_client_1.networks.sonic.contracts.PionerV1Compliance, ethers_1.ethers.parseUnits('10000', 18));
        const interface1 = blockchainInterface_1.blockchainInterfaceLib.getInterfaceByIndex(0);
        await deposit(0, ethers_1.ethers.parseUnits('10000', 18), 1, '0xd0dDF915693f13Cf9B3b69dFF44eE77C901882f8');
        await mint(1, ethers_1.ethers.parseUnits('5000', 18));
        await approve(1, blockchain_client_1.networks.sonic.contracts.PionerV1Compliance, ethers_1.ethers.parseUnits('5000', 18));
        await deposit(1, ethers_1.ethers.parseUnits('5000', 18), 1, '0xd0dDF915693f13Cf9B3b69dFF44eE77C901882f8');
    }
    catch (error) {
        init_1.logger.error(`Error in test function: ${error.message}`);
        throw error;
    }
}
exports.test = test;
