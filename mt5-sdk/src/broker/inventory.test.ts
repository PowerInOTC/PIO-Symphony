import { minAmountSymbol } from '../broker/minAmount';
import { hedger } from '../broker/inventory';
import { getOpenPositions } from '../broker/dispatcher';
import {
  suggestNearestAmount,
  isAmountOk,
  getFirst12Characters,
} from '../broker/utils';

describe('Hedger', () => {
  test('testHedger', async () => {
    const amount = 1000;
    const assetAId = 'forex.GBPUSD';
    const assetBId = 'forex.EURUSD';
    const pair = `${assetAId}/${assetBId}`;
    const isLong = true;
    const hexString = getFirst12Characters(
      `0x81ecwaf5bca8e50573e0183wad582d6b6426bd988c9c7fd40c529bea86232136c8`,
    );

    const minAmount = await minAmountSymbol(pair);
    expect(isAmountOk(amount, minAmount)).toBe(true);

    // Open positions
    if (isAmountOk(amount, minAmount)) {
      const isPassed1 = await hedger(
        pair,
        0.5,
        hexString,
        amount,
        isLong,
        true,
      );
      expect(isPassed1).toBe(true);
    }
    const position = await getOpenPositions('mt5.ICMarkets');
    expect(position.length).toBeGreaterThan(0);

    // Close positions
    const isPassed2 = await hedger(pair, 0.5, hexString, amount, isLong, false);
    expect(isPassed2).toBe(true);

    const position2 = await getOpenPositions('mt5.ICMarkets');
    expect(position2.length).toBe(0);
  });
});
