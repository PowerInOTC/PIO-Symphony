import * as fs from 'fs';
import axios from 'axios';
const dotenv = require('dotenv');
dotenv.config();

const apiBaseUrl = process.env.FAST_API;
import {
  getTotalOpenAmount,
  retrieveLatestTick,
  retrieveAllSymbols,
  manageSymbolInventory,
  resetAccount,
  retrieveMaxNotional,
  minAmountSymbol,
  symbolInfo,
  precisionInfo,
  fundingLongInfo,
  fundingShortInfo,
  minAmountAssetInfo,
  maxAmountAssetInfo,
} from '../broker/dispatcher';

interface MT5SymbolList {
  assets: Asset[];
}

function processSymphonyJSON(symphonyJSONPath: string): MT5SymbolList {
  const rawData = fs.readFileSync(symphonyJSONPath, 'utf-8');
  return JSON.parse(rawData) as MT5SymbolList;
}

function backupSymphonyJSON(symphonyJSONPath: string): void {
  const backupFolder = 'backups';
  if (!fs.existsSync(backupFolder)) {
    fs.mkdirSync(backupFolder);
  }

  const backupFiles: string[] = fs.readdirSync(backupFolder);
  let maxBackupNumber = 0;

  backupFiles.forEach((file: string) => {
    const match = file.match(/symphony_backup(\d+)\.json/);
    if (match) {
      const backupNumber = parseInt(match[1]);
      if (backupNumber > maxBackupNumber) {
        maxBackupNumber = backupNumber;
      }
    }
  });

  const backupNumber = maxBackupNumber + 1;
  const backupPath = `${backupFolder}/symphony_backup${backupNumber}.json`;
  fs.copyFileSync(symphonyJSONPath, backupPath);

  const backupInfo = { path: backupPath, timestamp: new Date().toISOString() };
  const backupInfoString = JSON.stringify(backupInfo, null, 2);

  fs.appendFileSync('backdup.json', backupInfoString + '\n');
}

function updateSymphonyJSON(
  symphonyJSONPath: string,
  mt5SymbolList: MT5SymbolList,
): void {
  const symphonyJSONData = JSON.stringify(mt5SymbolList, null, 2);
  fs.writeFileSync(symphonyJSONPath, symphonyJSONData);
}

const symphonyJSONPath: string = './symphony.json';
const mt5SymbolList: MT5SymbolList = processSymphonyJSON(symphonyJSONPath);

async function symbolStartsWithForex(symbol: string): Promise<boolean> {
  try {
    const response = await axios.get(apiBaseUrl + '/symbol_info/' + symbol);
    console.log(apiBaseUrl);
    const symbolInfo = response.data;
    const lastElement = symbolInfo[symbolInfo.length - 1];
    return typeof lastElement === 'string' && lastElement.startsWith('Forex');
  } catch (error) {
    console.error('Error retrieving symbol info:', error);
    return false;
  }
}

function createFieldInAsset(
  mt5SymbolList: MT5SymbolList,
  broker: string,
  proxyTicker: string,
  key: NotionalKey,
  fieldName: keyof Row,
  fieldValue: Row[keyof Row],
): void {
  const asset = mt5SymbolList.assets.find(
    (a) => a.broker === broker && a.proxyTicker === proxyTicker,
  );

  if (asset) {
    const notionalRow = asset.notional?.find(
      (r) => r.side === key.side && r.leverage === key.leverage,
    );

    if (!notionalRow) {
      const newRow: Row = {
        ...key,
        [fieldName]: fieldValue,
      } as Row;
      asset.notional = asset.notional || [];
      asset.notional.push(newRow);
    } else {
      console.warn(
        `Combination of side: ${key.side} and leverage: ${key.leverage} already exists for broker: ${broker}, proxyTicker: ${proxyTicker}`,
      );
    }
  } else {
    const newAsset: Asset = {
      mt5Ticker: '',
      proxyTicker,
      broker,
      notional: [
        {
          ...key,
          [fieldName]: fieldValue,
        } as Row,
      ],
    };
    mt5SymbolList.assets.push(newAsset);
  }
}

