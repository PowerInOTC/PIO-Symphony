import fs from 'fs';
import { Asset, Row } from '../types/config';
import { logger } from '../utils/init';

interface SymphonyJSON {
  assets: Asset[];
}

function processSymphonyJSON(symphonyJSONPath: string): Asset[] {
  const rawData = fs.readFileSync(symphonyJSONPath, 'utf-8');
  const jsonData: SymphonyJSON = JSON.parse(rawData);
  return jsonData.assets;
}

const symphonyJSONPath = './symphony.json';
const symbolList: Asset[] = processSymphonyJSON(symphonyJSONPath);

function getFieldFromAsset(
  broker: string,
  proxyTicker: string,
  side: string,
  leverage: number,
  notional: number,
): Row | undefined {
  const asset = symbolList.find(
    (a) => a.broker === broker && a.proxyTicker === proxyTicker,
  );
  if (asset) {
    const row = asset.notional?.find(
      (r) =>
        r.side === side &&
        r.leverage < leverage &&
        (r.maxNotional ?? Infinity) > notional,
    );

    return row;
  }
  return undefined;
}

function findAssetByProxyTicker(proxyTicker: string): Asset | undefined {
  return symbolList.find((a) => a.proxyTicker === proxyTicker);
}

function getAllProxyTickers(): string[] {
  if (!Array.isArray(symbolList)) {
    throw new Error('symbolList is not an array');
  }
  return symbolList.map((a) => a.proxyTicker);
}

function writeProxyTickersToFile(): void {
  if (!Array.isArray(symbolList)) {
    throw new Error('symbolList is not an array');
  }

  const filename = 'assets.json'; // Hardcoded filename

  const output: Record<string, Record<string, Record<string, unknown>>> = {};

  symbolList.forEach((symbol) => {
    const parts = symbol.proxyTicker.split('.');

    if (parts.length >= 2) {
      const category = parts[0];
      let subcategory = '';
      let asset = '';

      if (category === 'stock') {
        if (parts.length >= 3) {
          subcategory = parts[1];
          asset = parts[2];
        }
      } else {
        subcategory = parts[1];
        asset = parts.slice(2).join('.');
      }

      if (!output[category]) {
        output[category] = {};
      }

      if (!output[category][subcategory]) {
        output[category][subcategory] = {};
      }

      output[category][subcategory][asset] = {};
    }
  });

  const json = JSON.stringify(output, null, 2);
  fs.writeFileSync(filename, json);
}

function getMaxNotionalForMaxLeverage(
  proxyTicker: string,
  side: string,
  maxLeverage: number,
): number | undefined {
  const asset = findAssetByProxyTicker(proxyTicker);
  if (asset) {
    const rows = asset.notional?.filter(
      (r) => r.side === side && r.leverage <= maxLeverage,
    );
    if (rows && rows.length > 0) {
      const maxNotionalRow = rows.reduce((prev, current) =>
        (prev.maxNotional ?? 0) > (current.maxNotional ?? 0) ? prev : current,
      );
      return maxNotionalRow.maxNotional;
    }
  }
  return undefined;
}

function adjustQuantities(
  bid: number,
  ask: number,
  sQuantity: number,
  lQuantity: number,
  assetAId: string,
  assetBId: string,
  maxLeverage: number,
): { sQuantity: number; lQuantity: number } {
  const maxNotionalLongA = getMaxNotionalForMaxLeverage(
    assetAId,
    'long',
    maxLeverage,
  );
  const maxNotionalLongB = getMaxNotionalForMaxLeverage(
    assetBId,
    'short',
    maxLeverage,
  );
  const maxNotionalShortB = getMaxNotionalForMaxLeverage(
    assetBId,
    'long',
    maxLeverage,
  );
  const maxNotionalShortA = getMaxNotionalForMaxLeverage(
    assetAId,
    'short',
    maxLeverage,
  );

  if (maxNotionalLongA !== undefined && maxNotionalLongB !== undefined) {
    const maxBidNotional = Math.max(bid) * sQuantity;
    const minMaxNotionalLong = Math.min(maxNotionalLongA, maxNotionalLongB);
    if (maxBidNotional > minMaxNotionalLong) {
      sQuantity = minMaxNotionalLong / bid;
    }
  }

  if (maxNotionalShortA !== undefined && maxNotionalShortB !== undefined) {
    const maxAskNotional = Math.max(ask) * lQuantity;
    const minMaxNotionalShort = Math.min(maxNotionalShortA, maxNotionalShortB);
    if (maxAskNotional > minMaxNotionalShort) {
      lQuantity = minMaxNotionalShort / ask;
    }
  }

  return { sQuantity, lQuantity };
}

