"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const configRead_1 = require("../configBuilder/configRead");
const brokerMaxNotional_1 = require("../broker/brokerMaxNotional");
const tripartyPrice_1 = require("../broker/tripartyPrice");
class RfqChecker {
    constructor(rfq) {
        this.errors = [];
        this.configRfqL = null;
        this.configRfqS = null;
        this.brokerL = null;
        this.brokerS = null;
        this.maxNotionalL = 10000;
        this.maxNotionalS = 10000;
        this.openAmountL = 100000000000;
        this.openAmountS = 100000000000;
        this.rfq = rfq;
    }
    async init() {
        this.configRfqL = await this.getConfig('long', this.rfq.lImA, this.rfq.lDfA, this.rfq.lPrice, this.rfq.lQuantity);
        this.configRfqS = await this.getConfig('short', this.rfq.sImA, this.rfq.sDfA, this.rfq.sPrice, this.rfq.sQuantity);
        this.brokerL = (0, configRead_1.getAllocatedBroker)(this.rfq.assetAId) ?? null;
        this.brokerS = (0, configRead_1.getAllocatedBroker)(this.rfq.assetBId) ?? null;
        await this.fetchBrokerData();
    }
    async getConfig(direction, im, df, price, quantity) {
        return (0, configRead_1.getPairConfig)(this.rfq.assetAId, this.rfq.assetBId, direction, 1 / (parseFloat(im) + parseFloat(df)), parseFloat(price) * parseFloat(quantity));
    }
    async fetchBrokerData() {
        if (this.brokerL && this.brokerS) {
            this.maxNotionalL = await (0, brokerMaxNotional_1.getBrokerMaxNotional)(this.brokerL);
            this.maxNotionalS = await (0, brokerMaxNotional_1.getBrokerMaxNotional)(this.brokerS);
            if (this.maxNotionalL > 0) {
                this.errors.push({ field: 'brokerL', value: this.brokerL });
            }
            if (this.maxNotionalS > 0) {
                this.errors.push({ field: 'brokerS', value: this.brokerS });
            }
        }
    }
    async check() {
        await this.init();
        this.checkImA();
        this.checkImB();
        this.checkDfA();
        this.checkDfB();
        this.checkExpirationA();
        this.checkExpirationB();
        this.checkTimelockA();
        this.checkTimelockB();
        this.checkInterestRate();
        this.checkBrokerFreeCollateral();
        this.checkQuantities();
        this.checkOnchainFreeCollateral();
        this.checkOnchainSelfLeverage();
        this.checkCounterpartySelfLeverage();
        this.checkMarketIsOpen();
        this.checkAssets();
        this.checkPrices();
        this.checkBrokerSelfLeverage();
        this.checkChainId();
        return this.errors;
    }
    checkImA() {
        if ((this.configRfqL.imA ?? 0) > parseFloat(this.rfq.lImA)) {
            this.errors.push({ field: 'lImA', value: this.rfq.lImA });
        }
        if ((this.configRfqS.imA ?? 0) > parseFloat(this.rfq.sImA)) {
            this.errors.push({ field: 'sImA', value: this.rfq.sImA });
        }
    }
    checkImB() {
        if ((this.configRfqL.imB ?? 0) > parseFloat(this.rfq.lImB)) {
            this.errors.push({ field: 'lImB', value: this.rfq.lImB });
        }
        if ((this.configRfqS.imB ?? 0) > parseFloat(this.rfq.sImB)) {
            this.errors.push({ field: 'sImB', value: this.rfq.sImB });
        }
    }
    checkDfA() {
        if ((this.configRfqL.dfA ?? 0) > parseFloat(this.rfq.lDfA)) {
            this.errors.push({ field: 'lDfA', value: this.rfq.lDfA });
        }
        if ((this.configRfqS.dfA ?? 0) > parseFloat(this.rfq.sDfA)) {
            this.errors.push({ field: 'sDfA', value: this.rfq.sDfA });
        }
    }
    checkDfB() {
        if ((this.configRfqL.dfB ?? 0) > parseFloat(this.rfq.lDfB)) {
            this.errors.push({ field: 'lDfB', value: this.rfq.lDfB });
        }
        if ((this.configRfqS.dfB ?? 0) > parseFloat(this.rfq.sDfB)) {
            this.errors.push({ field: 'sDfB', value: this.rfq.sDfB });
        }
    }
    checkExpirationA() {
        if ((this.configRfqL.expiryA ?? 0) > this.rfq.lExpirationA) {
            this.errors.push({ field: 'lExpirationA', value: this.rfq.lExpirationA });
        }
        if ((this.configRfqS.expiryA ?? 0) > this.rfq.sExpirationA) {
            this.errors.push({ field: 'sExpirationA', value: this.rfq.sExpirationA });
        }
    }
    checkExpirationB() {
        if ((this.configRfqL.expiryB ?? 0) > this.rfq.lExpirationB) {
            this.errors.push({ field: 'lExpirationB', value: this.rfq.lExpirationB });
        }
        if ((this.configRfqS.expiryB ?? 0) > this.rfq.sExpirationB) {
            this.errors.push({ field: 'sExpirationB', value: this.rfq.sExpirationB });
        }
    }
    checkTimelockA() {
        if ((this.configRfqL.timeLockA ?? 0) > this.rfq.lTimelockA) {
            this.errors.push({ field: 'lTimelockA', value: this.rfq.lTimelockA });
        }
        if ((this.configRfqS.timeLockA ?? 0) > this.rfq.sTimelockA) {
            this.errors.push({ field: 'sTimelockA', value: this.rfq.sTimelockA });
        }
    }
    checkTimelockB() {
        if ((this.configRfqL.timeLockB ?? 0) > this.rfq.lTimelockB) {
            this.errors.push({ field: 'lTimelockB', value: this.rfq.lTimelockB });
        }
        if ((this.configRfqS.timeLockB ?? 0) > this.rfq.sTimelockB) {
            this.errors.push({ field: 'sTimelockB', value: this.rfq.sTimelockB });
        }
    }
    checkInterestRate() {
        if (!this.isValidInterestRate(this.configRfqS, this.rfq.sInterestRate, this.rfq.sIsPayingApr)) {
            this.errors.push({
                field: 'sInterestRate',
                value: this.rfq.sInterestRate,
            });
        }
        if (!this.isValidInterestRate(this.configRfqL, this.rfq.lInterestRate, this.rfq.lIsPayingApr)) {
            this.errors.push({
                field: 'lInterestRate',
                value: this.rfq.lInterestRate,
            });
        }
    }
    isValidInterestRate(config, rate, isPayingApr) {
        return (((config.funding ?? 0) <= Number(rate) &&
            (config.isAPayingApr == isPayingApr ||
                (config.isAPayingApr == true && isPayingApr == false))) ||
            (Number(config.funding) <= 0 &&
                Math.abs(Number(config.funding ?? 0)) <= Math.abs(Number(rate))));
    }
    checkBrokerFreeCollateral() {
        if (Number(this.maxNotionalL) <=
            Number(this.rfq.lPrice) * Number(this.rfq.lQuantity)) {
            this.errors.push({ field: 'brokerFreeCollateral', value: this.rfq });
        }
        if (Number(this.maxNotionalS) <=
            Number(this.rfq.sPrice) * Number(this.rfq.sQuantity)) {
            this.errors.push({ field: 'brokerFreeCollateral', value: this.rfq });
        }
    }
    checkQuantities() {
        if (!this.rfq.sQuantity || !this.rfq.lQuantity) {
            this.errors.push({ field: 'quantities', value: this.rfq });
        }
    }
    checkOnchainFreeCollateral() {
        // Implement logic to check on-chain free collateral
    }
    checkOnchainSelfLeverage() {
        // Implement logic to check on-chain self-leverage
    }
    checkCounterpartySelfLeverage() {
        // Implement logic to check counterparty self-leverage
    }
    checkMarketIsOpen() {
        // Implement logic to check if the market is open
    }
    async checkAssets() {
        const tripartyLatestPrice = await (0, tripartyPrice_1.getTripartyLatestPrice)(`${this.rfq.assetAId}/${this.rfq.assetAId}`);
        if (tripartyLatestPrice != null &&
            tripartyLatestPrice.bid > 0 &&
            tripartyLatestPrice.ask > 0) {
            this.errors.push({ field: 'assets', value: this.rfq });
        }
    }
    checkPrices() {
        if (this.rfq.sPrice && this.rfq.lPrice) {
            this.errors.push({ field: 'prices', value: this.rfq });
        }
    }
    checkBrokerSelfLeverage() {
        // Implement logic to check broker self-leverage
    }
    checkChainId() {
        if (this.rfq.chainId !== 64165) {
            this.errors.push({ field: 'chainId', value: this.rfq.chainId });
        }
    }
}
exports.default = RfqChecker;
