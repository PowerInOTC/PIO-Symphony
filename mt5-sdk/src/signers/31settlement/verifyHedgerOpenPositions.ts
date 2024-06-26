// hedgerSafetyCheck.ts
import { isPositionOpen } from '../../broker/utils';
import { Hedger } from '../../broker/inventory';
import { getMT5Ticker } from '../../config/configRead';
import { getCachedPositions } from './cachePositions';
import { config } from '../../config';
import { getOpenPositions, Position } from '../../broker/dispatcher';
import { getPositions, PositionResponse } from '@pionerfriends/api-client';
import { isNoHedgeAddress } from '../../utils/check';
import { parseUnits, formatUnits } from 'viem';

class HedgerSafetyCheck {
  private hedger: Hedger;
  private noHedgeList: string[] = [];

  constructor() {
    this.hedger = new Hedger();
  }

  private async isPositionOpen(
    openPositions: Position[],
    mt5Ticker: string,
    hash: string,
    isLong: boolean,
  ): Promise<boolean> {
    return await isPositionOpen(openPositions, mt5Ticker, hash, isLong);
  }

  private async processOpenPosition(
    position: PositionResponse,
    isLong: boolean,
  ) {
    const isPassed = await this.hedger.hedge(
      position.symbol,
      parseFloat(position.mtm),
      position.signatureOpenQuote,
      Number(parseFloat(formatUnits(parseUnits(position.amount, 0), 18))),
      isLong,
      true,
      '0x0000000000000000000000000000000000000000', // noHedgeList doesn't apply in this case.
    );
    if (!isPassed) {
      //console.log('Hedger failed');
    }
  }

  private async verifyHedgerOpenPositions(token: string) {
    const openPositions = await getOpenPositions('mt5.ICMarkets');
    const cachedPositions = await getCachedPositions();

    for (const position of cachedPositions) {
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
        position.signatureOpenQuote,
        isLong,
      );
      const isBOpenned = await this.isPositionOpen(
        openPositions,
        mt5TickerB,
        position.signatureOpenQuote,
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
    }, config.verifyHedgerOpenRefreshRate);
  }
}

export function startHedgerSafetyCheckOpen(token: string) {
  const hedgerSafetyCheck = new HedgerSafetyCheck();
  hedgerSafetyCheck.startHedgerSafetyCheckOpen(token);
}
