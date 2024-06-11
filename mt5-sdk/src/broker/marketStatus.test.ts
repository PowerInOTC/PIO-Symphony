// marketStatus.test.ts

import axios from 'axios';
import { getMarketStatus, MarketStatusResponse } from './marketStatus';
import { getToken } from '../utils/init';

jest.mock('axios');

describe('getMarketStatus', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return the market status for different pair combinations from the API', async () => {
    const pair1 = 'forex.EURUSD/stock.nasdaq.AAPL';
    const pair2 = 'crypto.BTCUSD/crypto.ETHUSD';
    const pair3 = 'crypto.BTCUSD/stock.nasdaq.AAPL';

    const mockResponse: MarketStatusResponse = {
      isTheCryptoMarketOpen: true,
      isTheForexMarketOpen: false,
      isTheStockMarketOpen: false,
    };

    (axios.get as jest.Mock).mockResolvedValue({ data: mockResponse });

    const token = await getToken(0);

    // Test pair1
    const result1 = await getMarketStatus(token, pair1);
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.pio.finance:2096/api/v1/is_market_open',
      {
        headers: {
          Authorization: token,
        },
      },
    );
    expect(result1).toBe(false);

    // Test pair2
    const result2 = await getMarketStatus(token, pair2);
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.pio.finance:2096/api/v1/is_market_open',
      {
        headers: {
          Authorization: token,
        },
      },
    );
    expect(result2).toBe(true);

    // Test pair3
    const result3 = await getMarketStatus(token, pair3);
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.pio.finance:2096/api/v1/is_market_open',
      {
        headers: {
          Authorization: token,
        },
      },
    );
    expect(result3).toBe(false);

    // Verify that the cache is used for subsequent calls within the expiration time
    const result4 = await getMarketStatus(token, pair1);
    expect(axios.get).toHaveBeenCalledTimes(1); // Cache should be used, no additional API call
    expect(result4).toBe(false);
  });
});
