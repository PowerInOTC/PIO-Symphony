import fs from 'fs';
import { Asset, Row } from './types/config';

interface SymphonyJSON {
  assets: Asset[];
}

/**
 * @dev Processes the Symphony JSON file and returns an array of assets.
 * @param symphonyJSONPath - The path to the Symphony JSON file.
 * @returns An array of assets parsed from the JSON file.
 */
export function processSymphonyJSON(symphonyJSONPath: string): Asset[] {
  const rawData = fs.readFileSync(symphonyJSONPath, 'utf-8');
  const jsonData: SymphonyJSON = JSON.parse(rawData);
  return jsonData.assets;
}

const symphonyJSONPath = './symphony.json';
export const symbolList: Asset[] = processSymphonyJSON(symphonyJSONPath);

/**
 * @dev Symbol cache to store previously validated symbols for faster lookup.
 * The cache is implemented as a Set to ensure unique symbols and provide
 * constant-time lookup and insertion.
 */
let symbolCache: Set<string> = new Set();
let symbolCacheTimestamp: number = 0;

/**
 * @dev Retrieves the broker from the asset based on the proxy ticker.
 * @param proxyTicker - The proxy ticker of the asset.
 * @returns The broker associated with the asset, or undefined if not found.
 */
export function getBrokerFromAsset(proxyTicker: string): string | undefined {
  const asset = symbolList.find((a) => a.proxyTicker === proxyTicker);
  if (asset) {
    return asset.broker;
  }
  return undefined;
}

/**
 * @dev Checks if a given symbol is valid.
 * @param symbol - The symbol to validate.
 * @returns True if the symbol is valid, false otherwise.
 */
export function isValidSymbol(symbol: string): boolean {
  if (symbolCache.has(symbol)) {
    return true;
  }

  const asset = symbolList.find((a) => a.proxyTicker === symbol);
  if (asset) {
    symbolCache.add(symbol);
    return true;
  }

  // Check if the symbol is "crypto.BTCUSD" or "crypto.ETHUSD"
  const isCryptoSymbol =
    symbol === 'crypto.BTCUSD' || symbol === 'crypto.ETHUSD';
  if (isCryptoSymbol) {
    return true;
  }

  return false;
}

/**
 * @dev Verifies if all symbols in the input string are valid.
 * @param input - The input string containing symbols separated by '/'.
 * @returns True if all symbols are valid, false otherwise.
 */
export function verifySymbols(input: string): boolean {
  const symbols = input.split('/');
  return symbols.every((symbol) => isValidSymbol(symbol));
}

export function getFieldFromAsset(
  broker: string,
  proxyTicker: string,
  side: string,
  leverage: number,
  notional: number,
): Row | undefined {
  const asset = symbolList.find(
    (a) => a.broker === broker && a.proxyTicker === proxyTicker,
  );
  if (leverage < 1) {
    leverage = 1;
  }
  if (asset) {
    const row = asset.notional?.find(
      (r) =>
        r.side === side &&
        r.leverage === leverage &&
        (r.maxNotional ?? Infinity) > notional,
    );

    return row;
  }
  return undefined;
}

export function getMT5Ticker(proxyTicker: string): string | undefined {
  const asset = symbolList.find((a) => a.proxyTicker === proxyTicker);
  if (asset) {
    return asset.mt5Ticker;
  }
  return undefined;
}

export function getProxyTicker(mt5Ticker: string) {
  const asset = symbolList.find((a) => a.mt5Ticker === mt5Ticker);
  if (asset) {
    return asset.proxyTicker;
  }
  return undefined;
}

export function findAssetByProxyTicker(proxyTicker: string): Asset | undefined {
  return symbolList.find((a) => a.proxyTicker === proxyTicker);
}

export function getAllocatedBroker(proxyTicker: string): string | undefined {
  const asset = symbolList.find((a) => a.proxyTicker === proxyTicker);
  if (!asset) {
    return undefined;
  }
  return asset.broker;
}

export function getAllProxyTickers(): string[] {
  if (!Array.isArray(symbolList)) {
    throw new Error('symbolList is not an array');
  }
  return symbolList.map((a) => a.proxyTicker);
}

export function writeProxyTickersToFile(): void {
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

export function getMaxNotionalForMaxLeverage(
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

export function adjustQuantities(
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

export function getPairConfig(
  tickerA: string,
  tickerB: string,
  side: string,
  leverage: number,
  notional: number,
): Row {
  //console.log(tickerA, tickerB, side, leverage, notional);

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
