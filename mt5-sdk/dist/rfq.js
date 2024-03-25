"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rfqToQuote = void 0;
const init_1 = require("./init");
const configRead_1 = require("./configBuilder/configRead");
const RFQ_CHECK_PREFIX = 'rfqCheck:';
const verifyCheckRFQ = (checkRFQ) => {
    const checkProperties = Object.entries(checkRFQ).filter(([key]) => key.startsWith('check'));
    return checkProperties.every(([, value]) => value === true);
};
const rfqToQuote = async (rfq) => {
    const checkRFQ = await getCheckRFQ(rfq);
    const isRFQValid = verifyCheckRFQ(checkRFQ);
    if (isRFQValid) {
        return {
            chainId: rfq.chainId,
            rfqId: rfq.id,
            expiration: rfq.expiration,
            sMarketPrice: '1',
            sPrice: rfq.sPrice,
            sQuantity: rfq.sQuantity,
            lMarketPrice: '1',
            lPrice: rfq.lPrice,
            lQuantity: rfq.lQuantity,
        };
    }
    else {
        throw new Error('RFQ is not valid');
    }
};
exports.rfqToQuote = rfqToQuote;
const getCheckRFQ = async (rfq) => {
    let checkRFQ;
    const cacheKey = `${RFQ_CHECK_PREFIX}${rfq.id}`;
    const cachedCheckRFQ = await init_1.redisClient.get(cacheKey);
    if (cachedCheckRFQ) {
        checkRFQ = JSON.parse(cachedCheckRFQ);
        if (Date.now() - checkRFQ.rfqCheckUpdateTime < 60000 &&
            checkRFQ.chainId === rfq.chainId &&
            checkRFQ.AssetAId === rfq.AssetAId &&
            checkRFQ.AssetBId === rfq.AssetBId &&
            checkRFQ.sPrice === rfq.sPrice &&
            checkRFQ.sQuantity === rfq.sQuantity &&
            checkRFQ.sInterestRate === rfq.sInterestRate &&
            checkRFQ.sIsPayingApr === rfq.sIsPayingApr &&
            checkRFQ.sImA === rfq.sImA &&
            checkRFQ.sImB === rfq.sImB &&
            checkRFQ.sDfA === rfq.sDfA &&
            checkRFQ.sDfB === rfq.sDfB &&
            checkRFQ.sExpirationA === rfq.sExpirationA &&
            checkRFQ.sExpirationB === rfq.sExpirationB &&
            checkRFQ.sTimelockA === rfq.sTimelockA &&
            checkRFQ.sTimelockB === rfq.sTimelockB &&
            checkRFQ.lPrice === rfq.lPrice &&
            checkRFQ.lQuantity === rfq.lQuantity &&
            checkRFQ.lInterestRate === rfq.lInterestRate &&
            checkRFQ.lIsPayingApr === rfq.lIsPayingApr &&
            checkRFQ.lImA === rfq.lImA &&
            checkRFQ.lImB === rfq.lImB &&
            checkRFQ.lDfA === rfq.lDfA &&
            checkRFQ.lDfB === rfq.lDfB &&
            checkRFQ.lExpirationA === rfq.lExpirationA &&
            checkRFQ.lExpirationB === rfq.lExpirationB &&
            checkRFQ.lTimelockA === rfq.lTimelockA &&
            checkRFQ.lTimelockB === rfq.lTimelockB) {
            return checkRFQ;
        }
    }
    checkRFQ = {
        rfqCheckUpdateTime: Date.now(),
        chainId: rfq.chainId,
        checkChainId: false,
        checkOnchainFreeCollateral: false,
        checkOnchainSelfLeverage: false,
        checkBrokerFreeCollateral: false,
        checkBrokerSelfLeverage: false,
        checkCounterpartySelfLeverage: false,
        expiration: rfq.expiration,
        AssetAId: rfq.AssetAId,
        checkAssetAId: false,
        AssetBId: rfq.AssetBId,
        checkAssetBId: false,
        sPrice: rfq.sPrice,
        checkSPrice: false,
        sQuantity: rfq.sQuantity,
        checkSQuantity: false,
        sInterestRate: rfq.sInterestRate,
        checkSInterestRate: false,
        sIsPayingApr: rfq.sIsPayingApr,
        sImA: rfq.sImA,
        checkSImA: false,
        sImB: rfq.sImB,
        checkSImB: false,
        sDfA: rfq.sDfA,
        checkSDfA: false,
        sDfB: rfq.sDfB,
        checkSDfB: false,
        sExpirationA: rfq.sExpirationA,
        checkSExpirationA: false,
        sExpirationB: rfq.sExpirationB,
        checkSExpirationB: false,
        sTimelockA: rfq.sTimelockA,
        checkSTimelockA: false,
        sTimelockB: rfq.sTimelockB,
        checkSTimelockB: false,
        lPrice: rfq.lPrice,
        checkLPrice: false,
        lQuantity: rfq.lQuantity,
        checkLQuantity: false,
        lInterestRate: rfq.lInterestRate,
        checkLInterestRate: false,
        lIsPayingApr: rfq.lIsPayingApr,
        lImA: rfq.lImA,
        checkLImA: false,
        lImB: rfq.lImB,
        checkLImB: false,
        lDfA: rfq.lDfA,
        checkLDfA: false,
        lDfB: rfq.lDfB,
        checkLDfB: false,
        lExpirationA: rfq.lExpirationA,
        checkLExpirationA: false,
        lExpirationB: rfq.lExpirationB,
        checkLExpirationB: false,
        lTimelockA: rfq.lTimelockA,
        checkLTimelockA: false,
        lTimelockB: rfq.lTimelockB,
        checkLTimelockB: false,
    };
    cacheManager();
    const configRfqL = (0, configRead_1.getPairConfig)(checkRFQ.AssetAId, checkRFQ.AssetBId, 'long', (parseFloat(checkRFQ.lImA) + parseFloat(checkRFQ.lDfA)) /
        (parseFloat(checkRFQ.lPrice) * parseFloat(checkRFQ.lQuantity)), parseFloat(checkRFQ.lPrice) * parseFloat(checkRFQ.lQuantity));
    if ((configRfqL.imA ?? 0) <= parseFloat(checkRFQ.sImA)) {
        checkRFQ.checkSImA = true;
    }
    const setOptions = {
        EX: 60,
    };
    await init_1.redisClient.set(cacheKey, JSON.stringify(checkRFQ), setOptions);
    return checkRFQ;
};
const cacheManager = async () => {
    const keys = await init_1.redisClient.keys(`${RFQ_CHECK_PREFIX}*`);
    for (const key of keys) {
        const checkRFQ = JSON.parse((await init_1.redisClient.get(key)));
        if (Date.now() - checkRFQ.rfqCheckUpdateTime > 30000) {
            await init_1.redisClient.del(key);
        }
    }
};
const flushCache = async () => {
    const keys = await init_1.redisClient.keys(`${RFQ_CHECK_PREFIX}*`);
    if (keys.length > 0) {
        await init_1.redisClient.del(keys);
    }
};
