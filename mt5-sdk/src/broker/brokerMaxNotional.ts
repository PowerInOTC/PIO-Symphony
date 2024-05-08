import { retrieveMaxNotional } from './dispatcher';

const maxNotionalCache: {
  [broker: string]: { expiration: number; maxNotional?: number };
} = {};

async function getBrokerMaxNotional(broker: string): Promise<number> {
  const currentTime = Date.now();
  const expirationTime = currentTime + 60000; // Cache expiration time: 1 minute

  if (
    maxNotionalCache[broker] &&
    maxNotionalCache[broker].expiration >= currentTime
  ) {
    return maxNotionalCache[broker].maxNotional!;
  }

  const maxNotional = await retrieveMaxNotional(broker);

  // Remove the broker from the cache if the API returns 0 (indicating an error or unsupported broker)
  if (maxNotional === 0) {
    delete maxNotionalCache[broker];
  } else {
    maxNotionalCache[broker] = { expiration: expirationTime, maxNotional };
  }

  return maxNotional;
}

async function updateMaxNotionalCache(): Promise<void> {
  const updateMaxNotionals = async (retryCount = 0): Promise<void> => {
    try {
      const currentTime = Date.now();
      for (const broker in maxNotionalCache) {
        const maxNotional = await retrieveMaxNotional(broker);

        // Remove the broker from the cache if the API returns 0 (indicating an error or unsupported broker)
        if (maxNotional === 0) {
          delete maxNotionalCache[broker];
        } else {
          maxNotionalCache[broker] = {
            maxNotional,
            expiration: currentTime + 60000, // Cache expiration time: 1 minute
          };
        }
      }
    } catch (error) {
      console.error('Error updating max notional cache:', error);
      if (retryCount < 3) {
        console.info(
          `Retrying updateMaxNotionalCache (attempt ${retryCount + 1})...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await updateMaxNotionals(retryCount + 1);
      } else {
        console.error(
          'Max retry attempts reached. Skipping max notional cache update.',
        );
      }
    }
  };
  await updateMaxNotionals();
}

setInterval(updateMaxNotionalCache, 10000); // Update cache every 10 seconds

export { getBrokerMaxNotional };
