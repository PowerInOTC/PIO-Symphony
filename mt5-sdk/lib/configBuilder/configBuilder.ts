import * as fs from 'fs';
import axios from 'axios';
const dotenv = require('dotenv');
dotenv.config();

const fastApiUrl = process.env.FAST_API;

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

function updateSymphonyJSON(symphonyJSONPath: string, mt5SymbolList: MT5SymbolList): void {
    const symphonyJSONData = JSON.stringify(mt5SymbolList, null, 2);
    fs.writeFileSync(symphonyJSONPath, symphonyJSONData);
}

const symphonyJSONPath: string = 'symphony.json';
const mt5SymbolList: MT5SymbolList = processSymphonyJSON(symphonyJSONPath);
backupSymphonyJSON(symphonyJSONPath);
addTypeField(mt5SymbolList);
updateSymphonyJSON(symphonyJSONPath, mt5SymbolList);

async function symbolStartsWithForex(symbol: string): Promise<boolean> {
    try {
        const response = await axios.get(fastApiUrl + '/symbol_info/' + symbol);
        const symbolInfo = response.data;
        const lastElement = symbolInfo[symbolInfo.length - 1];
        return typeof lastElement === 'string' && lastElement.startsWith('Forex');
    } catch (error) {
        console.error('Error retrieving symbol info:', error);
        return false;
    }
}


interface Asset {
    mt5Ticker: string;
    proxyTicker: string;
    broker: string;
    fmpTicker?: string;
    tiingoTicker?: string;
    alpacaTicker?: string;
    tradingViewId?: string;
    notional?: Notional[];
}

interface Notional { 
    side: string;
    leverage: number;
    minNotional?: number;
    maxNotional?: number;
    minAmount?: number;
    maxAmount?: number;
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
    brokerMinimalNotional?: number;
    brokerFee?: number;
}

function addTypeField(mt5SymbolList: MT5SymbolList): void {
    mt5SymbolList.assets.forEach((asset: Asset) => {
        addRow(mt5SymbolList, 'long', 100);
    });
}

function addRow(mt5SymbolList: MT5SymbolList, side: string, leverage: number): void {
    mt5SymbolList.assets.forEach((asset: Asset) => {
        if (asset.broker.startsWith('mt5')) {
            if (!asset.notional) {
                asset.notional = [];
            }

            const notionalExists = asset.notional.some(notional => notional.side === side && notional.leverage === leverage);

            if (!notionalExists) {
                asset.notional.push({
                    side: side,
                    leverage: leverage,
                });
            }
        }
    });
}




// configBuilder.ts

// configBuilder.getMt5Symbols()
        // configBuilder.testMt5SymbolOnProxy(symbolMt5)
        // if true then
            // configBuilder.addAsset(asset)
            // configBuilder.addHedgerToAsset(hedger, asset)


// configBuilder.getPionerSymbolFromMt5Symbol(symbolMt5)
// configBuilder.testMt5SymbolOnProxy(symbolMt5)

// configBuilder.addAsset(asset)
// configBuilder.removeAsset(asset)
// configBuilder.getAsset(asset)

// configBuilder.addHedger(hedger)
// configBuilder.removeHedger(hedger)
// configBuilder.getHedger(hedger)

// configBuilder.addHedgerToAsset(hedger, asset)
// configBuilder.removeHedgerToAsset(hedger, asset)
// configBuilder.getHedgerToAsset(hedger, asset)