function addFieldToAsset(
  mt5SymbolList: MT5SymbolList,
  broker: string,
  proxyTicker: string,
  key: NotionalKey,
  fieldName: keyof Row,
  fieldValue: Row[keyof Row] | undefined,
): void {
  const asset = mt5SymbolList.assets.find(
    (a) => a.broker === broker && a.proxyTicker === proxyTicker,
  );

  if (asset) {
    const notionalRow = asset.notional?.find(
      (r) => r.side === key.side && r.leverage === key.leverage,
    );

    if (notionalRow) {
      if (fieldValue !== undefined) {
        (notionalRow[fieldName] as Row[keyof Row]) = fieldValue;
      } else {
        delete notionalRow[fieldName];
      }
    } else {
      const newRow: Row = {
        ...key,
        [fieldName]: fieldValue,
      } as Row;
      asset.notional = asset.notional || [];
      asset.notional.push(newRow);
    }
  } else {
    console.warn(
      `Asset not found for broker: ${broker}, proxyTicker: ${proxyTicker}`,
    );
  }
}

function getFieldFromAsset(
  mt5SymbolList: MT5SymbolList,
  broker: string,
  proxyTicker: string,
  key: NotionalKey,
  fieldName: keyof Row,
): Row[keyof Row] | undefined {
  const asset = mt5SymbolList.assets.find(
    (a) => a.broker === broker && a.proxyTicker === proxyTicker,
  );

  if (asset) {
    const notionalRow = asset.notional?.find(
      (r) => r.side === key.side && r.leverage === key.leverage,
    );

    if (notionalRow && notionalRow[fieldName] !== undefined) {
      return notionalRow[fieldName];
    }
  }

  return undefined;
}

function forEachAsset(
  mt5SymbolList: MT5SymbolList,
  callback: (asset: Asset, broker: string, proxyTicker: string) => void,
): void {
  mt5SymbolList.assets.forEach((asset) => {
    callback(asset, asset.broker, asset.proxyTicker);
  });
}

function forEachNotionalKey(
  asset: Asset,
  callback: (key: NotionalKey, notionalRow: Row) => void,
): void {
  asset.notional?.forEach((notionalRow) => {
    const key: NotionalKey = {
      side: notionalRow.side,
      leverage: notionalRow.leverage,
    };
    callback(key, notionalRow);
  });
}

function getHedgerForProxyTicker(
  mt5SymbolList: MT5SymbolList,
  proxyTicker: string,
): string | undefined {
  const asset = mt5SymbolList.assets.find((a) => a.proxyTicker === proxyTicker);
  return asset?.broker;
}

function processAssetByHedger(
  mt5SymbolList: MT5SymbolList,
  proxyTicker: string,
  hedgerFunctions: Record<string, (asset: Asset) => void>,
): void {
  const hedger = getHedgerForProxyTicker(mt5SymbolList, proxyTicker);
  if (hedger && hedgerFunctions[hedger]) {
    const asset = mt5SymbolList.assets.find(
      (a) => a.proxyTicker === proxyTicker,
    );
    if (asset) {
      hedgerFunctions[hedger](asset);
    }
  }
}

function getMt5TickerForProxyTicker(
  mt5SymbolList: MT5SymbolList,
  proxyTicker: string,
): string | undefined {
  const asset = mt5SymbolList.assets.find((a) => a.proxyTicker === proxyTicker);
  return asset?.mt5Ticker;
}

