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
