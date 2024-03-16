"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const axios_1 = __importDefault(require("axios"));
const dotenv = require('dotenv');
dotenv.config();
const apiBaseUrl = process.env.FAST_API;
async function getTotalOpenAmount(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/get_total_open_amount/${symbol}`)).data.total_open_amount;
            }
            catch (error) {
                console.error('Error retrieving total open amount:', error);
                return 0;
            }
        default:
            console.error('Unsupported broker for getTotalOpenAmount');
            return 0;
    }
}
async function retrieveLatestTick(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/retrieve_latest_tick/${symbol}`)).data;
            }
            catch (error) {
                console.error('Error retrieving latest tick:', error);
                return { bid: 0, ask: 0 };
            }
        default:
            console.error('Unsupported broker for retrieveLatestTick');
            return { bid: 0, ask: 0 };
    }
}
async function retrieveAllSymbols(broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/retrieve_all_symbols`)).data.symbols;
            }
            catch (error) {
                console.error('Error retrieving all symbols:', error);
                return [];
            }
        default:
            console.error('Unsupported broker for retrieveAllSymbols');
            return [];
    }
}
async function manageSymbolInventory(symbol, amount, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.post(`${apiBaseUrl}/manage_symbol_inventory/${symbol}`, { amount })).status === 200;
            }
            catch (error) {
                console.error('Error managing symbol inventory:', error);
                return false;
            }
        default:
            console.error('Unsupported broker for manageSymbolInventory');
            return false;
    }
}
async function resetAccount(broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.post(`${apiBaseUrl}/reset_account`)).status === 200;
            }
            catch (error) {
                console.error('Error resetting account:', error);
                return false;
            }
        default:
            console.error('Unsupported broker for resetAccount');
            return false;
    }
}
async function retrieveMaxNotional(broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/retrieve_max_notional`)).data.max_notional;
            }
            catch (error) {
                console.error('Error retrieving max notional:', error);
                return 0;
            }
        default:
            console.error('Unsupported broker for retrieveMaxNotional');
            return 0;
    }
}
async function minAmountSymbol(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/min_amount_symbol/${symbol}`)).data.min_amount;
            }
            catch (error) {
                console.error('Error retrieving minimum amount:', error);
                return 0;
            }
        default:
            console.error('Unsupported broker for minAmountSymbol');
            return 0;
    }
}
async function symbolInfo(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/symbol_info/${symbol}`)).data;
            }
            catch (error) {
                console.error('Error retrieving symbol info:', error);
                return null;
            }
        default:
            console.error('Unsupported broker for symbolInfo');
            return null;
    }
}
async function precisionInfo(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/precision_info/${symbol}`)).data;
            }
            catch (error) {
                console.error('Error retrieving precision info:', error);
                return 0;
            }
        default:
            console.error('Unsupported broker for precisionInfo');
            return 0;
    }
}
async function fundingLongInfo(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/funding_long_info/${symbol}`)).data;
            }
            catch (error) {
                console.error('Error retrieving funding long info:', error);
                return 0;
            }
        default:
            console.error('Unsupported broker for fundingLongInfo');
            return 0;
    }
}
async function fundingShortInfo(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/funding_short_info/${symbol}`)).data;
            }
            catch (error) {
                console.error('Error retrieving funding short info:', error);
                return 0;
            }
        default:
            console.error('Unsupported broker for fundingShortInfo');
            return 0;
    }
}
async function minAmountAssetInfo(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/min_ammount_asset_info/${symbol}`)).data;
            }
            catch (error) {
                console.error('Error retrieving minimum amount asset info:', error);
                return 0;
            }
        default:
            console.error('Unsupported broker for minAmountAssetInfo');
            return 0;
    }
}
async function maxAmountAssetInfo(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/max_ammount_asset_info/${symbol}`)).data;
            }
            catch (error) {
                console.error('Error retrieving maximum amount asset info:', error);
                return 0;
            }
        default:
            console.error('Unsupported broker for maxAmountAssetInfo');
            return 0;
    }
}
function processSymphonyJSON(symphonyJSONPath) {
    const rawData = fs.readFileSync(symphonyJSONPath, 'utf-8');
    return JSON.parse(rawData);
}
function backupSymphonyJSON(symphonyJSONPath) {
    const backupFolder = 'backups';
    if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder);
    }
    const backupFiles = fs.readdirSync(backupFolder);
    let maxBackupNumber = 0;
    backupFiles.forEach((file) => {
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
function updateSymphonyJSON(symphonyJSONPath, mt5SymbolList) {
    const symphonyJSONData = JSON.stringify(mt5SymbolList, null, 2);
    fs.writeFileSync(symphonyJSONPath, symphonyJSONData);
}
const symphonyJSONPath = 'symphony.json';
const mt5SymbolList = processSymphonyJSON(symphonyJSONPath);
async function symbolStartsWithForex(symbol) {
    try {
        const response = await axios_1.default.get(apiBaseUrl + '/symbol_info/' + symbol);
        console.log(apiBaseUrl);
        const symbolInfo = response.data;
        const lastElement = symbolInfo[symbolInfo.length - 1];
        return typeof lastElement === 'string' && lastElement.startsWith('Forex');
    }
    catch (error) {
        console.error('Error retrieving symbol info:', error);
        return false;
    }
}
function createFieldInAsset(mt5SymbolList, broker, proxyTicker, key, fieldName, fieldValue) {
    const asset = mt5SymbolList.assets.find((a) => a.broker === broker && a.proxyTicker === proxyTicker);
    if (asset) {
        const notionalRow = asset.notional?.find((r) => r.side === key.side && r.leverage === key.leverage);
        if (!notionalRow) {
            const newRow = {
                ...key,
                [fieldName]: fieldValue,
            };
            asset.notional = asset.notional || [];
            asset.notional.push(newRow);
        }
        else {
            console.warn(`Combination of side: ${key.side} and leverage: ${key.leverage} already exists for broker: ${broker}, proxyTicker: ${proxyTicker}`);
        }
    }
    else {
        const newAsset = {
            mt5Ticker: '',
            proxyTicker,
            broker,
            notional: [
                {
                    ...key,
                    [fieldName]: fieldValue,
                },
            ],
        };
        mt5SymbolList.assets.push(newAsset);
    }
}
function addFieldToAsset(mt5SymbolList, broker, proxyTicker, key, fieldName, fieldValue) {
    const asset = mt5SymbolList.assets.find((a) => a.broker === broker && a.proxyTicker === proxyTicker);
    if (asset) {
        const notionalRow = asset.notional?.find((r) => r.side === key.side && r.leverage === key.leverage);
        if (notionalRow) {
            if (fieldValue !== undefined) {
                notionalRow[fieldName] = fieldValue;
            }
            else {
                delete notionalRow[fieldName];
            }
        }
        else {
            const newRow = {
                ...key,
                [fieldName]: fieldValue,
            };
            asset.notional = asset.notional || [];
            asset.notional.push(newRow);
        }
    }
    else {
        console.warn(`Asset not found for broker: ${broker}, proxyTicker: ${proxyTicker}`);
    }
}
function getFieldFromAsset(mt5SymbolList, broker, proxyTicker, key, fieldName) {
    const asset = mt5SymbolList.assets.find((a) => a.broker === broker && a.proxyTicker === proxyTicker);
    if (asset) {
        const notionalRow = asset.notional?.find((r) => r.side === key.side && r.leverage === key.leverage);
        if (notionalRow && notionalRow[fieldName] !== undefined) {
            return notionalRow[fieldName];
        }
    }
    return undefined;
}
function forEachAsset(mt5SymbolList, callback) {
    mt5SymbolList.assets.forEach((asset) => {
        callback(asset, asset.broker, asset.proxyTicker);
    });
}
function forEachNotionalKey(asset, callback) {
    asset.notional?.forEach((notionalRow) => {
        const key = {
            side: notionalRow.side,
            leverage: notionalRow.leverage,
        };
        callback(key, notionalRow);
    });
}
function getHedgerForProxyTicker(mt5SymbolList, proxyTicker) {
    const asset = mt5SymbolList.assets.find((a) => a.proxyTicker === proxyTicker);
    return asset?.broker;
}
function processAssetByHedger(mt5SymbolList, proxyTicker, hedgerFunctions) {
    const hedger = getHedgerForProxyTicker(mt5SymbolList, proxyTicker);
    if (hedger && hedgerFunctions[hedger]) {
        const asset = mt5SymbolList.assets.find((a) => a.proxyTicker === proxyTicker);
        if (asset) {
            hedgerFunctions[hedger](asset);
        }
    }
}
function getMt5TickerForProxyTicker(mt5SymbolList, proxyTicker) {
    const asset = mt5SymbolList.assets.find((a) => a.proxyTicker === proxyTicker);
    return asset?.mt5Ticker;
}
function processAllAssetsExample(mt5SymbolList) {
    forEachAsset(mt5SymbolList, (asset, broker, proxyTicker) => {
        console.log(`Processing Asset: broker=${broker}, proxyTicker=${proxyTicker}`);
        forEachNotionalKey(asset, (key, notionalRow) => {
            console.log(`  NotionalKey: side=${key.side}, leverage=${key.leverage}`);
            // Process each notional row
            // ...
        });
    });
}
async function processAllAssets(mt5SymbolList) {
    const sides = ['long', 'short'];
    const leverageValues = [1, 5, 10, 25, 50, 100, 250, 500];
    const broker = 'mt5.ICMarkets';
    //const assetsToProcess = mt5SymbolList.assets.slice(0, 2); // Process only the first 2 assets for test
    const assetsToProcess = mt5SymbolList.assets;
    for (const asset of assetsToProcess) {
        if (asset.broker === broker) {
            console.log(`Processing Asset: broker=${broker}, proxyTicker=${asset.proxyTicker}`);
            const rows = [];
            for (const side of sides) {
                for (const leverage of leverageValues) {
                    const funding = side == 'long' ? await fundingLongInfo(asset.mt5Ticker, broker) : await fundingShortInfo(asset.mt5Ticker, broker);
                    const isAPayingApr = side == 'long' ? true : false;
                    const expiryA = side == 'long' ? 60 : 1440 * 30 * 3;
                    const expiryB = side == 'long' ? 1440 * 30 * 3 : 60;
                    const row = {
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
                        ir: 0.01,
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
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}
async function main() {
    backupSymphonyJSON(symphonyJSONPath);
    ////////////////////////////////////// 
    ////////////////////////////////////// 
    // Code here
    await processAllAssets(mt5SymbolList);
    ////////////////////////////////////// 
    ////////////////////////////////////// 
    updateSymphonyJSON(symphonyJSONPath, mt5SymbolList);
}
main();
/*

processAllAssets(mt5SymbolList);
*/
/*

const key: NotionalKey = {
    side: 'LONG',
    leverage: 10,
};
const fieldName: keyof Row = 'maxConfidence';
const fieldValue = 0.8;

addFieldToAsset(mt5SymbolList, broker, proxyTicker, key, fieldName, fieldValue);
updateSymphonyJSON(symphonyJSONPath, mt5SymbolList);

const retrievedValue = getFieldFromAsset(mt5SymbolList, broker, proxyTicker, key, fieldName);
console.log(`Retrieved value: ${retrievedValue}`);

*/
// make a function that takes a proxyTicker and get it's hedger
// make a metaFunction that redirect subFunciton based on hedger name.
// make a symbol that gets mt5Ticker for it's proxyTicker
// configBuilder.getPionerSymbolFromMt5Symbol(symbolMt5)
// configBuilder.testMt5SymbolOnProxy(symbolMt5)
// configBuilder.addHedger(hedger)
// configBuilder.removeHedger(hedger)
// configBuilder.getHedger(hedger)
// configBuilder.addHedgerToAsset(hedger, asset)
// configBuilder.removeHedgerToAsset(hedger, asset)