async function processAllAssets(mt5SymbolList: {
  assets: Asset[];
}): Promise<void> {
  const sides = ['long', 'short'];
  const leverageValues = [1, 5, 10, 25, 50, 100, 250, 500];
  const broker = 'mt5.ICMarkets';

  //const assetsToProcess = mt5SymbolList.assets.slice(0, 2); // Process only the first 2 assets for test
  const assetsToProcess = mt5SymbolList.assets;

  for (const asset of assetsToProcess) {
    if (asset.broker === broker) {
      console.log(
        `Processing Asset: broker=${broker}, proxyTicker=${asset.proxyTicker}`,
      );
      const rows: Row[] = [];

      for (const side of sides) {
        for (const leverage of leverageValues) {
          const funding =
            side == 'long'
              ? await fundingLongInfo(asset.mt5Ticker, broker)
              : await fundingShortInfo(asset.mt5Ticker, broker);
          const isAPayingApr = side == 'long' ? true : false;
          const expiryA = side == 'long' ? 60 : 1440 * 30 * 3;
          const expiryB = side == 'long' ? 1440 * 30 * 3 : 60;

          const row: Row = {
            side: side,
            leverage: leverage,
            maxNotional: 100,
            minAmount: await minAmountAssetInfo(asset.mt5Ticker, broker),
            maxAmount: await maxAmountAssetInfo(asset.mt5Ticker, broker),
            precision: await precisionInfo(asset.mt5Ticker, broker),
            maxLeverageDeltaGlobalNotional: 10000000,
            maxLeverageLongGlobalNotional: 2000000,
            maxLeverageShortGlobalNotional: 1500000,
            imA: 0.75 / leverage,
            imB: 0.75 / leverage,
            dfA: 0.25 / leverage,
            dfB: 0.25 / leverage,
            expiryA: expiryA,
            expiryB: expiryB,
            timeLockA: 1440 * 30 * 3,
            timeLockB: 1440 * 30 * 3,
            maxConfidence: 1,
            maxDelay: 60000,
            forceCloseType: 1,
            kycType: 1,
            cType: 1,
            kycAddress: '0x0000000000000000000000000000000000000000',
            brokerFee: 0.0003,
            funding: funding,
            isAPayingApr: isAPayingApr,
          };

          rows.push(row);
        }
      }

      asset.notional = rows;

      // Rate limit: Wait for 1 second before processing the next asset
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function reprocessFunding(mt5SymbolList: {
  assets: Asset[];
}): Promise<void> {
  const broker = 'mt5.ICMarkets';

  for (const asset of mt5SymbolList.assets) {
    if (asset.broker === broker && asset.notional) {
      console.log(
        `Reprocessing funding for Asset: broker=${broker}, proxyTicker=${asset.proxyTicker}`,
      );

      for (const row of asset.notional) {
        const funding = row.funding;

        if (typeof funding !== 'undefined') {
          if (row.side === 'long') {
            if (funding < 0) {
              row.isAPayingApr = true;
            } else {
              row.isAPayingApr = false;
            }
          } else {
            if (funding < 0) {
              row.isAPayingApr = false;
            } else {
              row.isAPayingApr = true;
            }
          }
          row.funding = Math.abs(funding) / 100;
        }
      }
    }
  }
}


async function main() {
  backupSymphonyJSON(symphonyJSONPath);
  //////////////////////////////////////
  //////////////////////////////////////
  // Code here
  //await processAllAssets(mt5SymbolList);
  await reprocessFunding(mt5SymbolList);

  //////////////////////////////////////
  //////////////////////////////////////
  updateSymphonyJSON(symphonyJSONPath, mt5SymbolList);
}
*/
///main();

interface NotionalKey {
    side: string;
    leverage: number;
  }
  
  interface Row extends NotionalKey {
    maxNotional?: number;
    minAmount?: number;
    maxAmount?: number;
    precision?: number;
    maxLeverageDeltaGlobalNotional?: number;
    maxLeverageLongGlobalNotional?: number;
    maxLeverageShortGlobalNotional?: number;
    imA?: number;
    imB?: number;
    dfA?: number;
    dfB?: number;
    ir?: number;
    expiryA?: number;
    expiryB?: number;
    timeLockA?: number;
    timeLockB?: number;
    maxConfidence?: number;
    maxDelay?: number;
    forceCloseType?: number;
    kycType?: number;
    cType?: number;
    kycAddress?: string;
    type?: string;
    brokerFee?: number;
    funding?: number;
    isAPayingApr?: boolean;
  }
  
  interface Asset {
    mt5Ticker: string;
    proxyTicker: string;
    broker: string;
    fmpTicker?: string;
    tiingoTicker?: string;
    alpacaTicker?: string;
    tradingViewId?: string;
    precision?: number;
    active?: boolean;
    notional?: Row[];
  }

  
export { Row, Asset };
