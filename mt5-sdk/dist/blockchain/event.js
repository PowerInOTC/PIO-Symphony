"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalanceByUser = exports.fetchEvents = exports.resetRedisData = void 0;
const redis_1 = require("redis");
const init_1 = require("../utils/init");
const blockchainInterface_1 = require("./blockchainInterface");
const config_1 = require("../config");
let redisClient;
async function connectToRedis() {
    redisClient = (0, redis_1.createClient)({
        socket: {
            host: config_1.config.bullmqRedisHost,
            port: config_1.config.bullmqRedisPort,
        },
        password: config_1.config.bullmqRedisPassword,
    });
    redisClient.on('error', (err) => {
        init_1.logger.error('Redis connection error:', err);
        // Handle the error appropriately (e.g., retry, notify, etc.)
    });
    await redisClient.connect();
}
async function resetRedisData() {
    await connectToRedis();
    await redisClient.del([
        'user:*',
        'contract:*',
        'closeQuote:*',
        'oracle:*',
        'userRelatedInfo:*',
    ]);
}
exports.resetRedisData = resetRedisData;
async function fetchEvents(earliest = 'earliest', latest = 'latest', manualStart, manualFinish) {
    await connectToRedis();
    await blockchainInterface_1.blockchainInterfaceLib.forEachInterface(async (blockchainInterface) => {
        const start = manualStart ?? earliest;
        const finish = manualFinish ?? latest;
        const [compliance, open, close, _default] = await Promise.all([
            init_1.logger.info(`Fetching complianceeee events from ${start} to ${finish}`),
            blockchainInterface.fetchEvent('PionerV1Compliance', '*', start.toString(), finish),
            blockchainInterface.fetchEvent('PionerV1Open', '*', start.toString(), finish),
            blockchainInterface.fetchEvent('PionerV1Close', '*', start.toString(), finish),
            blockchainInterface.fetchEvent('PionerV1Default', '*', start.toString(), finish),
        ]);
        for (const log of compliance) {
            const parsedLog = log;
            if (parsedLog.name === 'DepositEvent' ||
                parsedLog.name === 'WithdrawEvent' ||
                parsedLog.name === 'CancelWithdrawEvent') {
                const user = parsedLog.args.user;
                await updateUserBalance(blockchainInterface, user);
            }
        }
        for (const log of open) {
            const parsedLog = log;
            if (parsedLog.name === 'openQuoteEvent' ||
                parsedLog.name === 'openQuoteSignedEvent' ||
                parsedLog.name === 'acceptQuoteEvent') {
                const bContractId = parsedLog.args.bContractId;
                await updateContractData(blockchainInterface, bContractId);
            }
        }
        for (const log of _default) {
            const parsedLog = log;
            if (parsedLog.name === 'settledEvent' ||
                parsedLog.name === 'liquidatedEvent') {
                const bContractId = parsedLog.args.bContractId;
                await updateContractData(blockchainInterface, bContractId);
            }
        }
        for (const log of close) {
            const parsedLog = log;
            if (parsedLog.name === 'openCloseQuoteEvent' ||
                parsedLog.name === 'acceptCloseQuoteEvent' ||
                parsedLog.name === 'closeMarketEvent') {
                const bCloseQuoteId = parsedLog.args.bCloseQuoteId;
                await updateCloseQuoteData(blockchainInterface, bCloseQuoteId);
            }
        }
        const userRelatedInfo = await blockchainInterface.getUserRelatedInfo('user_address', 'counterparty_address');
        await redisClient.hSet(`userRelatedInfo:user_address:counterparty_address`, {
            openPositionNumber: userRelatedInfo.openPositionNumber.toString(),
            owedAmount: userRelatedInfo.owedAmount.toString(),
            totalOwedAmount: userRelatedInfo.totalOwedAmount.toString(),
            totalOwedAmountPaid: userRelatedInfo.totalOwedAmountPaid.toString(),
            gracePeriodLockedWithdrawBalance: userRelatedInfo.gracePeriodLockedWithdrawBalance.toString(),
            gracePeriodLockedTime: userRelatedInfo.gracePeriodLockedTime.toString(),
            minimumOpenPartialFillNotional: userRelatedInfo.minimumOpenPartialFillNotional.toString(),
            sponsorReward: userRelatedInfo.sponsorReward.toString(),
            oracleLength: userRelatedInfo.oracleLength.toString(),
            contractLength: userRelatedInfo.contractLength.toString(),
            closeQuoteLength: userRelatedInfo.closeQuoteLength.toString(),
        });
    });
}
exports.fetchEvents = fetchEvents;
async function updateUserBalance(blockchainInterface, user) {
    try {
        const balance = await blockchainInterface.getBalance(user);
        await redisClient.hSet(`user:${user}`, 'balance', balance.toString());
        init_1.logger.info(`Updated balance for user ${user}: ${balance}`);
    }
    catch (error) {
        init_1.logger.error(`Error updating balance for user ${user}:`, error);
        // Handle the error appropriately (e.g., retry, notify, etc.)
    }
}
async function updateContractData(blockchainInterface, bContractId) {
    try {
        const contract = await blockchainInterface.getContract(bContractId);
        await redisClient.hSet(`contract:${bContractId.toString()}`, {
            pA: contract.pA,
            pB: contract.pB,
            oracleId: contract.oracleId.toString(),
            initiator: contract.initiator,
            price: contract.price.toString(),
            amount: contract.amount.toString(),
            interestRate: contract.interestRate.toString(),
            isAPayingAPR: contract.isAPayingAPR ? '1' : '0',
            openTime: contract.openTime.toString(),
            state: contract.state.toString(),
            frontEnd: contract.frontEnd,
            hedger: contract.hedger,
            affiliate: contract.affiliate,
            cancelTime: contract.cancelTime.toString(),
        });
        init_1.logger.info(`Updated contract data for bContractId ${bContractId}`);
    }
    catch (error) {
        init_1.logger.error(`Error updating contract data for bContractId ${bContractId}:`, error);
        // Handle the error appropriately (e.g., retry, notify, etc.)
    }
}
async function updateCloseQuoteData(blockchainInterface, bCloseQuoteId) {
    try {
        const closeQuote = await blockchainInterface.getCloseQuote(bCloseQuoteId);
        await redisClient.hSet(`closeQuote:${bCloseQuoteId.toString()}`, {
            bContractIds: JSON.stringify(closeQuote.bContractIds),
            price: JSON.stringify(closeQuote.price),
            amount: JSON.stringify(closeQuote.amount),
            limitOrStop: JSON.stringify(closeQuote.limitOrStop),
            expiry: JSON.stringify(closeQuote.expiry),
            initiator: closeQuote.initiator,
            cancelTime: closeQuote.cancelTime.toString(),
            openTime: closeQuote.openTime.toString(),
            state: closeQuote.state.toString(),
        });
        init_1.logger.info(`Updated close quote data for bCloseQuoteId ${bCloseQuoteId}`);
    }
    catch (error) {
        init_1.logger.error(`Error updating close quote data for bCloseQuoteId ${bCloseQuoteId}:`, error);
        // Handle the error appropriately (e.g., retry, notify, etc.)
    }
}
async function getBalanceByUser(user) {
    await connectToRedis();
    const balance = await redisClient.hGet(`user:${user}`, 'balance');
    return balance ? BigInt(balance) : BigInt(0);
}
exports.getBalanceByUser = getBalanceByUser;
