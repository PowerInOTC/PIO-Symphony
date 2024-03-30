"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRFQCore = void 0;
const configRead_1 = require("../configBuilder/configRead");
const configRead_2 = require("../configBuilder/configRead");
const checkRFQCore = async (rfq) => {
    const checkRFQ = {
        rfqCheckUpdateTime: Date.now(),
        chainId: rfq.chainId,
        checkChainId: false,
        checkOnchainFreeCollateral: false,
        checkOnchainSelfLeverage: false,
        checkBrokerFreeCollateral: false,
        checkBrokerSelfLeverage: false,
        checkCounterpartySelfLeverage: false,
        expiration: rfq.expiration,
        assetAId: rfq.assetAId,
        checkAssetAId: false,
        assetBId: rfq.assetBId,
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
    const configRfqL = await (0, configRead_1.getPairConfig)(checkRFQ.assetAId, checkRFQ.assetBId, 'long', (parseFloat(checkRFQ.lImA) + parseFloat(checkRFQ.lDfA)) /
        (parseFloat(checkRFQ.lPrice) * parseFloat(checkRFQ.lQuantity)), parseFloat(checkRFQ.lPrice) * parseFloat(checkRFQ.lQuantity));
    const configRfqS = await (0, configRead_1.getPairConfig)(checkRFQ.assetAId, checkRFQ.assetBId, 'long', (parseFloat(checkRFQ.sImA) + parseFloat(checkRFQ.sDfA)) /
        (parseFloat(checkRFQ.sPrice) * parseFloat(checkRFQ.sQuantity)), parseFloat(checkRFQ.sPrice) * parseFloat(checkRFQ.sQuantity));
    const brokerA = (0, configRead_2.getAllocatedBroker)(checkRFQ.assetAId);
    const brokerB = (0, configRead_2.getAllocatedBroker)(checkRFQ.assetBId);
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
    checkRFQ.checkAssetAId = true;
    checkRFQ.checkAssetBId = true;
    /*
    if (configRfqL.assetBId === checkRFQ.assetBId) {
    }
  
    if (configRfqL.price === parseFloat(checkRFQ.lPrice)) {
      checkRFQ.checkLPrice = true;
    }
    if (configRfqS.price === parseFloat(checkRFQ.sPrice)) {
      checkRFQ.checkSPrice = true;
    }
  
    if (configRfqL.quantity === parseFloat(checkRFQ.lQuantity)) {
      checkRFQ.checkLQuantity = true;
    }
    if (configRfqS.quantity === parseFloat(checkRFQ.sQuantity)) {
      checkRFQ.checkSQuantity = true;
    }
  
    if (configRfqL.ir <= parseFloat(checkRFQ.lInterestRate)) {
      checkRFQ.checkLInterestRate = true;
    }
    if (configRfqS.ir <= parseFloat(checkRFQ.sInterestRate)) {
      checkRFQ.checkSInterestRate = true;
    }*/
    checkRFQ.checkOnchainFreeCollateral = true;
    checkRFQ.checkOnchainSelfLeverage = true;
    checkRFQ.checkBrokerFreeCollateral = true;
    checkRFQ.checkBrokerSelfLeverage = true;
    checkRFQ.checkCounterpartySelfLeverage = true;
    checkRFQ.checkAssetAId = true;
    checkRFQ.checkAssetBId = true;
    checkRFQ.checkSPrice = true;
    checkRFQ.checkLPrice = true;
    checkRFQ.checkSQuantity = true;
    checkRFQ.checkLQuantity = true;
    checkRFQ.checkSInterestRate = true;
    checkRFQ.checkLInterestRate = true;
    return checkRFQ;
};
exports.checkRFQCore = checkRFQCore;
