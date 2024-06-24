import { RfqResponse } from '@pionerfriends/api-client';
import { getPairConfig, getAllocatedBroker } from '../../config/configRead';
import { getBrokerMaxNotional } from '../../broker/brokerMaxNotional';
import {
  startTotalOpenAmountInfo,
  getTotalOpenAmount,
} from '../../broker/totalOpenAmountModule';
import { getTripartyLatestPrice } from '../../broker/tripartyPrice';
import { isValidInterestRate, isMarketOpen } from '../../utils/check';
import { config } from '../../config';

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
  private brokerLeverage: number = 500;
  private pair = '';
  constructor(rfq: RfqResponse) {
    this.rfq = rfq;
  }

  async init(): Promise<void> {
    this.pair = `${this.rfq.assetAId}/${this.rfq.assetBId}`;

    const livePrice = await getTripartyLatestPrice(this.pair);
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
      this.rfq.sImB,
      this.rfq.sDfB,
      this.rfq.sPrice,
      this.rfq.sQuantity,
    );
    this.brokerL = getAllocatedBroker(this.rfq.assetAId) ?? null;
    this.brokerS = getAllocatedBroker(this.rfq.assetBId) ?? null;
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

  async check(): Promise<ErrorObject[]> {
    await this.init();
    await Promise.all([
      this.checkImA(),
      this.checkImB(),
      this.checkDfA(),
      this.checkDfB(),
      this.checkExpirationA(),
      this.checkExpirationB(),
      this.checkTimelockA(),
      this.checkTimelockB(),
      this.checkInterestRate(),
      this.checkBrokerFreeCollateral(),
      this.checkQuantities(),
      this.checkOnchainFreeCollateral(),
      this.checkOnchainSelfLeverage(),
      this.checkCounterpartySelfLeverage(),
      this.checkMarketIsOpen(),
      this.checkBrokerSelfLeverage(),
      this.checkChainId(),
    ]);
    return this.errors;
  }

  private async checkImA(): Promise<void> {
    if ((this.configRfqL.imA ?? 0) > parseFloat(this.rfq.lImA)) {
      this.errors.push({
        field: 'lImA',
        value: [this.rfq.lImA, this.configRfqL.imA],
      });
    }
    if ((this.configRfqS.imA ?? 0) > parseFloat(this.rfq.sImA)) {
      this.errors.push({
        field: 'sImA',
        value: [this.rfq.sImA, this.configRfqS.imA],
      });
    }
  }

  private async checkImB(): Promise<void> {
    if ((this.configRfqL.imB ?? 0) > parseFloat(this.rfq.lImB)) {
      this.errors.push({
        field: 'lImB',
        value: [this.rfq.lImB, this.configRfqL.imB],
      });
    }
    if ((this.configRfqS.imB ?? 0) > parseFloat(this.rfq.sImB)) {
      this.errors.push({
        field: 'sImB',
        value: [this.rfq.sImB, this.configRfqS.imB],
      });
    }
  }

  private async checkDfA(): Promise<void> {
    if ((this.configRfqL.dfA ?? 0) > parseFloat(this.rfq.lDfA)) {
      this.errors.push({
        field: 'lDfA',
        value: [this.rfq.lDfA, this.configRfqL.dfA],
      });
    }
    if ((this.configRfqS.dfA ?? 0) > parseFloat(this.rfq.sDfA)) {
      this.errors.push({
        field: 'sDfA',
        value: [this.rfq.sDfA, this.configRfqS.dfA],
      });
    }
  }

  private async checkDfB(): Promise<void> {
    if ((this.configRfqL.dfB ?? 0) > parseFloat(this.rfq.lDfB)) {
      this.errors.push({
        field: 'lDfB',
        value: [this.rfq.lDfB, this.configRfqL.dfB],
      });
    }
    if ((this.configRfqS.dfB ?? 0) > parseFloat(this.rfq.sDfB)) {
      this.errors.push({
        field: 'sDfB',
        value: [this.rfq.sDfB, this.configRfqS.dfB],
      });
    }
  }

  private async checkExpirationA(): Promise<void> {
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

  private async checkExpirationB(): Promise<void> {
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

  private async checkTimelockA(): Promise<void> {
    if ((this.configRfqL.timeLockA ?? 0) > this.rfq.lTimelockA) {
      this.errors.push({ field: 'lTimelockA', value: this.rfq.lTimelockA });
    }
    if ((this.configRfqS.timeLockA ?? 0) > this.rfq.sTimelockA) {
      this.errors.push({ field: 'sTimelockA', value: this.rfq.sTimelockA });
    }
  }

  private async checkTimelockB(): Promise<void> {
    if ((this.configRfqL.timeLockB ?? 0) > this.rfq.lTimelockB) {
      this.errors.push({ field: 'lTimelockB', value: this.rfq.lTimelockB });
    }
    if ((this.configRfqS.timeLockB ?? 0) > this.rfq.sTimelockB) {
      this.errors.push({ field: 'sTimelockB', value: this.rfq.sTimelockB });
    }
  }

  private async checkInterestRate(): Promise<void> {
    if (
      isValidInterestRate(
        this.configRfqS,
        this.rfq.sInterestRate,
        this.rfq.sIsPayingApr,
        false,
      )
    ) {
      this.errors.push({
        field: 'sInterestRate',
        value: [this.rfq.sInterestRate, this.configRfqS.funding],
      });
    }

    if (
      isValidInterestRate(
        this.configRfqL,
        this.rfq.lInterestRate,
        this.rfq.lIsPayingApr,
        true,
      )
    ) {
      this.errors.push({
        field: 'lInterestRate',
        value: [this.rfq.lInterestRate, this.configRfqL.funding],
      });
    }
  }

  private async checkBrokerFreeCollateral(): Promise<void> {
    if (
      Number(this.maxNotionalL) <=
      (Number(this.rfq.lPrice) * Number(this.rfq.lQuantity)) /
        this.brokerLeverage
    ) {
      this.errors.push({
        field: 'brokerFreeCollateral',
        value: [this.maxNotionalL, this.rfq.lPrice, this.rfq.lQuantity],
      });
    }
    if (
      Number(this.maxNotionalS) <=
      (Number(this.rfq.sPrice) * Number(this.rfq.sQuantity)) /
        this.brokerLeverage
    ) {
      this.errors.push({
        field: 'brokerFreeCollateral',
        value: [this.maxNotionalS, this.rfq.sPrice, this.rfq.sQuantity],
      });
    }
  }

  private async checkQuantities(): Promise<void> {
    if (!this.rfq.sQuantity || !this.rfq.lQuantity) {
      this.errors.push({ field: 'quantities', value: this.rfq });
    }
  }

  private async checkOnchainFreeCollateral(): Promise<void> {
    // Implement logic to check on-chain free collateral
  }

  private async checkOnchainSelfLeverage(): Promise<void> {
    // Implement logic to check on-chain self-leverage
  }

  private async checkCounterpartySelfLeverage(): Promise<void> {
    // Implement logic to check counterparty self-leverage
  }

  private async checkBrokerSelfLeverage(): Promise<void> {
    // Implement logic to check broker self-leverage
  }

  private async checkChainId(): Promise<void> {
    if (this.rfq.chainId !== Number(config.activeChainId)) {
      this.errors.push({ field: 'chainId', value: this.rfq.chainId });
    }
  }

  private async checkMarketIsOpen(): Promise<void> {
    const result = await isMarketOpen(this.pair);
    if (!result) {
      this.errors.push({ field: 'market', value: this.pair });
    }
  }
}

export default RfqChecker;
