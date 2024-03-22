"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const proxyCall_1 = require("./proxyCall");
const promises_1 = require("fs/promises");
const config_1 = require("../config");
const apiBaseUrl = config_1.config.fastApiHost;
let callCount = 0;
const callLimit = 100;
const callInterval = 60 * 1000;
let lastCallTime = 0;
async function symbolStartsWithForex(symbol) {
    try {
        const response = await axios_1.default.get(apiBaseUrl + '/symbol_info/' + symbol);
        const symbolInfo = response.data;
        const lastElement = symbolInfo[symbolInfo.length - 1];
        return typeof lastElement === 'string' && lastElement.startsWith('Forex');
    }
    catch (error) {
        console.error('Error retrieving symbol info:', error);
        return false;
    }
}
async function testProxySymbol(symbol) {
    const abPrecision = 5;
    const confPrecision = 5;
    const maxtimestampdiff = 200000;
    console.log('Testing ' + symbol);
    try {
        let price;
        let maxRetry = 3;
        while ((!price || price.pairBid === undefined) && maxRetry > 0) {
            price = await (0, proxyCall_1.makeApiCalls)(maxtimestampdiff, abPrecision, confPrecision, symbol, symbol);
            maxRetry--;
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        if (price.pairBid === undefined) {
            console.log(symbol + ' is not available on the proxy');
        }
        return price.pairBid === 1;
    }
    catch (error) {
        return false;
    }
}
async function retrieveAllSymbols() {
    try {
        const response = await axios_1.default.get(apiBaseUrl + '/retrieve_all_symbols');
        const symbols = response.data.symbols;
        const assets = [];
        const broker = 'mt5.ICMarkets';
        for (const symbol of symbols) {
            let mt5Ticker, proxyTicker;
            if (callCount >= callLimit) {
                const currentTime = new Date().getTime();
                const elapsedTime = currentTime - lastCallTime;
                if (elapsedTime < callInterval) {
                    const waitTime = callInterval - elapsedTime;
                    await new Promise((resolve) => setTimeout(resolve, waitTime));
                }
                callCount = 0;
                lastCallTime = new Date().getTime();
            }
            if (symbol.endsWith('.NAS')) {
                const name = 'stock.nasdaq.' + symbol.replace('.NAS', '');
                mt5Ticker = symbol;
                proxyTicker = name;
                const isProxy = await testProxySymbol(proxyTicker);
                if (isProxy) {
                    assets.push({ mt5Ticker, proxyTicker, broker });
                }
            }
            else if (symbol.endsWith('.NYSE')) {
                const name = 'stock.nyse.' + symbol.replace('.NYSE', '');
                mt5Ticker = symbol;
                proxyTicker = name;
                const isProxy = await testProxySymbol(proxyTicker);
                if (isProxy) {
                    assets.push({ mt5Ticker, proxyTicker, broker });
                }
            } /* else if (symbol.endsWith('.MAD')) {
                    const name = 'stock.euronext.' + symbol.replace('.MAD', '.MD');
                    mt5Ticker = symbol;
                    proxyTicker = name;
                } else if (symbol.endsWith('.PAR')) {
                    const name = 'stock.euronext.' + symbol.replace('.PAR', '.PA');
                    mt5Ticker = symbol;
                    proxyTicker = name;
                } else if (symbol.endsWith('.AMS')) {
                    const name = 'stock.euronext.' + symbol.replace('.AMS', '.AS');
                    mt5Ticker = symbol;
                    proxyTicker = name;
                } else if (symbol.endsWith('.LSE')) {
                    const name = 'stock.lse.' + symbol.replace('.LSE', '.L');
                    mt5Ticker = symbol;
                    proxyTicker = name;
                } else if (symbol.endsWith('.ETR')) {
                    const name = 'stock.xetra.' + symbol.replace('.ETR', '.DE');
                    mt5Ticker = symbol;
                    proxyTicker = name;
                } */
            else {
                const isForex = await symbolStartsWithForex(symbol);
                if (isForex) {
                    const name = 'forex.' + symbol;
                    mt5Ticker = symbol;
                    proxyTicker = name;
                    const isProxy = await testProxySymbol(proxyTicker);
                    if (isProxy) {
                        assets.push({ mt5Ticker, proxyTicker, broker });
                    }
                }
            }
            callCount++;
        }
        await saveToMt5SymbolList({ assets });
    }
    catch (error) {
        console.error('Error retrieving all symbols:', error);
    }
}
async function saveToMt5SymbolList(data) {
    try {
        const jsonData = JSON.stringify(data, null, 2);
        await (0, promises_1.writeFile)('mt5SymbolList.json', jsonData);
        console.log('Data saved to mt5SymbolList.json successfully.');
    }
    catch (error) {
        console.error('Error saving data to mt5SymbolList.json:', error);
    }
}
retrieveAllSymbols();
