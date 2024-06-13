import { RfqResponse } from '@pionerfriends/api-client';
import { getPairConfig, getAllocatedBroker } from '../configBuilder/configRead';
import { getBrokerMaxNotional } from '../broker/brokerMaxNotional';
import {
  startTotalOpenAmountInfo,
  getTotalOpenAmount,
} from '../broker/totalOpenAmountModule';
import { getTripartyLatestPrice } from '../broker/tripartyPrice';

export interface ErrorObject {
  field: string;
  value: any;
}

class RfqChecker {
  private rfq: RfqResponse;
  private errors: ErrorObject[] = [];
  private configRfqL: any = null;
  private configRfqS: any = null;
  private brokerL: string | null = null;
  private brokerS: string | null = null;
  private maxNotionalL: number = 10_000;
  private maxNotionalS: number = 10_000;
  private tripartyBid: number = 0;
  private tripartyAsk: number = 0;

  constructor(rfq: RfqResponse) {
    this.rfq = rfq;
  }

  async init(): Promise<void> {
    const livePrice = await getTripartyLatestPrice(
      `${this.rfq.assetAId}/${this.rfq.assetBId}`,
    );
    this.tripartyBid = livePrice.bid;
    this.tripartyAsk = livePrice.ask;

    this.configRfqL = await this.getConfig(
      'long',
      this.rfq.lImA,
      this.rfq.lDfA,
      this.rfq.lPrice,
      this.rfq.lQuantity,
    );
    this.configRfqS = await this.getConfig(
      'short',
      this.rfq.sImA,
      this.rfq.sDfA,
      this.rfq.sPrice,
      this.rfq.sQuantity,
    );
    this.brokerL = getAllocatedBroker(this.rfq.assetAId) ?? null;
    this.brokerS = getAllocatedBroker(this.rfq.assetBId) ?? null;
    await this.fetchBrokerData();
  }

  private async getConfig(
    direction: string,
    im: string,
    df: string,
    price: string,
    quantity: string,
  ): Promise<any> {
    return getPairConfig(
      this.rfq.assetAId,
      this.rfq.assetBId,
      direction,
      1 / (parseFloat(im) + parseFloat(df)),
      parseFloat(price) * parseFloat(quantity),
    );
  }

  private async fetchBrokerData(): Promise<void> {
    if (this.brokerL && this.brokerS) {
      this.maxNotionalL = await getBrokerMaxNotional(this.brokerL);
      this.maxNotionalS = await getBrokerMaxNotional(this.brokerS);
      if (this.maxNotionalL > 0) {
        this.errors.push({ field: 'brokerL', value: this.brokerL });
      }
      if (this.maxNotionalS > 0) {
        this.errors.push({ field: 'brokerS', value: this.brokerS });
      }
    }
  }

  async check(): Promise<ErrorObject[]> {
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
    this.checkPrices();
    this.checkBrokerSelfLeverage();
    this.checkChainId();
    return this.errors;
  }

  private checkImA(): void {
    if ((this.configRfqL.imA ?? 0) > parseFloat(this.rfq.lImA)) {
      this.errors.push({ field: 'lImA', value: this.rfq.lImA });
    }
    if ((this.configRfqS.imA ?? 0) > parseFloat(this.rfq.sImA)) {
      this.errors.push({ field: 'sImA', value: this.rfq.sImA });
    }
  }

  private checkImB(): void {
    if ((this.configRfqL.imB ?? 0) > parseFloat(this.rfq.lImB)) {
      this.errors.push({ field: 'lImB', value: this.rfq.lImB });
    }
    if ((this.configRfqS.imB ?? 0) > parseFloat(this.rfq.sImB)) {
      this.errors.push({ field: 'sImB', value: this.rfq.sImB });
    }
  }

  private checkDfA(): void {
    if ((this.configRfqL.dfA ?? 0) > parseFloat(this.rfq.lDfA)) {
      this.errors.push({ field: 'lDfA', value: this.rfq.lDfA });
    }
    if ((this.configRfqS.dfA ?? 0) > parseFloat(this.rfq.sDfA)) {
      this.errors.push({ field: 'sDfA', value: this.rfq.sDfA });
    }
  }

  private checkDfB(): void {
    if ((this.configRfqL.dfB ?? 0) > parseFloat(this.rfq.lDfB)) {
      this.errors.push({ field: 'lDfB', value: this.rfq.lDfB });
    }
    if ((this.configRfqS.dfB ?? 0) > parseFloat(this.rfq.sDfB)) {
      this.errors.push({ field: 'sDfB', value: this.rfq.sDfB });
    }
  }

  private checkExpirationA(): void {
    if ((this.configRfqL.expiryA ?? 0) > this.rfq.lExpirationA) {
      this.errors.push({
        field: 'lExpirationA',
        value: [this.rfq.lExpirationA, this.configRfqL.expiryA],
      });
    }
    if ((this.configRfqS.expiryA ?? 0) > this.rfq.sExpirationA) {
      this.errors.push({
        field: 'sExpirationA',
        value: [this.rfq.sExpirationA, this.configRfqS.expiryA],
      });
    }
  }

