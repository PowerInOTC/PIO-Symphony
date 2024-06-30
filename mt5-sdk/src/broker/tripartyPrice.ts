import axios from 'axios';
import { config } from '../config';
import { getPrices, PricesResponse } from '@pionerfriends/api-client';
import { verifySymbols } from '../config/configRead';
import { getToken } from '../utils/init';

interface CacheData {
  bid: number;
  ask: number;
}

interface CacheItem {
  expiration: number;
  cached?: CacheData;
}

const pairCache: { [pair: string]: CacheItem } = {};

async function fetchCacheData(pair: string): Promise<CacheData> {
  const token = await getToken(config.hedgerId);
  const [symbol1, symbol2] = pair.split('/');
  const response = await getPrices([symbol1, symbol2], token);

  if (response?.data) {
    const { bidPrice: bid1, askPrice: ask1 } = response.data[symbol1] || {};
    const { bidPrice: bid2, askPrice: ask2 } = response.data[symbol2] || {};

    if (bid1 && ask1 && bid2 && ask2) {
      const bid = parseFloat(bid1) / parseFloat(bid2);
      const ask = parseFloat(ask1) / parseFloat(ask2);
      return { bid, ask };
    }
  }

  return { bid: 0, ask: 0 };
}

function startOrUpdatePair(pair: string, expirationTime: number): void {
  pairCache[pair] = {
    expiration: expirationTime,
    cached: pairCache[pair]?.cached,
  };
}

async function getTripartyLatestPrice(pair: string): Promise<CacheData> {
  if (!verifySymbols(pair)) {
    return { bid: 0, ask: 0 };
  }

  const currentTime = Date.now();
  const expirationTime = currentTime + 20000;
  startOrUpdatePair(pair, expirationTime);

  const cachedData = pairCache[pair].cached;
  if (cachedData && cachedData.bid && cachedData.ask) {
    return cachedData;
  }

  const cacheData = await fetchCacheData(pair);
  pairCache[pair].cached = cacheData;

  return cacheData;
}

async function updateCacheData(): Promise<void> {
  let token = await getToken(config.hedgerId);
  const currentTime = Date.now();
  const uniqueSymbols = new Set<string>();

  for (const pair in pairCache) {
    if (pairCache[pair].expiration > currentTime) {
      const [symbol1, symbol2] = pair.split('/');
      uniqueSymbols.add(symbol1);
      uniqueSymbols.add(symbol2);
    }
  }

  const symbols = Array.from(uniqueSymbols);

  const updatePrices = async (retryCount = 0): Promise<void> => {
    try {
      const response = await getPrices(symbols, token);

      if (response?.data) {
        for (const pair in pairCache) {
          if (pairCache[pair].expiration > currentTime) {
            const [symbol1, symbol2] = pair.split('/');
            const { bidPrice: bid1, askPrice: ask1 } =
              response.data[symbol1] || {};
            const { bidPrice: bid2, askPrice: ask2 } =
              response.data[symbol2] || {};

            if (bid1 && ask1 && bid2 && ask2) {
              const bid = parseFloat(bid1) / parseFloat(bid2);
              const ask = parseFloat(ask1) / parseFloat(ask2);
              pairCache[pair].cached = { bid, ask };
            } else {
              pairCache[pair].cached = { bid: 0, ask: 0 };
            }
          }
        }
      } else {
        for (const pair in pairCache) {
          if (pairCache[pair].expiration > currentTime) {
            pairCache[pair].cached = { bid: 0, ask: 0 };
          }
        }
      }
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'error' in error &&
        typeof error.error === 'string' &&
        error.error.includes('String must contain at least 64 character(s)')
      ) {
        token = await getToken(config.hedgerId);
        await updatePrices(retryCount);
      } else if (retryCount < 5) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await updatePrices(retryCount + 1);
      } else {
        for (const pair in pairCache) {
          if (pairCache[pair].expiration > currentTime) {
            pairCache[pair].cached = { bid: 0, ask: 0 };
          }
        }
      }
    }
  };

  await updatePrices();
}

setInterval(updateCacheData, 1000);

export { getTripartyLatestPrice };
