// hedgerSafetyCheck.ts
import { isPositionOpen, getFirst12Characters } from '../broker/utils';
import { hedger } from '../broker/inventory';
import { getMT5Ticker } from '../configBuilder/configRead';
import { getCachedPositions } from './cachePositions';
import { config } from '../config';
import { getOpenPositions, Position } from '../broker/dispatcher';

const localClosedPositions: { [key: string]: number } = {};

// @dev case of position been liquidated ( Not optimized ( to be updated with V2 repo architecture ))
// @dev check each second if a contract is open in hedger, but no longer in openPosition and close on hedger side. The 1 min buffer is ok with DF defined, but won't scale with optimized df.
async function verifyHedgerClosedPositions(token: string) {
  const openPositions = await getOpenPositions('mt5.ICMarkets');
  const cachedPositions = getCachedPositions();

  // Check closed trades
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

    if (!isAOpenned && !isBOpenned) {
      const positionKey = `${position.symbol}_${position.signatureOpenQuote}`;

      // Check if the position is already being processed
      if (localClosedPositions[positionKey]) {
        continue;
      }

      // Store the position locally with a timestamp
      localClosedPositions[positionKey] = Date.now();

      // Check if the position is still not in openPositions after 1 minute
      setTimeout(async () => {
        const updatedOpenPositions = await getOpenPositions('mt5.ICMarkets');
        const isAStillClosed = !(await isPositionOpen(
          updatedOpenPositions,
          mt5TickerA,
          identifier,
          isLong,
        ));
        const isBStillClosed = !(await isPositionOpen(
          updatedOpenPositions,
          mt5TickerB,
          identifier,
          !isLong,
        ));

        if (isAStillClosed || isBStillClosed) {
          const isPassed = await hedger(
            position.symbol,
            parseFloat(position.mtm),
            position.signatureOpenQuote,
            Number(position.amount),
            isLong,
            false,
          );
          if (!isPassed) {
            console.log('Hedger failed');
          }
        }

        // Remove the position from local storage after processing
        delete localClosedPositions[positionKey];
      }, 60000); // 1 minute delay
    }
  }
}

export function startHedgerSafetyCheckClose(token: string) {
  setInterval(() => {
    verifyHedgerClosedPositions(token).catch((error) => {
      console.error('Error during verification:', error);
    });
  }, 1000);
}
