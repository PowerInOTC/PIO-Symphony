import axios from 'axios';
import { config } from '../config';

import { getMT5Ticker } from '../configBuilder/configRead';

interface CacheData {
  bid: number;
  ask: number;
}

interface CacheItem {
  expiration: number;
  cached?: CacheData;
}

const pairCache: { [proxyPair: string]: CacheItem } = {};

async function fetchCacheData(proxyPair: string): Promise<CacheData> {
  const [proxyTicker1, proxyTicker2] = proxyPair.split('/');

  const mt5Ticker1 = getMT5Ticker(proxyTicker1);
  const mt5Ticker2 = getMT5Ticker(proxyTicker2);

  if (!mt5Ticker1 || !mt5Ticker2) {
    return { bid: 0, ask: 0 };
  }

  const [tick1, tick2] = await Promise.all([
    retrieveLatestTick(mt5Ticker1),
    retrieveLatestTick(mt5Ticker2),
  ]);

  if (tick1.bid && tick1.ask && tick2.bid && tick2.ask) {
    const bid = tick1.bid / tick2.bid;
    const ask = tick1.ask / tick2.ask;
    return { bid, ask };
  }

  console.warn(
    `Unable to retrieve prices for pair: ${proxyPair}. Setting bid and ask to 0.`,
  );
  return { bid: 0, ask: 0 };
}

function startOrUpdatePair(proxyPair: string, expirationTime: number): void {
  pairCache[proxyPair] = {
    expiration: expirationTime,
    cached: pairCache[proxyPair]?.cached,
  };
}

async function getMT5LatestPrice(proxyPair: string): Promise<CacheData> {
  const currentTime = Date.now();
  const expirationTime = currentTime + 2000;

  if (pairCache[proxyPair] && pairCache[proxyPair].cached) {
    startOrUpdatePair(proxyPair, expirationTime);
    return pairCache[proxyPair].cached!;
  }

  const cacheData = await fetchCacheData(proxyPair);
  startOrUpdatePair(proxyPair, expirationTime);
  pairCache[proxyPair].cached = cacheData;

  if (cacheData.bid === 0 && cacheData.ask === 0) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getMT5LatestPrice(proxyPair);
  }

  return cacheData;
}

async function updateCacheData(): Promise<void> {
  const currentTime = Date.now();

  const updatePrices = async (retryCount = 0): Promise<void> => {
    try {
      for (const proxyPair in pairCache) {
        if (pairCache[proxyPair].expiration > currentTime) {
          const cacheData = await fetchCacheData(proxyPair);
          pairCache[proxyPair].cached = cacheData;
        }
      }
    } catch (error) {
      console.error('Error updating cache data:', error);
      if (retryCount < 3) {
        console.info(`Retrying updateCacheData (attempt ${retryCount + 1})...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await updatePrices(retryCount + 1);
      } else {
        console.error('Max retry attempts reached. Skipping cache update.');
      }
    }
  };

  await updatePrices();
}

async function retrieveLatestTick(
  mt5Ticker: string,
): Promise<{ bid: number; ask: number }> {
  try {
    const response = await axios.get(
      `${config.apiBaseUrl}/retrieve_latest_tick/${mt5Ticker}`,
    );
    return response.data as { bid: number; ask: number };
  } catch (error) {
    console.error(`Error retrieving latest tick for ${mt5Ticker}:`, error);
    return { bid: 0, ask: 0 };
  }
}

setInterval(updateCacheData, 1000);

export { getMT5LatestPrice };
