import { RfqResponse, QuoteRequest } from '@pionerfriends/api-client';
import { createClient, RedisClientType, SetOptions } from 'redis';
import { config } from '../config';
import { redisClient } from '../utils/init';
import { getFieldFromAsset, getPairConfig } from '../configBuilder/configRead';
import { rfqCheck } from '../types/rfqCheck';
import { logger } from '../utils/init';

const RFQ_CHECK_PREFIX = 'rfqCheck:';

const verifyCheckRFQ = (checkRFQ: rfqCheck): boolean => {
  const checkProperties = Object.entries(checkRFQ).filter(([key]) =>
    key.startsWith('check'),
  );
  logger.info(checkProperties, 'checkProperties');
  return checkProperties.every(([, value]) => value === true);
};

const rfqToQuote = async (rfq: RfqResponse): Promise<QuoteRequest> => {
  const checkRFQ = await getCheckRFQ(rfq);
  logger.info(checkRFQ, 'checkRFQ');
  const isRFQValid = verifyCheckRFQ(checkRFQ);
  if (isRFQValid) {
    logger.info('RFQ is valid');
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
  } else {
    throw new Error('RFQ is not valid');
  }
};

const getCheckRFQ = async (rfq: RfqResponse): Promise<rfqCheck> => {
  logger.info('getCheckRFQ');
  let checkRFQ: rfqCheck;
  const cacheKey = `${RFQ_CHECK_PREFIX}${rfq.id}`;
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  const cachedCheckRFQ = await redisClient.get(cacheKey);
  logger.info(cachedCheckRFQ, 'cachedCheckRFQ');
  if (cachedCheckRFQ) {
    checkRFQ = JSON.parse(cachedCheckRFQ) as rfqCheck;
    if (
      Date.now() - checkRFQ.rfqCheckUpdateTime < 60000 &&
      checkRFQ.chainId === rfq.chainId &&
      checkRFQ.AssetAId === rfq.assetAId &&
      checkRFQ.AssetBId === rfq.assetBId &&
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
      checkRFQ.lTimelockB === rfq.lTimelockB
    ) {
      logger.info('RFQ is cached');

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
    AssetAId: rfq.assetAId,
    checkAssetAId: false,
    AssetBId: rfq.assetBId,
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

  const configRfqL = getPairConfig(
    checkRFQ.AssetAId,
    checkRFQ.AssetBId,
    'long',
    (parseFloat(checkRFQ.lImA) + parseFloat(checkRFQ.lDfA)) /
    (parseFloat(checkRFQ.lPrice) * parseFloat(checkRFQ.lQuantity)),
    parseFloat(checkRFQ.lPrice) * parseFloat(checkRFQ.lQuantity),
  );
  logger.info(configRfqL, 'configRfqL');

  if ((configRfqL.imA ?? 0) <= parseFloat(checkRFQ.sImA)) {
    checkRFQ.checkSImA = true;
  }

  const setOptions: SetOptions = {
    EX: 60,
  };
  await redisClient.set(cacheKey, JSON.stringify(checkRFQ), setOptions);
  logger.info('RFQ is not cached');

  return checkRFQ;
};

const cacheManager = async (): Promise<void> => {
  const keys = await redisClient.keys(`${RFQ_CHECK_PREFIX}*`);
  for (const key of keys) {
    const checkRFQ = JSON.parse(
      (await redisClient.get(key)) as string,
    ) as rfqCheck;
    if (Date.now() - checkRFQ.rfqCheckUpdateTime > 30000) {
      await redisClient.del(key);
    }
  }
};

const flushCache = async (): Promise<void> => {
  const keys = await redisClient.keys(`${RFQ_CHECK_PREFIX}*`);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

export { rfqToQuote };
