import {
  signedCloseQuoteResponse,
  PionerWebsocketClient,
  WebSocketType,
  getSignedCloseQuotes,
  getPositions,
  PositionResponse,
} from '@pionerfriends/api-client';
import { config } from '../config';
import { get } from 'http';
import { getOpenPositions, Position } from '../broker/dispatcher';
import { isPositionOpen, getFirst12Characters } from '../broker/utils';
import { hedger } from '../broker/inventory';
import { getMT5Ticker, getBrokerFromAsset } from '../configBuilder/configRead';

function getChainID() {
  return [64165];
}

/**
 * Verify that hedger open positions have equal match on hedger broker.
 * @param token The token used for authentication.
 */
async function verifyHedgerOpenPositions(token: string) {
  const openPositions = await getOpenPositions('mt5.ICMarkets');
  const chainID = getChainID();
  const positions: PositionResponse[] = [];

  for (let i = 0; i < chainID.length; i++) {
    const positionsForChain = await getPositions(chainID[i], token, {
      onlyActive: true,
      address: config.publicKeys?.split(',')[0],
    });
    if (positionsForChain && positionsForChain.data) {
      positions.push(...positionsForChain.data);
    }
  }

  // Check non-opened trades
  for (let j = 0; j < positions.length; j++) {
    const position = positions[j];
    const identifier = getFirst12Characters(position.signatureOpenQuote);
    const [assetA, assetB] = position.symbol.split('/');
    const mt5TickerA = getMT5Ticker(assetA);
    const mt5TickerB = getMT5Ticker(assetB);

    if (!mt5TickerA || !mt5TickerB) {
      continue;
    }
    const isLong = true
      ? config.publicKeys?.split(',')[0] == position.pB
      : false;

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
        continue;
      }
    }
  }

  // Check non-closed trades
  for (let i = 0; i < openPositions.length; i++) {
    const openPosition = openPositions[i];
    let counter = 0;

    for (let j = 0; j < positions.length; j++) {
      const position = positions[j];
      if (openPosition.comment == position.signatureOpenQuote) {
        counter++;
      }
    }

    // Close onchain trade < 2
    if (counter == 0) {
      // not needed now
    }
    if (counter == 1) {
      // not needed now
    }
  }
}

/**
 * Start the verification process and run it every 5 seconds.
 * @param token The token used for authentication.
 */
export function startHedgerSafetyCheck(token: string) {
  setInterval(() => {
    verifyHedgerOpenPositions(token).catch((error) => {
      console.error('Error during verification:', error);
    });
  }, 5000);
}
