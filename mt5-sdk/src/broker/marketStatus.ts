// marketStatus.ts

import axios from 'axios';

export interface MarketStatusResponse {
  isTheCryptoMarketOpen: boolean;
  isTheForexMarketOpen: boolean;
  isTheStockMarketOpen: boolean;
}

interface CacheItem {
  expiration: number;
  data?: MarketStatusResponse;
}

const marketStatusCache: CacheItem = {
  expiration: 0,
};

async function fetchMarketStatus(token: string): Promise<MarketStatusResponse> {
  try {
    //https://api.pio.finance:2096/api/v1/is_market_open
    const response = await axios.get<MarketStatusResponse>(
      'https://api.pio.finance:2096/api/v1/is_market_open',
      {
        headers: {
          Authorization: token,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching market status:', error);
    throw error;
  }
}

function startOrUpdateCache(
  expirationTime: number,
  data: MarketStatusResponse,
): void {
  marketStatusCache.expiration = expirationTime;
  marketStatusCache.data = data;
}

function isMarketStatusCacheValid(): boolean {
  const currentTime = Date.now();
  return marketStatusCache.expiration > currentTime && !!marketStatusCache.data;
}

async function getMarketStatus(token: string, pair: string): Promise<boolean> {
  const currentTime = Date.now();
  const expirationTime = currentTime + 2000; // Cache for 2 seconds

  if (isMarketStatusCacheValid()) {
    const cachedData = marketStatusCache.data!;
    const [symbol1, symbol2] = pair.split('/');
    const isForexPair =
      symbol1.startsWith('forex') || symbol2.startsWith('forex');
    const isStockPair =
      symbol1.startsWith('stock') || symbol2.startsWith('stock');

    if (isForexPair && isStockPair) {
      return cachedData.isTheForexMarketOpen && cachedData.isTheStockMarketOpen;
    } else if (isForexPair) {
      return cachedData.isTheForexMarketOpen;
    } else if (isStockPair) {
      return cachedData.isTheStockMarketOpen;
    } else {
      return cachedData.isTheCryptoMarketOpen;
    }
  }

  try {
    const data = await fetchMarketStatus(token);
    startOrUpdateCache(expirationTime, data);

    const [symbol1, symbol2] = pair.split('/');
    const isForexPair =
      symbol1.startsWith('forex') || symbol2.startsWith('forex');
    const isStockPair =
      symbol1.startsWith('stock') || symbol2.startsWith('stock');

    if (isForexPair && isStockPair) {
      return data.isTheForexMarketOpen && data.isTheStockMarketOpen;
    } else if (isForexPair) {
      return data.isTheForexMarketOpen;
    } else if (isStockPair) {
      return data.isTheStockMarketOpen;
    } else {
      return data.isTheCryptoMarketOpen;
    }
  } catch (error) {
    console.error('Error updating market status:', error);
    return false;
  }
}

export { getMarketStatus };
