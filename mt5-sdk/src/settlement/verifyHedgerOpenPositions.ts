// hedgerSafetyCheck.ts
import { isPositionOpen, getFirst12Characters } from '../broker/utils';
import { hedger } from '../broker/inventory';
import { getMT5Ticker } from '../config/configRead';
import { getCachedPositions } from './cachePositions';
import { config } from '../config';
import { getOpenPositions, Position } from '../broker/dispatcher';

async function verifyHedgerOpenPositions(token: string) {
  const openPositions = await getOpenPositions('mt5.ICMarkets');
  const cachedPositions = getCachedPositions();

  // Check non-opened trades
  for (const position of cachedPositions) {
    const identifier = getFirst12Characters(position.signatureOpenQuote);
    const [assetA, assetB] = position.symbol.split('/');
    const mt5TickerA = getMT5Ticker(assetA);
    const mt5TickerB = getMT5Ticker(assetB);

    if (!mt5TickerA || !mt5TickerB) {
      continue;
    }

    const isLong = config.publicKeys?.split(',')[0] === position.pB;
    const isAOpenned = await isPositionOpen(
      openPositions,
      mt5TickerA,
      identifier,
      isLong,
    );
    const isBOpenned = await isPositionOpen(
      openPositions,
      mt5TickerB,
      identifier,
      !isLong,
    );

    if (!isAOpenned || !isBOpenned) {
      const isPassed = await hedger(
        position.symbol,
        parseFloat(position.mtm),
        position.signatureOpenQuote,
        Number(position.amount),
        isLong,
        true,
      );
      if (!isPassed) {
        console.log('Hedger A failed');
      }
    }
  }
}

export function startHedgerSafetyCheckOpen(token: string) {
  setInterval(() => {
    verifyHedgerOpenPositions(token).catch((error) => {
      console.error('Error during verification:', error);
    });
  }, 1000);
}
