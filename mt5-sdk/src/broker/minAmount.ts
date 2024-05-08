import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/init';
import { getMT5Ticker, getBrokerFromAsset } from '../configBuilder/configRead';

interface CacheItem {
  expiration: number;
  cached?: number;
}

const symbolCache: { [symbol: string]: CacheItem } = {};

async function fetchMinAmount(symbol: string, broker: string): Promise<number> {
  const mt5Ticker = getMT5Ticker(symbol);
  if (!mt5Ticker) {
    logger.error('Invalid symbol for minAmountSymbol');
    return 0;
  }

  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        return (
          await axios.get(
            `${config.apiBaseUrl}/min_amount_symbol/${mt5Ticker}?broker=${broker}`,
          )
        ).data.min_amount;
      } catch (error) {
        logger.error('Error retrieving minimum amount:', error);
        return 0;
      }
    default:
      logger.error('Unsupported broker for minAmountSymbol');
      return 0;
  }
}

function startOrUpdateSymbol(symbol: string, expirationTime: number): void {
  symbolCache[symbol] = {
    expiration: expirationTime,
    cached: symbolCache[symbol]?.cached,
  };
}

function cleanUpExpiredCache(): void {
  const currentTime = Date.now();
  for (const symbol in symbolCache) {
    if (symbolCache[symbol].expiration <= currentTime) {
      delete symbolCache[symbol];
    }
  }
}

async function getMinAmountForSymbol(
  mt5Ticker: string,
  broker: string,
): Promise<number> {
  const currentTime = Date.now();
  const expirationTime = currentTime + 2000;

  if (
    symbolCache[mt5Ticker] &&
    symbolCache[mt5Ticker].expiration > currentTime
  ) {
    return symbolCache[mt5Ticker].cached!;
  }

  const minAmount = await fetchMinAmount(mt5Ticker, broker);
  startOrUpdateSymbol(mt5Ticker, expirationTime);
  symbolCache[mt5Ticker].cached = minAmount;

  return minAmount;
}

async function minAmountSymbol(proxyPair: string): Promise<number> {
  const [proxyTicker1, proxyTicker2] = proxyPair.split('/');
  const broker1 = getBrokerFromAsset(proxyTicker1);
  const broker2 = getBrokerFromAsset(proxyTicker2);
  if (!broker1 || !broker2) {
    logger.error('Invalid broker for minAmountSymbol');
    return 0;
  }

  const mt5Ticker1 = getMT5Ticker(proxyTicker1);
  const mt5Ticker2 = getMT5Ticker(proxyTicker2);
  if (!mt5Ticker1 || !mt5Ticker2) {
    logger.error('Invalid symbol for minAmountSymbol');
    return 0;
  }

  const [minAmount1, minAmount2] = await Promise.all([
    getMinAmountForSymbol(proxyTicker1, broker1),
    getMinAmountForSymbol(proxyTicker2, broker2),
  ]);

  return Math.max(minAmount1, minAmount2);
}

setInterval(cleanUpExpiredCache, 1000);

export { minAmountSymbol };
