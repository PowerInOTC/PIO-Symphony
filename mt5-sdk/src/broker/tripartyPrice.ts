import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/init';
import { getPrices, PricesResponse } from '@pionerfriends/api-client';
import { token } from '../test';

const pairCache: {
  [pair: string]: { bid: number; ask: number; updateLengthMs: number };
} = {};
let updateWorker: NodeJS.Timeout | undefined;

async function getTripartyLatestPrice(
  symbolPair: string,
  updateSpeedMs: number,
  updateLengthMs: number,
): Promise<{ bid: number; ask: number }> {
  if (!pairCache[symbolPair]) {
    pairCache[symbolPair] = { bid: 0, ask: 0, updateLengthMs };
  }

  if (!updateWorker) {
    const updatePrices = async () => {
      const updatedPrices = await getTripartyLatestPrices(
        Object.keys(pairCache),
        updateSpeedMs,
      );
      Object.entries(updatedPrices).forEach(([pair, { bid, ask }]) => {
        pairCache[pair].bid = bid;
        pairCache[pair].ask = ask;
      });
    };

    updateWorker = setInterval(updatePrices, updateSpeedMs);
  }

  return new Promise((resolve) => {
    const checkPrice = () => {
      if (pairCache[symbolPair].bid !== 0 && pairCache[symbolPair].ask !== 0) {
        resolve({
          bid: pairCache[symbolPair].bid,
          ask: pairCache[symbolPair].ask,
        });
      } else {
        setTimeout(checkPrice, 100);
      }
    };
    checkPrice();
  });
}

async function getTripartyLatestPrices(
  symbolPairs: string[],
  updateSpeedMs: number,
): Promise<{ [pair: string]: { bid: number; ask: number } }> {
  const uniqueSymbols = new Set<string>();
  symbolPairs.forEach((pair) => {
    const [symbol1, symbol2] = pair.split('/');
    uniqueSymbols.add(symbol1);
    uniqueSymbols.add(symbol2);
  });

  const symbols = Array.from(uniqueSymbols);
  const response = await getPrices(symbols, token);

  const updatedPrices: { [pair: string]: { bid: number; ask: number } } = {};

  if (response && response.data) {
    symbolPairs.forEach((pair) => {
      const [symbol1, symbol2] = pair.split('/');
      const priceData1 = response.data[symbol1];
      const priceData2 = response.data[symbol2];
      logger.info(priceData1, priceData2);

      if (
        priceData1 &&
        priceData1.bidPrice &&
        priceData1.askPrice &&
        priceData2 &&
        priceData2.bidPrice &&
        priceData2.askPrice
      ) {
        const bid =
          parseFloat(priceData1.bidPrice) / parseFloat(priceData2.bidPrice);
        const ask =
          parseFloat(priceData1.askPrice) / parseFloat(priceData2.askPrice);
        updatedPrices[pair] = { bid, ask };
      } else {
        logger.warn(
          `Unable to retrieve prices for pair: ${pair}. Setting bid and ask to 0.`,
        );
        updatedPrices[pair] = { bid: 0, ask: 0 };
      }
    });
  } else {
    logger.error(
      `Error retrieving prices: response or response.data is undefined`,
    );
    symbolPairs.forEach((pair) => {
      updatedPrices[pair] = { bid: 0, ask: 0 };
    });
  }

  return updatedPrices;
}

export { getTripartyLatestPrice };
