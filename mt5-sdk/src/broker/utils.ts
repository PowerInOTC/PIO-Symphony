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
