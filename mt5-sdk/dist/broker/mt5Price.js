"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMT5LatestPrice = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const configRead_1 = require("../config/configRead");
const pairCache = {};
async function fetchCacheData(proxyPair) {
    const [proxyTicker1, proxyTicker2] = proxyPair.split('/');
    const mt5Ticker1 = (0, configRead_1.getMT5Ticker)(proxyTicker1);
    const mt5Ticker2 = (0, configRead_1.getMT5Ticker)(proxyTicker2);
    if (!mt5Ticker1 || !mt5Ticker2) {
        return { bid: 0, ask: 0 };
    }
    const [tick1, tick2] = await Promise.all([
        retrieveLatestTick(mt5Ticker1),
        retrieveLatestTick(mt5Ticker2),
    ]);
    if (tick1.bid && tick1.ask && tick2.bid && tick2.ask) {
        const bid = tick1.bid / tick2.bid;
        const ask = tick1.ask / tick2.ask;
        return { bid, ask };
    }
    console.warn(`Unable to retrieve prices for pair: ${proxyPair}. Setting bid and ask to 0.`);
    return { bid: 0, ask: 0 };
}
function startOrUpdatePair(proxyPair, expirationTime) {
    pairCache[proxyPair] = {
        expiration: expirationTime,
        cached: pairCache[proxyPair]?.cached,
    };
}
async function getMT5LatestPrice(proxyPair) {
    const currentTime = Date.now();
    const expirationTime = currentTime + 2000;
    if (pairCache[proxyPair] && pairCache[proxyPair].cached) {
        startOrUpdatePair(proxyPair, expirationTime);
        return pairCache[proxyPair].cached;
    }
    const cacheData = await fetchCacheData(proxyPair);
    startOrUpdatePair(proxyPair, expirationTime);
    pairCache[proxyPair].cached = cacheData;
    if (cacheData.bid === 0 && cacheData.ask === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return getMT5LatestPrice(proxyPair);
    }
    return cacheData;
}
exports.getMT5LatestPrice = getMT5LatestPrice;
async function updateCacheData() {
    const currentTime = Date.now();
    const updatePrices = async (retryCount = 0) => {
        try {
            for (const proxyPair in pairCache) {
                if (pairCache[proxyPair].expiration > currentTime) {
                    const cacheData = await fetchCacheData(proxyPair);
                    pairCache[proxyPair].cached = cacheData;
                }
            }
        }
        catch (error) {
            console.error('Error updating cache data:', error);
            if (retryCount < 3) {
                console.info(`Retrying updateCacheData (attempt ${retryCount + 1})...`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                await updatePrices(retryCount + 1);
            }
            else {
                console.error('Max retry attempts reached. Skipping cache update.');
            }
        }
    };
    await updatePrices();
}
async function retrieveLatestTick(mt5Ticker) {
    try {
        const response = await axios_1.default.get(`${config_1.config.apiBaseUrl}/retrieve_latest_tick/${mt5Ticker}`);
        return response.data;
    }
    catch (error) {
        console.error(`Error retrieving latest tick for ${mt5Ticker}:`, error);
        return { bid: 0, ask: 0 };
    }
}
setInterval(updateCacheData, 1000);
