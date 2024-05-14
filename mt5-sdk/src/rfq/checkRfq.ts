import { RfqResponse } from '@pionerfriends/api-client';
import { getPairConfig } from '../configBuilder/configRead';
import { rfqCheck } from '../types/rfqCheck';
import { getAllocatedBroker } from '../configBuilder/configRead';
import { get } from 'http';
import { getBrokerMaxNotional } from '../broker/brokerMaxNotional';
import {
  startTotalOpenAmountInfo,
  getTotalOpenAmount,
} from '../broker/totalOpenAmountModule';
import { getTripartyLatestPrice } from '../broker/tripartyPrice';

const checkRFQCore = async (rfq: RfqResponse): Promise<rfqCheck> => {
  const checkRFQ: rfqCheck = {
    rfqCheckUpdateTime: Date.now(),
    chainId: rfq.chainId,
    checkChainId: false,
    checkOnchainFreeCollateral: false,
    checkOnchainSelfLeverage: false,
    checkBrokerFreeCollateral: false,
    checkBrokerSelfLeverage: false,
    checkCounterpartySelfLeverage: false,
    expiration: parseFloat(rfq.expiration),
    assetAId: rfq.assetAId,
    checkAssetAId: false,
    assetBId: rfq.assetBId,
    checkAssetBId: false,
    checkMarketIsOpen: false,
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
    sExpirationA: parseFloat(rfq.sExpirationA),
    checkSExpirationA: false,
    sExpirationB: parseFloat(rfq.sExpirationB),
    checkSExpirationB: false,
    sTimelockA: parseFloat(rfq.sTimelockA),
    checkSTimelockA: false,
    sTimelockB: parseFloat(rfq.sTimelockB),
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
    lExpirationA: parseFloat(rfq.lExpirationA),
    checkLExpirationA: false,
    lExpirationB: parseFloat(rfq.lExpirationB),
    checkLExpirationB: false,
    lTimelockA: parseFloat(rfq.lTimelockA),
    checkLTimelockA: false,
    lTimelockB: parseFloat(rfq.lTimelockB),
    checkLTimelockB: false,
  };

  const configRfqL = await getPairConfig(
    checkRFQ.assetAId,
    checkRFQ.assetBId,
    'long',
    (parseFloat(checkRFQ.lImA) + parseFloat(checkRFQ.lDfA)) /
      (parseFloat(checkRFQ.lPrice) * parseFloat(checkRFQ.lQuantity)),
    parseFloat(checkRFQ.lPrice) * parseFloat(checkRFQ.lQuantity),
  );

  const configRfqS = await getPairConfig(
    checkRFQ.assetAId,
    checkRFQ.assetBId,
    'long',
    (parseFloat(checkRFQ.sImA) + parseFloat(checkRFQ.sDfA)) /
      (parseFloat(checkRFQ.sPrice) * parseFloat(checkRFQ.sQuantity)),
    parseFloat(checkRFQ.sPrice) * parseFloat(checkRFQ.sQuantity),
  );

  const brokerL = getAllocatedBroker(checkRFQ.assetAId);
  const brokerS = getAllocatedBroker(checkRFQ.assetBId);

  let maxNotionalL = 0,
    maxNotionalS = 0,
    openAmountL = 100_000_000_000,
    openAmountS = 100_000_000_000;
  /*
  if (brokerL != brokerS) {
    brokerHealth(brokerL, 1000, 32000);
    maxNotionalL = (await getLatestMaxNotional('mt5.ICMarkets')) 
    brokerHealth(brokerS, 1000, 32000);
    maxNotionalS = (await getLatestMaxNotional('mt5.ICMarkets')) 
    startTotalOpenAmountInfo(checkRFQ.assetAId, brokerL, 1000, 32000);
    openAmountL =
      (await getTotalOpenAmount(checkRFQ.assetAId, brokerL)) ;
    startTotalOpenAmountInfo(checkRFQ.assetAId, brokerS, 1000, 32000);
    openAmountS =
      (await getTotalOpenAmount(checkRFQ.assetAId, brokerS)) || ;
  } else {
    brokerHealth(brokerL, 1000, 32000);
    maxNotionalL = (await getLatestMaxNotional('mt5.ICMarkets')) 
    maxNotionalS = maxNotionalL;
    startTotalOpenAmountInfo(checkRFQ.assetAId, brokerS, 1000, 32000);
    openAmountL =
      (await getTotalOpenAmount(checkRFQ.assetAId, brokerS)) ;
    openAmountS = openAmountL;
  }
  */

  if ((configRfqL.imA ?? 0) <= parseFloat(checkRFQ.lImA)) {
    checkRFQ.checkLImA = true;
  }
  if ((configRfqS.imA ?? 0) <= parseFloat(checkRFQ.sImA)) {
    checkRFQ.checkSImA = true;
  }

  if ((configRfqL.imB ?? 0) <= parseFloat(checkRFQ.lImB)) {
    checkRFQ.checkLImB = true;
  }
  if ((configRfqS.imB ?? 0) <= parseFloat(checkRFQ.sImB)) {
    checkRFQ.checkSImB = true;
  }

  if ((configRfqL.dfA ?? 0) <= parseFloat(checkRFQ.lDfA)) {
    checkRFQ.checkLDfA = true;
  }
  if ((configRfqS.dfA ?? 0) <= parseFloat(checkRFQ.sDfA)) {
    checkRFQ.checkSDfA = true;
  }

  if ((configRfqL.dfB ?? 0) <= parseFloat(checkRFQ.lDfB)) {
    checkRFQ.checkLDfB = true;
  }
  if ((configRfqS.dfB ?? 0) <= parseFloat(checkRFQ.sDfB)) {
    checkRFQ.checkSDfB = true;
  }

  if ((configRfqL.expiryA ?? 0) <= checkRFQ.lExpirationA) {
    checkRFQ.checkLExpirationA = true;
  }
  if ((configRfqS.expiryA ?? 0) <= checkRFQ.sExpirationA) {
    checkRFQ.checkSExpirationA = true;
  }

  if ((configRfqL.expiryB ?? 0) <= checkRFQ.lExpirationB) {
    checkRFQ.checkLExpirationB = true;
  }
  if ((configRfqS.expiryB ?? 0) <= checkRFQ.sExpirationB) {
    checkRFQ.checkSExpirationB = true;
  }

  if ((configRfqL.timeLockA ?? 0) <= checkRFQ.lTimelockA) {
    checkRFQ.checkLTimelockA = true;
  }
  if ((configRfqS.timeLockA ?? 0) <= checkRFQ.sTimelockA) {
    checkRFQ.checkSTimelockA = true;
  }

  if ((configRfqL.timeLockB ?? 0) <= checkRFQ.lTimelockB) {
    checkRFQ.checkLTimelockB = true;
  }
  if ((configRfqS.timeLockB ?? 0) <= checkRFQ.sTimelockB) {
    checkRFQ.checkSTimelockB = true;
  }

  if (
    ((configRfqS.funding ?? 0) <= Number(checkRFQ.sInterestRate) &&
      (configRfqS.isAPayingApr == checkRFQ.sIsPayingApr ||
        (configRfqS.isAPayingApr == true && checkRFQ.sIsPayingApr == false))) ||
    (Number(configRfqS.funding) <= 0 &&
      Math.abs(Number(configRfqS.funding ?? 0)) <=
        Math.abs(Number(checkRFQ.sInterestRate)))
  ) {
    checkRFQ.checkSInterestRate = true;
  }

  if (
    ((configRfqL.funding ?? 0) <= Number(checkRFQ.lInterestRate) &&
      (configRfqL.isAPayingApr == checkRFQ.lIsPayingApr ||
        (configRfqL.isAPayingApr == true && checkRFQ.lIsPayingApr == false))) ||
    (Number(configRfqL.funding) <= 0 &&
      Math.abs(Number(configRfqL.funding ?? 0)) <=
        Math.abs(Number(checkRFQ.lInterestRate)))
  ) {
    checkRFQ.checkLInterestRate = true;
  }

  if (
    Number(maxNotionalL) <=
      Number(checkRFQ.checkSPrice) * Number(checkRFQ.sQuantity) &&
    Number(maxNotionalS) <=
      Number(checkRFQ.checkLPrice) * Number(checkRFQ.lQuantity)
  ) {
    checkRFQ.checkBrokerFreeCollateral = true;
  }

  if (
    Number(configRfqS.minAmount) <= Number(checkRFQ.sQuantity) &&
    Number(configRfqS.minAmount) <= Number(checkRFQ.lQuantity) &&
    Number(configRfqS.maxAmount) <= Number(checkRFQ.sQuantity) &&
    Number(configRfqS.maxAmount) <= Number(checkRFQ.lQuantity) &&
    Number(configRfqS.maxNotional) <=
      Number(checkRFQ.checkSPrice) * Number(checkRFQ.sQuantity) &&
    Number(configRfqS.maxNotional) <=
      Number(checkRFQ.checkLPrice) * Number(checkRFQ.lQuantity) &&
    Number(configRfqS.maxLeverageShortGlobalNotional) <= openAmountS &&
    Number(configRfqS.maxLeverageLongGlobalNotional) <= openAmountL &&
    Number(configRfqS.maxLeverageDeltaGlobalNotional) <=
      Math.abs(openAmountS - openAmountL)
  ) {
    checkRFQ.checkBrokerFreeCollateral = true;
    checkRFQ.checkSQuantity = true;
    checkRFQ.checkLQuantity = true;
  }

  checkRFQ.checkOnchainFreeCollateral = true;
  checkRFQ.checkOnchainSelfLeverage = true;
  checkRFQ.checkCounterpartySelfLeverage = true;

  checkRFQ.checkMarketIsOpen = true;

  const tripartyLatestPrice = await getTripartyLatestPrice(
    `${checkRFQ.assetAId}/${checkRFQ.assetAId}`,
  );
  if (
    tripartyLatestPrice != null &&
    tripartyLatestPrice.bid > 0 &&
    tripartyLatestPrice.ask > 0
  ) {
    checkRFQ.checkAssetAId = true;
    checkRFQ.checkAssetBId = true;
  }

  checkRFQ.checkSPrice = true;
  checkRFQ.checkLPrice = true;

  checkRFQ.checkBrokerSelfLeverage = true;

  return checkRFQ;
};

export { checkRFQCore };