  private checkExpirationB(): void {
    if ((this.configRfqL.expiryB ?? 0) > this.rfq.lExpirationB) {
      this.errors.push({
        field: 'lExpirationB',
        value: [this.rfq.lExpirationB, this.configRfqL.expiryB],
      });
    }
    if ((this.configRfqS.expiryB ?? 0) > this.rfq.sExpirationB) {
      this.errors.push({
        field: 'sExpirationB',
        value: [this.rfq.sExpirationB, this.configRfqS.expiryB],
      });
    }
  }

  private checkTimelockA(): void {
    if ((this.configRfqL.timeLockA ?? 0) > this.rfq.lTimelockA) {
      this.errors.push({ field: 'lTimelockA', value: this.rfq.lTimelockA });
    }
    if ((this.configRfqS.timeLockA ?? 0) > this.rfq.sTimelockA) {
      this.errors.push({ field: 'sTimelockA', value: this.rfq.sTimelockA });
    }
  }

  private checkTimelockB(): void {
    if ((this.configRfqL.timeLockB ?? 0) > this.rfq.lTimelockB) {
      this.errors.push({ field: 'lTimelockB', value: this.rfq.lTimelockB });
    }
    if ((this.configRfqS.timeLockB ?? 0) > this.rfq.sTimelockB) {
      this.errors.push({ field: 'sTimelockB', value: this.rfq.sTimelockB });
    }
  }

  private checkInterestRate(): void {
    if (
      !this.isValidInterestRate(
        this.configRfqS,
        this.rfq.sInterestRate,
        this.rfq.sIsPayingApr,
      )
    ) {
      this.errors.push({
        field: 'sInterestRate',
        value: [this.rfq.sInterestRate, this.configRfqS.funding],
      });
    }

    if (
      !this.isValidInterestRate(
        this.configRfqL,
        this.rfq.lInterestRate,
        this.rfq.lIsPayingApr,
      )
    ) {
      this.errors.push({
        field: 'lInterestRate',
        value: [this.rfq.lInterestRate, this.configRfqL.funding],
      });
    }
  }

  private isValidInterestRate(
    config: any,
    rate: string,
    isPayingApr: boolean,
  ): boolean {
    return (
      ((config.funding ?? 0) <= Number(rate) &&
        (config.isAPayingApr == isPayingApr ||
          (config.isAPayingApr == true && isPayingApr == false))) ||
      (Number(config.funding) <= 0 &&
        Math.abs(Number(config.funding ?? 0)) <= Math.abs(Number(rate)))
    );
  }

  private checkBrokerFreeCollateral(): void {
    if (
      Number(this.maxNotionalL) <=
      Number(this.rfq.lPrice) * Number(this.rfq.lQuantity)
    ) {
      this.errors.push({
        field: 'brokerFreeCollateral',
        value: [this.maxNotionalL, this.rfq.lPrice, this.rfq.lQuantity],
      });
    }
    if (
      Number(this.maxNotionalS) <=
      Number(this.rfq.sPrice) * Number(this.rfq.sQuantity)
    ) {
      this.errors.push({
        field: 'brokerFreeCollateral',
        value: [this.maxNotionalS, this.rfq.sPrice, this.rfq.sQuantity],
      });
    }
  }

  private checkQuantities(): void {
    if (!this.rfq.sQuantity || !this.rfq.lQuantity) {
      this.errors.push({ field: 'quantities', value: this.rfq });
    }
  }

  private checkOnchainFreeCollateral(): void {
    // Implement logic to check on-chain free collateral
  }

  private checkOnchainSelfLeverage(): void {
    // Implement logic to check on-chain self-leverage
  }

  private checkCounterpartySelfLeverage(): void {
    // Implement logic to check counterparty self-leverage
  }

  private checkMarketIsOpen(): void {
    // Implement logic to check if the market is open
  }

  private async checkPrices(): Promise<void> {
    if (this.tripartyBid > 0 && this.tripartyAsk > 0) {
      this.errors.push({ field: 'assets', value: this.rfq });
    }
    if (Number(this.rfq.sPrice) > this.tripartyBid) {
      this.errors.push({
        field: 'sPrice',
        value: [this.rfq.sPrice, this.tripartyBid],
      });
    }
    if (Number(this.rfq.lPrice) < this.tripartyAsk) {
    }
    this.errors.push({
      field: 'lPrice',
      value: [this.rfq.lPrice, this.tripartyAsk],
    });
  }

  private checkBrokerSelfLeverage(): void {
    // Implement logic to check broker self-leverage
  }

  private checkChainId(): void {
    if (this.rfq.chainId !== 64165) {
      this.errors.push({ field: 'chainId', value: this.rfq.chainId });
    }
  }
}

export default RfqChecker;
