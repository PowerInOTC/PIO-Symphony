import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/init';

interface CacheItem {
  expiration: number;
  cached?: number;
}

const brokerCache: { [broker: string]: CacheItem } = {};

async function fetchMaxNotional(broker: string): Promise<number> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        return (await axios.get(`${config.apiBaseUrl}/retrieve_max_notional`))
          .data.max_notional;
      } catch (error) {
        logger.error('Error retrieving max notional:', error);
        return 0;
      }
    default:
      logger.error('Unsupported broker for retrieveMaxNotional');
      return 0;
  }
}

function startOrUpdateBroker(broker: string, expirationTime: number): void {
  brokerCache[broker] = {
    expiration: expirationTime,
    cached: brokerCache[broker]?.cached,
  };
}

async function getBrokerMaxNotional(broker: string): Promise<number> {
  const currentTime = Date.now();
  const expirationTime = currentTime + 10000;

  if (brokerCache[broker] && brokerCache[broker].cached !== undefined) {
    startOrUpdateBroker(broker, expirationTime);
    return brokerCache[broker].cached!;
  }

  const maxNotional = await fetchMaxNotional(broker);
  startOrUpdateBroker(broker, expirationTime);
  brokerCache[broker].cached = maxNotional;

  if (maxNotional === 0) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getBrokerMaxNotional(broker);
  }

  return maxNotional;
}

async function updateCacheData(): Promise<void> {
  const currentTime = Date.now();

  const updateMaxNotional = async (retryCount = 0): Promise<void> => {
    try {
      for (const broker in brokerCache) {
        if (brokerCache[broker].expiration > currentTime) {
          const maxNotional = await fetchMaxNotional(broker);
          brokerCache[broker].cached = maxNotional;
        }
      }
    } catch (error) {
      logger.error('Error updating cache data:', error);
      if (retryCount < 3) {
        logger.info(`Retrying updateCacheData (attempt ${retryCount + 1})...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await updateMaxNotional(retryCount + 1);
      } else {
        logger.error('Max retry attempts reached. Skipping cache update.');
      }
    }
  };

  await updateMaxNotional();
}

setInterval(updateCacheData, 2000);

export { getBrokerMaxNotional };
