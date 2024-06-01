import { RfqResponse, QuoteRequest } from '@pionerfriends/api-client';
import { createClient, RedisClientType, SetOptions } from 'redis';
import { config } from '../config';
import { redisClient } from '../utils/init';
import { rfqCheck } from '../types/rfqCheck';

import { checkRFQCore } from './checkRfq';
import { getTripartyLatestPrice } from '../broker/tripartyPrice';
import { minAmountSymbol } from '../broker/minAmount';

const verifyCheckRFQ = (checkRFQ: rfqCheck): boolean => {
  const checkProperties = Object.entries(checkRFQ).filter(([key]) =>
    key.startsWith('check'),
  );
  //console.info(checkProperties, 'checkProperties');
  return checkProperties.every(([, value]) => value === true);
};

const printFalseChecks = (checkRFQ: rfqCheck) => {
  Object.entries(checkRFQ).forEach(([key, value]) => {
    if (key.startsWith('check') && value === false) {
      console.info(key);
    }
  });
};

const rfqToQuote = async (rfq: RfqResponse): Promise<QuoteRequest> => {
  console.log(rfq);
  const checkRFQ = await getCheckRFQ(rfq);
  printFalseChecks(checkRFQ);

  const isRFQValid = await verifyCheckRFQ(checkRFQ);
  const tripartyLatestPrice = await getTripartyLatestPrice(
    `${checkRFQ.assetAId}/${checkRFQ.assetBId}`,
  );
  console.log(`${checkRFQ.assetAId}/${checkRFQ.assetBId}`, tripartyLatestPrice);

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
      sQuantity: String(amount),
      lMarketPrice: (Number(tripartyLatestPrice.ask) * 0.999).toString(),
      lPrice: rfq.lPrice,
      lQuantity: String(amount),
    };
  } else {
    throw new Error('RFQ is not valid');
  }
};

const getCheckRFQ = async (rfq: RfqResponse): Promise<rfqCheck> => {
  const checkRFQ = await checkRFQCore(rfq);

  return checkRFQ;
};
/*
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
};*/

export { rfqToQuote };
