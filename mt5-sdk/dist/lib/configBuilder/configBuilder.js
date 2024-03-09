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
const fastApiUrl = process.env.FAST_API;
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
backupSymphonyJSON(symphonyJSONPath);
addTypeField(mt5SymbolList);
updateSymphonyJSON(symphonyJSONPath, mt5SymbolList);
async function symbolStartsWithForex(symbol) {
    try {
        const response = await axios_1.default.get(fastApiUrl + '/symbol_info/' + symbol);
        const symbolInfo = response.data;
        const lastElement = symbolInfo[symbolInfo.length - 1];
        return typeof lastElement === 'string' && lastElement.startsWith('Forex');
    }
    catch (error) {
        console.error('Error retrieving symbol info:', error);
        return false;
    }
}
function addTypeField(mt5SymbolList) {
    mt5SymbolList.assets.forEach((asset) => {
        addRow(mt5SymbolList, 'long', 100);
    });
}
function addRow(mt5SymbolList, side, leverage) {
    mt5SymbolList.assets.forEach((asset) => {
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
