/*import { minAmountSymbol } from '../broker/minAmount';
import { Hedger } from '../broker/inventory';
import { getOpenPositions } from '../broker/dispatcher';
import {
  suggestNearestAmount,
  isAmountOk,
  getFirst12Characters,
} from '../broker/utils';
import { getMarketStatus, MarketStatusResponse } from './marketStatus';
import { getToken } from '../utils/init';

describe('Hedger', () => {
  const userId = 0;
  const amount = 1000;
  const assetAId = 'forex.GBPUSD';
  const assetBId = 'forex.EURUSD';
  const pair = `${assetAId}/${assetBId}`;
  const isLong = true;
  const hexString = `0x81ecwaf5bca8e50573e0183wad582d6b6426bd988c9c7fd40c529bea86232136c8`;

  test('openPositions', async () => {
    const token = await getToken(userId);
    const marketStatus = await getMarketStatus(token, pair);

    const minAmount = await minAmountSymbol(pair);
    expect(isAmountOk(amount, minAmount)).toBe(true);

    const hedger = new Hedger();

    // Get initial position length
    const initialPosition = await getOpenPositions('mt5.ICMarkets');
    const initialPositionLength = initialPosition.length;

    // Open positions
    if (isAmountOk(amount, minAmount)) {
      const isPassed1 = await hedger.hedge(
        pair,
        0.5,
        hexString,
        amount,
        isLong,
        true,
        '0xfD5787816a44E0955c24728d75FE3646C39aE079', // Counterparty address
      );
      expect(isPassed1).toBe(marketStatus);
    }
    const positionAfterOpen = await getOpenPositions('mt5.ICMarkets');
    const plus2 = marketStatus ? 2 : 0;
    expect(positionAfterOpen.length).toBe(initialPositionLength + plus2);
  });

  test('closePositionsWithNoHedgeListUser', async () => {
    const hedger = new Hedger();

    // Get initial position length
    const initialPosition = await getOpenPositions('mt5.ICMarkets');
    const initialPositionLength = initialPosition.length;

    // Close positions but on a noHedgeList user
    const isPassed2 = await hedger.hedge(
      pair,
      0.5,
      hexString,
      amount,
      isLong,
      false,
      '0x1234567890123456789012345678901234567890', // noHedgeList Counterparty address
    );
    expect(isPassed2).toBe(true);

    const positionAfterClose = await getOpenPositions('mt5.ICMarkets');
    expect(positionAfterClose.length).toBe(initialPositionLength);
  });
});
*/
