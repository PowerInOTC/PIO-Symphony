// cachePositions.ts
import { getPositions, PositionResponse } from '@pionerfriends/api-client';
import { config } from '../config';

let cachedPositions: any[] = [];
let isFetching = false;
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 2000; // Minimum interval between fetches (in milliseconds)

export async function fetchPositions(chainId: number, token: string) {
  const currentTime = Date.now();

  if (isFetching || currentTime - lastFetchTime < MIN_FETCH_INTERVAL) {
    return;
  }

  try {
    isFetching = true;
    lastFetchTime = currentTime;

    const response = await getPositions(chainId, token, {
      onlyActive: true,
      address: config.publicKeys?.split(',')[0],
    });

    if (response && response.data) {
      cachedPositions = response.data;
      console.log('Positions fetched successfully:', cachedPositions);
    } else {
      console.error('Invalid response from getPositions');
    }
  } catch (error) {
    console.error('Error fetching positions:', error);
  } finally {
    isFetching = false;
  }
}

export function startPositionFetching(chainId: number, token: string) {
  fetchPositions(chainId, token).catch((error) => {
    console.error('Error fetching positions:', error);
  });

  setInterval(() => {
    fetchPositions(chainId, token).catch((error) => {
      console.error('Error fetching positions:', error);
    });
  }, MIN_FETCH_INTERVAL);
}

export function getCachedPositions() {
  return cachedPositions;
}
