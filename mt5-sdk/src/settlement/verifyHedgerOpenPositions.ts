// hedgerSafetyCheck.ts
import { isPositionOpen, getFirst12Characters } from '../broker/utils';
import { Hedger } from '../broker/inventory';
import { getMT5Ticker } from '../config/configRead';
import { getCachedPositions } from './cachePositions';
import { config } from '../config';
import { getOpenPositions, Position } from '../broker/dispatcher';
import { getPositions, PositionResponse } from '@pionerfriends/api-client';
import { isNoHedgeAddress } from '../utils/check';

class HedgerSafetyCheck {
  private hedger: Hedger;
  private noHedgeList: string[] = [];

  constructor() {
    this.hedger = new Hedger();
  }

  private async isPositionOpen(
    openPositions: Position[],
    mt5Ticker: string,
    identifier: string,
    isLong: boolean,
  ): Promise<boolean> {
    return await isPositionOpen(openPositions, mt5Ticker, identifier, isLong);
  }

  private async processOpenPosition(
    position: PositionResponse,
    isLong: boolean,
  ) {
    const isPassed = await this.hedger.hedge(
      position.symbol,
      parseFloat(position.mtm),
      position.signatureOpenQuote,
      Number(position.amount),
      isLong,
      true,
      '0x0000000000000000000000000000000000000000',
    );
    if (!isPassed) {
      console.log('Hedger failed');
    }
  }

  private async verifyHedgerOpenPositions(token: string) {
    const openPositions = await getOpenPositions('mt5.ICMarkets');
    const cachedPositions = await getCachedPositions();

    for (const position of cachedPositions) {
      const identifier = getFirst12Characters(position.signatureOpenQuote);
      const [assetA, assetB] = position.symbol.split('/');
      const mt5TickerA = getMT5Ticker(assetA);
      const mt5TickerB = getMT5Ticker(assetB);

      if (!mt5TickerA || !mt5TickerB) {
        continue;
      }

      const isLong = config.publicKeys?.split(',')[0] === position.pB;

      if (
        (await isNoHedgeAddress(position.pA)) ||
        (await isNoHedgeAddress(position.pB))
      ) {
        continue;
      }

      const isAOpenned = await this.isPositionOpen(
        openPositions,
        mt5TickerA,
        identifier,
        isLong,
      );
      const isBOpenned = await this.isPositionOpen(
        openPositions,
        mt5TickerB,
        identifier,
        !isLong,
      );

      if (!isAOpenned || !isBOpenned) {
        await this.processOpenPosition(position, isLong);
      }
    }
  }

  public startHedgerSafetyCheckOpen(token: string) {
    setInterval(() => {
      this.verifyHedgerOpenPositions(token).catch((error) => {
        console.error('Error during verification:', error);
      });
    }, 1000);
  }
}

export function startHedgerSafetyCheckOpen(token: string) {
  const hedgerSafetyCheck = new HedgerSafetyCheck();
  hedgerSafetyCheck.startHedgerSafetyCheckOpen(token);
}
