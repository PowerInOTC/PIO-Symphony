"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rfqToQuote = void 0;
const init_1 = require("../utils/init");
const init_2 = require("../utils/init");
const checkRfq_1 = require("./checkRfq");
const RFQ_CHECK_PREFIX = 'rfqCheck:';
const verifyCheckRFQ = (checkRFQ) => {
    const checkProperties = Object.entries(checkRFQ).filter(([key]) => key.startsWith('check'));
    init_2.logger.info(checkProperties, 'checkProperties');
    return checkProperties.every(([, value]) => value === true);
};
const rfqToQuote = async (rfq) => {
    const checkRFQ = await getCheckRFQ(rfq);
    init_2.logger.info(checkRFQ, 'checkRFQ');
    const isRFQValid = verifyCheckRFQ(checkRFQ);
    if (isRFQValid) {
        return {
            chainId: rfq.chainId,
            rfqId: rfq.id,
            expiration: rfq.expiration,
            sMarketPrice: (Number(rfq.sPrice) * 1.001).toString(),
            sPrice: rfq.sPrice,
            sQuantity: rfq.sQuantity,
            lMarketPrice: (Number(rfq.lPrice) * 0.999).toString(),
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
    if (!init_1.redisClient.isOpen) {
        await init_1.redisClient.connect();
    }
    const cachedCheckRFQ = await init_1.redisClient.get(cacheKey);
    if (cachedCheckRFQ) {
        checkRFQ = JSON.parse(cachedCheckRFQ);
        if (Date.now() - checkRFQ.rfqCheckUpdateTime < 60000 &&
            checkRFQ.chainId === rfq.chainId &&
            checkRFQ.assetAId === rfq.assetAId &&
            checkRFQ.assetBId === rfq.assetBId &&
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
            init_2.logger.info('RFQ is cached');
            return checkRFQ;
        }
    }
    checkRFQ = await (0, checkRfq_1.checkRFQCore)(rfq);
    cacheManager();
    const setOptions = {
        EX: 60,
    };
    await init_1.redisClient.set(cacheKey, JSON.stringify(checkRFQ), setOptions);
    init_2.logger.info('RFQ is not cached');
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
