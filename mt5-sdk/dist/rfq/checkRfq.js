"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRFQCore = void 0;
const configRead_1 = require("../configBuilder/configRead");
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
    if ((configRfqL.imA ?? 0) <= parseFloat(checkRFQ.sImA)) {
        checkRFQ.checkChainId = true;
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
        checkRFQ.checkSImA = true;
        checkRFQ.checkSImB = true;
        checkRFQ.checkLImA = true;
        checkRFQ.checkLImB = true;
        checkRFQ.checkSDfA = true;
        checkRFQ.checkSDfB = true;
        checkRFQ.checkLDfB = true;
        checkRFQ.checkLDfA = true;
        checkRFQ.checkSExpirationA = true;
        checkRFQ.checkSExpirationB = true;
        checkRFQ.checkLExpirationA = true;
        checkRFQ.checkLExpirationB = true;
        checkRFQ.checkSTimelockA = true;
        checkRFQ.checkSTimelockB = true;
        checkRFQ.checkLTimelockA = true;
        checkRFQ.checkLTimelockB = true;
    }
    return checkRFQ;
};
exports.checkRFQCore = checkRFQCore;
