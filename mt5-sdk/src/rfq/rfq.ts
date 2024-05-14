import { RfqResponse, QuoteRequest } from '@pionerfriends/api-client';
import { createClient, RedisClientType, SetOptions } from 'redis';
import { config } from '../config';
import { redisClient } from '../utils/init';
import { rfqCheck } from '../types/rfqCheck';
import { logger } from '../utils/init';
import { checkRFQCore } from './checkRfq';
import { getTripartyLatestPrice } from '../broker/tripartyPrice';
import { minAmountSymbol } from '../broker/minAmount';

const RFQ_CHECK_PREFIX = 'rfqCheck:';

const verifyCheckRFQ = (checkRFQ: rfqCheck): boolean => {
  const checkProperties = Object.entries(checkRFQ).filter(([key]) =>
    key.startsWith('check'),
  );
  //logger.info(checkProperties, 'checkProperties');
  return checkProperties.every(([, value]) => value === true);
};

const printFalseChecks = (checkRFQ: rfqCheck) => {
  Object.entries(checkRFQ).forEach(([key, value]) => {
    if (key.startsWith('check') && value === false) {
      logger.info(key);
    }
  });
};

const rfqToQuote = async (rfq: RfqResponse): Promise<QuoteRequest> => {
  const checkRFQ = await getCheckRFQ(rfq);
  printFalseChecks(checkRFQ);

  const isRFQValid = await verifyCheckRFQ(checkRFQ);
  const tripartyLatestPrice = await getTripartyLatestPrice(
    `${checkRFQ.assetAId}/${checkRFQ.assetAId}`,
  );
  const minAmount = await minAmountSymbol(
    `${checkRFQ.assetAId}/${checkRFQ.assetBId}`,
  );
  let amount = Number(rfq.sQuantity);
  if (minAmount > Number(rfq.sQuantity)) {
    amount = minAmount;
  }

  if (isRFQValid) {
    return {
      chainId: rfq.chainId,
      rfqId: rfq.id,
      expiration: rfq.expiration,
      sMarketPrice: (Number(tripartyLatestPrice.bid) * 1.001).toString(),
      sPrice: rfq.sPrice,
      sQuantity: amount,
      lMarketPrice: (Number(tripartyLatestPrice.ask) * 0.999).toString(),
      lPrice: rfq.lPrice,
      lQuantity: amount,
    };
  } else {
    throw new Error('RFQ is not valid');
  }
};

const getCheckRFQ = async (rfq: RfqResponse): Promise<rfqCheck> => {
  let checkRFQ: rfqCheck;
  const cacheKey = `${RFQ_CHECK_PREFIX}${rfq.id}`;
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  const cachedCheckRFQ = await redisClient.get(cacheKey);
  if (cachedCheckRFQ) {
    checkRFQ = JSON.parse(cachedCheckRFQ) as rfqCheck;
    if (
      Date.now() - checkRFQ.rfqCheckUpdateTime < 60000 &&
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
      checkRFQ.sExpirationA === parseFloat(rfq.sExpirationA) &&
      checkRFQ.sExpirationB === parseFloat(rfq.sExpirationB) &&
      checkRFQ.sTimelockA === parseFloat(rfq.sTimelockA) &&
      checkRFQ.sTimelockB === parseFloat(rfq.sTimelockB) &&
      checkRFQ.lPrice === rfq.lPrice &&
      checkRFQ.lQuantity === rfq.lQuantity &&
      checkRFQ.lInterestRate === rfq.lInterestRate &&
      checkRFQ.lIsPayingApr === rfq.lIsPayingApr &&
      checkRFQ.lImA === rfq.lImA &&
      checkRFQ.lImB === rfq.lImB &&
      checkRFQ.lDfA === rfq.lDfA &&
      checkRFQ.lDfB === rfq.lDfB &&
      checkRFQ.lExpirationA === parseFloat(rfq.lExpirationA) &&
      checkRFQ.lExpirationB === parseFloat(rfq.lExpirationB) &&
      checkRFQ.lTimelockA === parseFloat(rfq.lTimelockA) &&
      checkRFQ.lTimelockB === parseFloat(rfq.lTimelockB)
    ) {
      return checkRFQ;
    }
  }

  checkRFQ = await checkRFQCore(rfq);
  cacheManager();

  const setOptions: SetOptions = {
    EX: 60,
  };

  await redisClient.set(cacheKey, JSON.stringify(checkRFQ), setOptions);

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
