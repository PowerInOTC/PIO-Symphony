import { getTripartyLatestPrice } from './tripartyPrice';

describe('getTripartyLatestPrice', () => {
  const pairs = ['forex.EURUSD/stock.nasdaq.AAPL', 'forex.EURUSD/forex.GBPUSD'];

  test.each(pairs)('should return bid and ask prices for %s', async (pair) => {
    const { bid, ask } = await getTripartyLatestPrice(pair);
    console.log(`bid: ${bid}, ask: ${ask}`);

    expect(typeof bid).toBe('number');
    expect(typeof ask).toBe('number');

    expect(bid).toBeGreaterThanOrEqual(0);
    expect(ask).toBeGreaterThanOrEqual(0);
  });

  test('should return bid and ask as 0 for invalid pair', async () => {
    const invalidPair = 'INVALID/PAIR';
    const { bid, ask } = await getTripartyLatestPrice(invalidPair);

    expect(bid).toBe(0);
    expect(ask).toBe(0);
  });
});
