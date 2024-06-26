import { calculateOptimalPairTrading } from './utils';

describe('calculateOptimalPairTrading', () => {
  test('basic calculation', () => {
    const result = calculateOptimalPairTrading(1000, 0.2, 2, 300, 1, 0.5);
    console.log('Test 1:', result);
    expect(result.optimalAmountAssetA).toBe(1000);
    expect(result.optimalAmountAssetB).toBe(1000);
    expect(result.minPairPrice).toBe(5000);
    expect(result.notionalRatio).toBe(1);
  });

  test('handles small amounts', () => {
    const result = calculateOptimalPairTrading(1000, 0.2, 2, 100, 1, 0.5);
    console.log('Test 2:', result);
    expect(result.optimalAmountAssetA).toBe(1000);
    expect(result.optimalAmountAssetB).toBe(1000);
    expect(result.minPairPrice).toBe(5000);
    expect(result.notionalRatio).toBe(1);
  });

  test('handles large amounts', () => {
    const result = calculateOptimalPairTrading(1000, 0.2, 2, 5000, 1, 0.5);
    console.log('Test 3:', result);
    expect(result.optimalAmountAssetA).toBe(10000);
    expect(result.optimalAmountAssetB).toBe(10000);
    expect(result.minPairPrice).toBe(5000);
    expect(result.notionalRatio).toBe(1);
  });

  test('handles different price ratios', () => {
    const result = calculateOptimalPairTrading(1000, 0.2, 1.5, 300, 1, 2 / 3);
    console.log('Test 4:', result);
    expect(result.optimalAmountAssetA).toBe(1000);
    expect(result.optimalAmountAssetB).toBeCloseTo(1000, 2);
    expect(result.minPairPrice).toBe(5000);
    expect(result.notionalRatio).toBeCloseTo(1, 4);
  });

  test('handles minimum asset amounts', () => {
    const result = calculateOptimalPairTrading(2000, 0.5, 2, 300, 1, 0.5);
    console.log('Test 5:', result);
    expect(result.optimalAmountAssetA).toBe(2000);
    expect(result.optimalAmountAssetB).toBe(2000);
    expect(result.minPairPrice).toBe(4000);
    expect(result.notionalRatio).toBe(1);
  });

  test('handles extreme price differences', () => {
    const result = calculateOptimalPairTrading(
      1000,
      0.001,
      1000,
      500,
      1,
      0.001,
    );
    console.log('Test 6:', result);
    expect(result.optimalAmountAssetA).toBe(500000);
    expect(result.optimalAmountAssetB).toBeCloseTo(500, 2);
    expect(result.minPairPrice).toBe(1000000);
    expect(result.notionalRatio).toBeCloseTo(1, 4);
  });
});
