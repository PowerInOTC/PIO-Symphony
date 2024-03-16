// File: pairTrading.ts

import { Asset, Row } from './configBuilder';

const assets: Asset[] = [
  // Array of assets
];

async function getAssetById(assetId: string): Promise<Asset | undefined> {
  return assets.find(asset => asset.mt5Ticker === assetId);
}

async function getConfig(assetAId: string, assetBId: string, quantity: number, side: boolean, leverage: number): Promise<Row> {
  const assetA = await getAssetById(assetAId);
  const assetB = await getAssetById(assetBId);

  if (!assetA || !assetB) {
    throw new Error('Invalid asset IDs');
  }

  const rowA = assetA.notional?.find(row => row.side === (side ? 'long' : 'short') && row.leverage === leverage);
  const rowB = assetB.notional?.find(row => row.side === (side ? 'long' : 'short') && row.leverage === leverage);

  if (!rowA || !rowB) {
    throw new Error('Notional row not found for the specified side and leverage');
  }

  const config: Row = {
    side: side ? 'long' : 'short',
    leverage: leverage,
    maxNotional: Math.min(rowA.maxNotional ?? Infinity, rowB.maxNotional ?? Infinity),
    minAmount: Math.max(rowA.minAmount ?? 0, rowB.minAmount ?? 0),
    maxAmount: Math.min(rowA.maxAmount ?? Infinity, rowB.maxAmount ?? Infinity),
    precision: Math.min(rowA.precision ?? Infinity, rowB.precision ?? Infinity),
    maxLeverageDeltaGlobalNotional: Math.min(rowA.maxLeverageDeltaGlobalNotional ?? Infinity, rowB.maxLeverageDeltaGlobalNotional ?? Infinity),
    maxLeverageLongGlobalNotional: Math.min(rowA.maxLeverageLongGlobalNotional ?? Infinity, rowB.maxLeverageLongGlobalNotional ?? Infinity),
    maxLeverageShortGlobalNotional: Math.min(rowA.maxLeverageShortGlobalNotional ?? Infinity, rowB.maxLeverageShortGlobalNotional ?? Infinity),
    imA: Math.max(rowA.imA ?? 0, rowB.imA ?? 0),
    imB: Math.max(rowA.imB ?? 0, rowB.imB ?? 0),
    dfA: Math.max(rowA.dfA ?? 0, rowB.dfA ?? 0),
    dfB: Math.max(rowA.dfB ?? 0, rowB.dfB ?? 0),
    ir: Math.max(rowA.ir ?? 0, rowB.ir ?? 0),
    expiryA: Math.max(rowA.expiryA ?? 0, rowB.expiryA ?? 0),
    expiryB: Math.max(rowA.expiryB ?? 0, rowB.expiryB ?? 0),
    timeLockA: Math.max(rowA.timeLockA ?? 0, rowB.timeLockA ?? 0),
    timeLockB: Math.max(rowA.timeLockB ?? 0, rowB.timeLockB ?? 0),
    maxConfidence: Math.min(rowA.maxConfidence ?? Infinity, rowB.maxConfidence ?? Infinity),
    maxDelay: Math.min(rowA.maxDelay ?? Infinity, rowB.maxDelay ?? Infinity),
    forceCloseType: Math.min(rowA.forceCloseType ?? Infinity, rowB.forceCloseType ?? Infinity),
    kycType: Math.min(rowA.kycType ?? Infinity, rowB.kycType ?? Infinity),
    cType: Math.min(rowA.cType ?? Infinity, rowB.cType ?? Infinity),
    kycAddress: rowA.kycAddress ?? rowB.kycAddress ?? '',
    type: rowA.type ?? rowB.type ?? '',
    brokerFee: (rowA.brokerFee ?? 0) + (rowB.brokerFee ?? 0),
    funding: (rowA.funding ?? 0) + (rowB.isAPayingApr ? -(rowB.funding ?? 0) : (rowB.funding ?? 0)),
    isAPayingApr: rowA.isAPayingApr ?? false,
  };

  return config;
}

async function getPairTradingConfig(assetAId: string, assetBId: string, quantity: number, side: boolean, leverage: number): Promise<Row> {
  const config = await getConfig(assetAId, assetBId, quantity, side, leverage);
  return config;
}

async function configTest() {
  const assetAId = 'EURUSD';
  const assetBId = 'GBPUSD';
  const quantity = 100000;
  const side = true; // Long
  const leverage = 50;

  const pairTradingConfig = await getPairTradingConfig(assetAId, assetBId, quantity, side, leverage);
  console.log('Pair Trading Config:', pairTradingConfig);
}

export {configTest};

