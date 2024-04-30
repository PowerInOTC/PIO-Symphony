import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/init';

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

function getMT5LatestPrice(
  symbolPair: string,
  updateSpeedMs: number,
  updateLengthMs: number,
): Promise<{ bid: number; ask: number }> {
  const [symbol1, symbol2] = symbolPair.split('/');
  let updateCount = 0;
  const maxUpdateCount = Math.floor(updateLengthMs / updateSpeedMs);
  let latestPrice: { bid: number; ask: number } | null = null;
  let resolvePromise:
    | ((value: { bid: number; ask: number }) => void)
    | undefined;

  const pricePromise = new Promise<{ bid: number; ask: number }>((resolve) => {
    resolvePromise = resolve;
  });

  const updatePrice = async () => {
    try {
      const [tick1, tick2] = await Promise.all([
        retrieveLatestTick(symbol1),
        retrieveLatestTick(symbol2),
      ]);

      if (tick1.bid && tick1.ask && tick2.bid && tick2.ask) {
        const bidRatio = tick1.bid / tick2.bid;
        const askRatio = tick1.ask / tick2.ask;

        latestPrice = { bid: bidRatio, ask: askRatio };
        logger.info(latestPrice);

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
    if (updateCount >= maxUpdateCount) {
      clearInterval(updateWorker);
    }
  };

  const updateWorker = setInterval(updatePrice, updateSpeedMs);

  if (latestPrice) {
    return Promise.resolve(latestPrice);
  } else {
    return pricePromise;
  }
}

export { getMT5LatestPrice };
