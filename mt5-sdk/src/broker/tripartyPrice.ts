import { getPrices } from '@pionerfriends/api-client';
import { token } from '../test';
import { logger } from '../utils/init';

interface WorkerData {
  symbolPair: string;
  updateSpeed: number;
  updateLength: number;
}

let latestPriceData: { [key: string]: { bid: number; ask: number } } = {};
let updateWorkers: { [key: string]: NodeJS.Timeout } = {};
let symbolPairData: { [key: string]: WorkerData } = {};

async function retrieveLatestTicks(
  symbols: string[],
): Promise<{ [symbol: string]: { bid: number; ask: number } }> {
  try {
    const response = await getPrices(symbols, token);
    if (!response || !response.data) {
      return {};
    }

    const ticks: { [symbol: string]: { bid: number; ask: number } } = {};

    symbols.forEach((symbol) => {
      const { bidPrice, askPrice } = response.data[symbol] || {};
      const bid = parseFloat(bidPrice || '0');
      const ask = parseFloat(askPrice || '0');
      ticks[symbol] = { bid, ask };

      console.log(`Latest ticks for ${symbol}: bid=${bid}, ask=${ask}`);
    });

    return ticks;
  } catch (error) {
    console.error(`Error retrieving latest ticks:`, error);
    return {};
  }
}

async function startTripartyPriceUpdater(
  symbolPair: string,
  updateSpeedMs: number,
  updateLengthMin: number,
): Promise<void> {
  symbolPairData[symbolPair] = {
    symbolPair,
    updateSpeed: updateSpeedMs,
    updateLength: updateLengthMin * 60 * 1000,
  };

  if (!updateWorkers['allPairs']) {
    const updatePrices = async () => {
      const currentTime = Date.now();
      const activePairs = Object.values(symbolPairData).filter(
        (data) => currentTime - data.updateLength < 0,
      );

      if (activePairs.length === 0) {
        stopTripartyPriceUpdater();
        return;
      }

      const symbols = activePairs.flatMap((data) => data.symbolPair.split('/'));
      logger.info(`Retrieving latest ticks for symbols: ${symbols}`);
      const ticks = await retrieveLatestTicks(symbols);

      activePairs.forEach((data) => {
        const { symbolPair } = data;
        const [symbol1, symbol2] = symbolPair.split('/');
        const tick1 = ticks[symbol1];
        const tick2 = ticks[symbol2];

        if (
          tick1 &&
          tick2 &&
          tick1.bid &&
          tick1.ask &&
          tick2.bid &&
          tick2.ask
        ) {
          const bidRatio = tick1.bid / tick2.bid;
          const askRatio = tick1.ask / tick2.ask;

          latestPriceData[symbolPair] = {
            bid: bidRatio,
            ask: askRatio,
          };
        }
      });
    };

    updateWorkers['allPairs'] = setInterval(updatePrices, 1000);
  }
}

function getTripartyLatestPrice(
  symbolPair: string,
): { bid: number; ask: number } | null {
  return latestPriceData[symbolPair] || null;
}

function stopTripartyPriceUpdater(): void {
  Object.values(updateWorkers).forEach((updateWorker) => {
    clearInterval(updateWorker);
  });

  updateWorkers = {};
  latestPriceData = {};
  symbolPairData = {};
}

export { startTripartyPriceUpdater, getTripartyLatestPrice };
