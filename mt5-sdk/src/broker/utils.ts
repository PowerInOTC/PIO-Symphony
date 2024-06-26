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
  pairPrice: number,
  requestedAmount: number,
  priceAssetA: number,
  priceAssetB: number,
): {
  optimalAmountAssetA: number;
  optimalAmountAssetB: number;
  minPairPrice: number;
  notionalRatio: number;
} {
  // Calculate initial amounts
  let optimalAmountAssetA =
    Math.ceil(
      Math.max(requestedAmount * pairPrice, minAmountAssetA) / minAmountAssetA,
    ) * minAmountAssetA;

  // Make an initial approximation for optimalAmountAssetB
  let optimalAmountAssetB =
    Math.ceil(
      (optimalAmountAssetA * priceAssetA) /
        (priceAssetB * pairPrice) /
        minAmountAssetB,
    ) * minAmountAssetB;

  // Calculate minimum pair price
  const minPairPrice = minAmountAssetA / minAmountAssetB;

  // Adjust amounts to get ratio closer to 1
  const targetRatio = 1;
  const tolerance = 0.0001;
  const maxIterations = 1000;

  let notionalRatio =
    (optimalAmountAssetA * priceAssetA) / (optimalAmountAssetB * priceAssetB);
  let iterations = 0;

  while (
    Math.abs(notionalRatio - targetRatio) > tolerance &&
    iterations < maxIterations
  ) {
    if (notionalRatio > targetRatio) {
      optimalAmountAssetB += minAmountAssetB;
    } else {
      optimalAmountAssetA += minAmountAssetA;
    }

    notionalRatio =
      (optimalAmountAssetA * priceAssetA) / (optimalAmountAssetB * priceAssetB);
    iterations++;
  }

  // Ensure minimum amounts are respected and round to avoid floating point precision issues
  optimalAmountAssetA = Math.round(
    Math.max(optimalAmountAssetA, minAmountAssetA),
  );
  optimalAmountAssetB =
    Math.round(Math.max(optimalAmountAssetB, minAmountAssetB) * 1e8) / 1e8;
  notionalRatio =
    Math.round(
      ((optimalAmountAssetA * priceAssetA) /
        (optimalAmountAssetB * priceAssetB)) *
        1e8,
    ) / 1e8;

  return {
    optimalAmountAssetA,
    optimalAmountAssetB,
    minPairPrice,
    notionalRatio,
  };
}
