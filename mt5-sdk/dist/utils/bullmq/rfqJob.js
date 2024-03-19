"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRFQ = void 0;
const config_1 = require("../config/config");
const input = {
    id: '669980b0-7443-4733-b47f-c70b2c76cf58',
    chainId: 80001,
    createdAt: 1710584305,
    userId: '11831922-702c-4280-80ed-6cb8f11b2386',
    expiration: 315360000,
    AssetAId: 'crypto.BTC',
    AssetBId: 'crypto.ETH',
    sPrice: '99.990000000000000000',
    sQuantity: '99.990000000000000000',
    sInterestRate: '9.9900',
    sIsPayingApr: true,
    sImA: '9.990000000000000000',
    sImB: '9.990000000000000000',
    sDfA: '9.990000000000000000',
    sDfB: '9.990000000000000000',
    sExpirationA: 3600,
    sExpirationB: 3600,
    sTimelockA: 3600,
    sTimelockB: 3600,
    lPrice: '99.990000000000000000',
    lQuantity: '99.990000000000000000',
    lInterestRate: '9.9900',
    lIsPayingApr: true,
    lImA: '9.990000000000000000',
    lImB: '9.990000000000000000',
    lDfA: '9.990000000000000000',
    lDfB: '9.990000000000000000',
    lExpirationA: 3600,
    lExpirationB: 3600,
    lTimelockA: 3600,
    lTimelockB: 3600,
};
let userAddresses = [];
let bidAsks = [];
// Function to update or create userAddress if lastUpdate was < 5 seconds
async function updateUserAddress(userId, chainId, balance) {
    const existingUser = userAddresses.find((user) => user.address === userId && user.chainId === chainId);
    if (existingUser) {
        if (Date.now() - existingUser.lastUpdate < 5000) {
            existingUser.balance = balance;
            existingUser.lastUpdate = Date.now();
        }
    }
    else {
        userAddresses.push({
            address: userId,
            chainId,
            balance,
            lastUpdate: Date.now(),
        });
    }
}
// Function to update or create bidAsk if lastUpdate was < 2 seconds
async function updateBidAsk(assetId, bid, ask, qty, freeHedgerMargin) {
    const existingBidAsk = bidAsks.find((bidAsk) => bidAsk.assetId === assetId);
    if (existingBidAsk) {
        if (Date.now() - existingBidAsk.lastUpdate < 2000) {
            existingBidAsk.bid = bid;
            existingBidAsk.ask = ask;
            existingBidAsk.qty = qty;
            existingBidAsk.freeHedgerMargin = freeHedgerMargin;
            existingBidAsk.lastUpdate = Date.now();
        }
    }
    else {
        bidAsks.push({
            assetId,
            bid,
            ask,
            qty,
            lastUpdate: Date.now(),
            freeHedgerMargin,
        });
    }
}
// Function to get bidAsk, and update if time is superior or asset doesn't exist
async function getBidAsk(assetId) {
    const existingBidAsk = bidAsks.find((bidAsk) => bidAsk.assetId === assetId);
    if (!existingBidAsk || Date.now() - existingBidAsk.lastUpdate > 2000) {
        // Update bidAsk data
        const { bid, ask, qty, freeHedgerMargin } = await fetchBidAskData(assetId);
        await updateBidAsk(assetId, bid, ask, qty, freeHedgerMargin);
    }
    return bidAsks.find((bidAsk) => bidAsk.assetId === assetId);
}
// Function to get userBalance, and update if time is superior or user doesn't exist
async function getBalance(userId, chainId) {
    const existingUser = userAddresses.find((user) => user.address === userId && user.chainId === chainId);
    if (!existingUser || Date.now() - existingUser.lastUpdate > 5000) {
        // Update userAddress data
        const balance = await fetchUserBalance(userId, chainId);
        await updateUserAddress(userId, chainId, balance);
    }
    return userAddresses.find((user) => user.address === userId && user.chainId === chainId);
}
// Function to clean elements of both userAddresses and bidAsks that are 30 seconds old
function cleanOldData() {
    const currentTime = Date.now();
    userAddresses = userAddresses.filter((user) => currentTime - user.lastUpdate <= 30000);
    bidAsks = bidAsks.filter((bidAsk) => currentTime - bidAsk.lastUpdate <= 30000);
}
async function answerRFQ(rfqReq) {
    // Verify that the RFQ is not older than 10 seconds
    if (Date.now() - rfqReq.createdAt > 10000) {
        throw new Error('RFQ is too old');
    }
    // Verify and update userAddress balance if needed
    await getBalance(rfqReq.userId, rfqReq.chainId);
    // Verify and update bidAsk prices if needed
    await getBidAsk(rfqReq.AssetAId);
    await getBidAsk(rfqReq.AssetBId);
    // Get the user balance
    const userAddress = userAddresses.find((user) => user.address === rfqReq.userId && user.chainId === rfqReq.chainId);
    if (!userAddress) {
        throw new Error('User address not found');
    }
    // Get the bid and ask prices
    const bidAskA = bidAsks.find((bidAsk) => bidAsk.assetId === rfqReq.AssetAId);
    const bidAskB = bidAsks.find((bidAsk) => bidAsk.assetId === rfqReq.AssetBId);
    if (!bidAskA || !bidAskB) {
        throw new Error('Bid/Ask prices not found');
    }
    const configParametersLong = await (0, config_1.getPairTradingConfig)(rfqReq.AssetAId, rfqReq.AssetBId, parseFloat(rfqReq.lQuantity), true, (parseFloat(rfqReq.lPrice) * parseFloat(rfqReq.lQuantity)) /
        (parseFloat(rfqReq.lImB || '0') + parseFloat(rfqReq.lDfB || '0')));
    const configParametersShort = await (0, config_1.getPairTradingConfig)(rfqReq.AssetAId, rfqReq.AssetBId, parseFloat(rfqReq.sQuantity), false, (parseFloat(rfqReq.sPrice) * parseFloat(rfqReq.sQuantity)) /
        (parseFloat(rfqReq.sImA || '0') + parseFloat(rfqReq.sDfA || '0')));
    // Verify that the user has enough balance
    if ((userAddress.balance || 0) <
        (configParametersLong.imB || 0) + (configParametersLong.dfB || 0)) {
        throw new Error('Insufficient user balance');
    }
    // Verify chainId is on our activeChainId
    if (rfqReq.chainId !== 80001) {
        throw new Error('Invalid chainId');
    }
    // Verify RFQ is not older than 5 seconds
    if (Date.now() - rfqReq.createdAt > 5000) {
        throw new Error('RFQ is too old');
    }
    // Verify RFQ is not expired
    if (Date.now() > rfqReq.expiration) {
        throw new Error('RFQ has expired');
    }
    // Verify short position parameters
    if (parseFloat(rfqReq.sInterestRate) !== (configParametersShort.funding || 0) ||
        rfqReq.sIsPayingApr !== configParametersShort.isAPayingApr ||
        parseFloat(rfqReq.sImA) < (configParametersShort.imA || 0) ||
        parseFloat(rfqReq.sImB) < (configParametersShort.imB || 0) ||
        parseFloat(rfqReq.sDfA) < (configParametersShort.dfA || 0) ||
        parseFloat(rfqReq.sDfB) < (configParametersShort.dfB || 0) ||
        rfqReq.sExpirationA < (configParametersShort.expiryA || 0) ||
        rfqReq.sExpirationB < (configParametersShort.expiryB || 0) ||
        rfqReq.sTimelockA < (configParametersShort.timeLockA || 0)) {
        throw new Error('Short position parameters do not match');
    }
    // Verify long position parameters
    if (parseFloat(rfqReq.lInterestRate) !== (configParametersLong.funding || 0) ||
        rfqReq.lIsPayingApr !== configParametersLong.isAPayingApr ||
        parseFloat(rfqReq.lImA) < (configParametersLong.imA || 0) ||
        parseFloat(rfqReq.lImB) < (configParametersLong.imB || 0) ||
        parseFloat(rfqReq.lDfA) < (configParametersLong.dfA || 0) ||
        parseFloat(rfqReq.lDfB) < (configParametersLong.dfB || 0) ||
        rfqReq.lExpirationA < (configParametersLong.expiryA || 0) ||
        rfqReq.lExpirationB < (configParametersLong.expiryB || 0) ||
        rfqReq.lTimelockA < (configParametersLong.timeLockA || 0)) {
        throw new Error('Long position parameters do not match');
    }
    const quoteRequest = {
        chainId: rfqReq.chainId,
        rfqId: rfqReq.id,
        expiration: 10000,
        sMarketPrice: (bidAskA.bid / bidAskB.ask).toString(),
        sPrice: (bidAskA.bid / bidAskB.ask).toString(),
        sQuantity: rfqReq.sQuantity,
        lMarketPrice: (bidAskA.ask / bidAskB.bid).toString(),
        lPrice: (bidAskA.ask / bidAskB.bid).toString(),
        lQuantity: rfqReq.lQuantity,
    };
    return quoteRequest;
}
// Helper functions (replace with actual implementations)
async function fetchBidAskData(assetId) {
    // Placeholder implementation
    return { bid: 100, ask: 101, qty: 1000, freeHedgerMargin: 1000 };
}
async function fetchUserBalance(userId, chainId) {
    // Placeholder implementation
    return 100000;
}
const processRFQ = async (job) => {
    try {
        const rfqData = job.data;
        console.log(`Processing RFQ: ${JSON.stringify(rfqData)}`);
        // Simulating RFQ processing
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log(`RFQ processed successfully: ${JSON.stringify(rfqData)}`);
    }
    catch (error) {
        console.error('Error processing RFQ:', error);
    }
};
exports.processRFQ = processRFQ;
