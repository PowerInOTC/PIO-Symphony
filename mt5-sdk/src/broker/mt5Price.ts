import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/init';

const pairCache: {
  [pair: string]: {
    bid: number;
    ask: number;
    updateWorker: NodeJS.Timeout | undefined;
  };
} = {};

async function getMT5LatestPrice(
  symbolPair: string,
  updateSpeedMs: number,
  updateLengthMs: number,
): Promise<{ bid: number; ask: number }> {
  const [symbol1, symbol2] = symbolPair.split('/');

  if (
    pairCache[symbolPair] &&
    pairCache[symbolPair].updateWorker !== undefined
  ) {
    return Promise.resolve({
      bid: pairCache[symbolPair].bid,
      ask: pairCache[symbolPair].ask,
    });
  }

  let latestPrice: { bid: number; ask: number } | null = null;
  let resolvePromise:
    | ((value: { bid: number; ask: number }) => void)
    | undefined;
  const pricePromise = new Promise<{ bid: number; ask: number }>((resolve) => {
    resolvePromise = resolve;
  });

  const maxUpdateCount = Math.floor(updateLengthMs / updateSpeedMs);

  async function updatePrice() {
    let updateCount = 0;
    while (updateCount < maxUpdateCount) {
      try {
        const [tick1, tick2] = await Promise.all([
          retrieveLatestTick(symbol1),
          retrieveLatestTick(symbol2),
        ]);
        if (tick1.bid && tick1.ask && tick2.bid && tick2.ask) {
          const bidRatio = tick1.bid / tick2.bid;
          const askRatio = tick1.ask / tick2.ask;
          latestPrice = { bid: bidRatio, ask: askRatio };
          pairCache[symbolPair] = {
            ...latestPrice,
            updateWorker: pairCache[symbolPair]?.updateWorker,
          };
          if (resolvePromise) {
            resolvePromise(latestPrice);
            resolvePromise = undefined;
          }
        } else {
          logger.error(
            `Invalid tick data for ${symbolPair}: ${JSON.stringify(tick1)}, ${JSON.stringify(tick2)}`,
          );
        }
      } catch (error) {
        logger.error(`Error updating price for ${symbolPair}:`, error);
      }
      updateCount++;
      await new Promise((resolve) => setTimeout(resolve, updateSpeedMs));
    }
    if (pairCache[symbolPair]) {
      clearInterval(pairCache[symbolPair].updateWorker);
      delete pairCache[symbolPair];
    }
  }

  pairCache[symbolPair] = { bid: 0, ask: 0, updateWorker: undefined };
  pairCache[symbolPair].updateWorker = setInterval(updatePrice, updateSpeedMs);

  return pricePromise;
}

async function retrieveLatestTick(
  symbol: string,
): Promise<{ bid: number; ask: number }> {
  try {
    const response = await axios.get(
      `${config.apiBaseUrl}/retrieve_latest_tick/${symbol}`,
    );
    return response.data as { bid: number; ask: number };
  } catch (error) {
    console.error(`Error retrieving latest tick for ${symbol}:`, error);
    return { bid: 0, ask: 0 };
  }
}

export { getMT5LatestPrice };
