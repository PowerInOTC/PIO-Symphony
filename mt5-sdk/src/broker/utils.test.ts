import {
  isAmountOk,
  suggestNearestAmount,
  getFirst12Characters,
} from './utils';

describe('Utils', () => {
  describe('isAmountOk', () => {
    test('should return true if amount is divisible by minAmount', () => {
      expect(isAmountOk(10, 5)).toBe(true);
      expect(isAmountOk(20, 10)).toBe(true);
      expect(isAmountOk(100, 25)).toBe(true);
    });

    test('should return false if amount is not divisible by minAmount', () => {
      expect(isAmountOk(10, 3)).toBe(false);
      expect(isAmountOk(20, 7)).toBe(false);
      expect(isAmountOk(100, 30)).toBe(false);
    });
  });

  describe('suggestNearestAmount', () => {
    test('should return the same amount if it is divisible by minAmount', () => {
      expect(suggestNearestAmount(10, 5)).toBe(10);
      expect(suggestNearestAmount(20, 10)).toBe(20);
      expect(suggestNearestAmount(100, 25)).toBe(100);
    });

    test('should return the nearest lower bound if amount is not divisible by minAmount', () => {
      expect(suggestNearestAmount(12, 5)).toBe(10);
      expect(suggestNearestAmount(57, 10)).toBe(50);
      expect(suggestNearestAmount(103, 25)).toBe(100);
    });

    test('should return the nearest lower bound if amount is not divisible by minAmount and closer to upper bound', () => {
      expect(suggestNearestAmount(14, 5)).toBe(10);
      expect(suggestNearestAmount(28, 10)).toBe(20);
      expect(suggestNearestAmount(113, 25)).toBe(100);
    });
  });

  describe('getFirst12Characters', () => {
    test('should return the first 12 characters of a hex string', () => {
      expect(getFirst12Characters('0x1234567890abcdef')).toBe('0x1234567890');
      expect(getFirst12Characters('0xabcdef1234567890')).toBe('0xabcdef1234');
      expect(getFirst12Characters('0x1234567890abcdef1234567890abcdef')).toBe(
        '0x1234567890',
      );
    });
  });
});
