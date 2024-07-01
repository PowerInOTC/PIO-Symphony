import { Position } from './dispatcher';

export function isAmountOk(amount: number, minAmount: number): boolean {
  return amount % minAmount === 0;
}

export function suggestNearestAmount(
  amount: number,
  minAmount: number,
): number {
  const remainder = amount % minAmount;
  if (remainder === 0) {
    return amount;
  }
  const lowerBound = amount - remainder;
  return lowerBound;
}

export function getFirst12Characters(hexString: string): string {
  return hexString.slice(0, 12);
}

export function isPositionOpen(
  positions: Position[],
  symbol: string,
  bContractId: string,
  isLong: boolean,
): boolean {
  const result = positions.some(
    (position) =>
      position.symbol === symbol &&
      position.comment.startsWith(bContractId) &&
      position.type === (isLong ? 0 : 1),
  );

  return result;
}

export function calculateOptimalPairTrading(
  minAmountAssetA: number,
  minAmountAssetB: number,
): number {
  const roundToUpper500 = (value: number): number =>
    Math.ceil(value / 500) * 500;

  const roundedMinAmountAssetA = roundToUpper500(minAmountAssetA);
  const roundedMinAmountAssetB = roundToUpper500(minAmountAssetB);

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  return (
    Math.abs(roundedMinAmountAssetA * roundedMinAmountAssetB) /
    gcd(roundedMinAmountAssetA, roundedMinAmountAssetB)
  );
}

export function isValidHedgeAmount(
  amount: number,
  minAmountAssetA: number,
  minAmountAssetB: number,
): boolean {
  const roundToUpper500 = (value: number): number =>
    Math.ceil(value / 500) * 500;

  const roundedMinAmountAssetA = roundToUpper500(minAmountAssetA);
  const roundedMinAmountAssetB = roundToUpper500(minAmountAssetB);

  const minHedgeAmount = calculateOptimalPairTrading(
    roundedMinAmountAssetA,
    roundedMinAmountAssetB,
  );
  return amount % minHedgeAmount === 0 && amount >= minHedgeAmount;
}