function getPairConfig(
  tickerA: string,
  tickerB: string,
  side: string,
  leverage: number,
  notional: number,
): Row {
  const rowA = getFieldFromAsset(
    'mt5.ICMarkets',
    tickerA,
    side,
    leverage,
    notional,
  );
  const rowB = getFieldFromAsset(
    'mt5.ICMarkets',
    tickerB,
    side === 'long' ? 'short' : 'long',
    leverage,
    notional,
  );

  if (!rowA || !rowB) {
    throw new Error(
      'Notional row not found for the specified side and leverage',
    );
  }

  const config: Row = {
    side: side,
    leverage: leverage,
    maxNotional: Math.min(
      rowA.maxNotional ?? Infinity,
      rowB.maxNotional ?? Infinity,
    ),
    minAmount: Math.max(rowA.minAmount ?? 0, rowB.minAmount ?? 0),
    maxAmount: Math.min(rowA.maxAmount ?? Infinity, rowB.maxAmount ?? Infinity),
    precision: Math.min(rowA.precision ?? Infinity, rowB.precision ?? Infinity),
    maxLeverageDeltaGlobalNotional: Math.min(
      rowA.maxLeverageDeltaGlobalNotional ?? Infinity,
      rowB.maxLeverageDeltaGlobalNotional ?? Infinity,
    ),
    maxLeverageLongGlobalNotional: Math.min(
      rowA.maxLeverageLongGlobalNotional ?? Infinity,
      rowB.maxLeverageLongGlobalNotional ?? Infinity,
    ),
    maxLeverageShortGlobalNotional: Math.min(
      rowA.maxLeverageShortGlobalNotional ?? Infinity,
      rowB.maxLeverageShortGlobalNotional ?? Infinity,
    ),
    imA: Math.max(rowA.imA ?? 0, rowB.imA ?? 0),
    imB: Math.max(rowA.imB ?? 0, rowB.imB ?? 0),
    dfA: Math.max(rowA.dfA ?? 0, rowB.dfA ?? 0),
    dfB: Math.max(rowA.dfB ?? 0, rowB.dfB ?? 0),
    ir: Math.max(rowA.ir ?? 0, rowB.ir ?? 0),
    expiryA: Math.max(rowA.expiryA ?? 0, rowB.expiryA ?? 0),
    expiryB: Math.max(rowA.expiryB ?? 0, rowB.expiryB ?? 0),
    timeLockA: Math.max(rowA.timeLockA ?? 0, rowB.timeLockA ?? 0),
    timeLockB: Math.max(rowA.timeLockB ?? 0, rowB.timeLockB ?? 0),
    maxConfidence: Math.min(
      rowA.maxConfidence ?? Infinity,
      rowB.maxConfidence ?? Infinity,
    ),
    maxDelay: Math.min(rowA.maxDelay ?? Infinity, rowB.maxDelay ?? Infinity),
    forceCloseType: Math.min(
      rowA.forceCloseType ?? Infinity,
      rowB.forceCloseType ?? Infinity,
    ),
    kycType: Math.min(rowA.kycType ?? Infinity, rowB.kycType ?? Infinity),
    cType: Math.min(rowA.cType ?? Infinity, rowB.cType ?? Infinity),
    kycAddress: rowA.kycAddress ?? rowB.kycAddress ?? '',
    type: rowA.type ?? rowB.type ?? '',
    brokerFee: (rowA.brokerFee ?? 0) + (rowB.brokerFee ?? 0),
    funding:
      (rowA.funding ?? 0) +
      (rowB.isAPayingApr ? -(rowB.funding ?? 0) : rowB.funding ?? 0),
    isAPayingApr: rowA.isAPayingApr ?? false,
  };

  return config;
}

export {
  getFieldFromAsset,
  getPairConfig,
  getAllProxyTickers,
  adjustQuantities,
  writeProxyTickersToFile,
};
