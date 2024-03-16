// File: config.ts

import { Asset, Row } from './configBuilder';

async function getAssetByProxyTicker(proxyTicker: string, assets: Asset[]): Promise<Asset | undefined> {
  return assets.find(asset => asset.proxyTicker === proxyTicker);
}

async function getConfig(assetAProxyTicker: string, assetBProxyTicker: string, quantity: number, side: boolean, leverage: number, assets: Asset[]): Promise<Row> {
  const assetA = await getAssetByProxyTicker(assetAProxyTicker, assets);
  const assetB = await getAssetByProxyTicker(assetBProxyTicker, assets);

  if (!assetA || !assetB) {
    throw new Error('Invalid asset proxy tickers');
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
    brokerFee: (rowA.brokerFee ?? 0) + (rowB.brokerFee ?? 0),
    funding: (rowA.funding ?? 0) + (rowB.isAPayingApr ? -(rowB.funding ?? 0) : (rowB.funding ?? 0)),
    isAPayingApr: rowA.isAPayingApr ?? false,
  };

  return config;
}

async function getPairTradingConfig(assetAProxyTicker: string, assetBProxyTicker: string, quantity: number, side: boolean, leverage: number): Promise<Row> {
  const assets = (await import('./symphony.json')).default.assets;
  const config = await getConfig(assetAProxyTicker, assetBProxyTicker, quantity, side, leverage, assets);
  return config;
}

async function configTest() {
  const assetAProxyTicker = 'forex.EURUSD';
  const assetBProxyTicker = 'forex.GBPUSD';
  const quantity = 100000;
  const side = true; // Long
  const leverage = 50;

  const pairTradingConfig = await getPairTradingConfig(assetAProxyTicker, assetBProxyTicker, quantity, side, leverage);
  console.log('Pair Trading Config:', pairTradingConfig);
}


export { configTest}