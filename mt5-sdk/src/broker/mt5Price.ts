import { config } from '../config';
import axios from 'axios';
import NodeCache from 'node-cache';

interface Mt5PriceConfig {
  cacheHost: string;
  cachePort: number;
  cachePassword: string;
}

const cache = new NodeCache({ stdTTL: 15 * 60 }); // 15 minutes TTL

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

async function startMt5PriceWorker(config: Mt5PriceConfig): Promise<void> {
  console.log(`Mt5Price worker started`);
}

async function mt5Price(
  symbolPair: string,
  updateSpeedMs: number,
  updateLengthSec: number,
  userAddress: string,
): Promise<void> {
  const jobKey = `mt5PriceJob_${userAddress}_${symbolPair}`;

  const workerData = {
    symbolPair,
    updateSpeed: updateSpeedMs,
    updateLength: updateLengthSec,
    userAddress,
  };

  cache.set(jobKey, workerData, updateLengthSec);

  const worker = async () => {
    const { symbolPair, userAddress } = workerData;
    const [symbol1, symbol2] = symbolPair.split('/');

    const [tick1, tick2] = await Promise.all([
      retrieveLatestTick(symbol1),
      retrieveLatestTick(symbol2),
    ]);

    if (tick1.bid && tick1.ask && tick2.bid && tick2.ask) {
      const bidRatio = tick1.bid / tick2.bid;
      const askRatio = tick1.ask / tick2.ask;

      cache.set(`${userAddress}_${symbolPair}`, {
        bid: bidRatio,
        ask: askRatio,
      });
    }
  };

  const intervalId = setInterval(worker, updateSpeedMs);

  setTimeout(() => {
    clearInterval(intervalId);
    cache.del(jobKey);
  }, updateLengthSec * 1000);
}

function getLatestPrice(
  userAddress: string,
  symbolPair: string,
): { bid: number; ask: number } | undefined {
  const key = `${userAddress}_${symbolPair}`;
  return cache.get(key);
}

async function initMt5PriceWorker(): Promise<void> {
  cache.flushAll();
  console.log('Mt5Price worker initialized. All pairs and jobs cleared.');
}

startMt5PriceWorker(config)
  .then(() => {
    console.log('Mt5Price worker started successfully');
  })
  .catch((error) => {
    console.error('Error starting Mt5Price worker:', error);
  });

export { mt5Price, getLatestPrice, initMt5PriceWorker };
