import { calculateOptimalPairTrading } from './utils';

describe('calculateOptimalPairTrading', () => {
  test('handles the example case correctly', () => {
    const result = calculateOptimalPairTrading(300, 200);
    expect(result).toBe(600);
  });

  test('handles a case with different min amounts', () => {
    const result = calculateOptimalPairTrading(500, 300);
    expect(result).toBe(1500);
  });

  test('handles a case with very different min amounts', () => {
    const result = calculateOptimalPairTrading(100, 777);
    expect(result).toBe(77700);
  });

  test('handles edge case with equal min amounts', () => {
    const result = calculateOptimalPairTrading(250, 250);
    expect(result).toBe(250);
  });

  test('handles prime numbers', () => {
    const result = calculateOptimalPairTrading(17, 23);
    expect(result).toBe(391);
  });

  test('handles one amount being a multiple of the other', () => {
    const result = calculateOptimalPairTrading(100, 300);
    expect(result).toBe(300);
  });
});

import { isValidHedgeAmount } from './utils'; // Adjust the import path as needed

describe('isValidHedgeAmount', () => {
  test('handles the example case correctly', () => {
    expect(isValidHedgeAmount(600, 300, 200)).toBe(true);
    expect(isValidHedgeAmount(500, 300, 200)).toBe(false);
  });

  test('handles amounts less than optimal hedge amount', () => {
    expect(isValidHedgeAmount(400, 300, 200)).toBe(false);
  });

  test('handles amounts equal to optimal hedge amount', () => {
    expect(isValidHedgeAmount(1500, 500, 300)).toBe(true);
  });

  test('handles amounts greater than optimal hedge amount', () => {
    expect(isValidHedgeAmount(3000, 500, 300)).toBe(true);
    expect(isValidHedgeAmount(3100, 500, 300)).toBe(false);
  });

  test('handles very different min amounts', () => {
    expect(isValidHedgeAmount(77700, 100, 777)).toBe(true);
    expect(isValidHedgeAmount(77000, 100, 777)).toBe(false);
  });

  test('handles equal min amounts', () => {
    expect(isValidHedgeAmount(500, 250, 250)).toBe(true);
    expect(isValidHedgeAmount(400, 250, 250)).toBe(false);
  });
});
