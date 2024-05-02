"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMT5LatestPrice = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const init_1 = require("../utils/init");
const pairCache = {};
async function getMT5LatestPrice(symbolPair, updateSpeedMs, updateLengthMs) {
    const [symbol1, symbol2] = symbolPair.split('/');
    if (pairCache[symbolPair] &&
        pairCache[symbolPair].updateWorker !== undefined) {
        return Promise.resolve({
            bid: pairCache[symbolPair].bid,
            ask: pairCache[symbolPair].ask,
        });
    }
    let latestPrice = null;
    let resolvePromise;
    const pricePromise = new Promise((resolve) => {
        resolvePromise = resolve;
    });
    const maxUpdateCount = Math.floor(updateLengthMs / updateSpeedMs);
    async function updatePrice() {
        let updateCount = 0;
        while (updateCount < maxUpdateCount) {
            try {
                const [tick1, tick2] = await Promise.all([
                    retrieveLatestTick(symbol1),
                    retrieveLatestTick(symbol2),
                ]);
                if (tick1.bid && tick1.ask && tick2.bid && tick2.ask) {
                    const bidRatio = tick1.bid / tick2.bid;
                    const askRatio = tick1.ask / tick2.ask;
                    latestPrice = { bid: bidRatio, ask: askRatio };
                    pairCache[symbolPair] = {
                        ...latestPrice,
                        updateWorker: pairCache[symbolPair]?.updateWorker,
                    };
                    if (resolvePromise) {
                        resolvePromise(latestPrice);
                        resolvePromise = undefined;
                    }
                }
                else {
                    init_1.logger.error(`Invalid tick data for ${symbolPair}: ${JSON.stringify(tick1)}, ${JSON.stringify(tick2)}`);
                }
            }
            catch (error) {
                init_1.logger.error(`Error updating price for ${symbolPair}:`, error);
            }
            updateCount++;
            await new Promise((resolve) => setTimeout(resolve, updateSpeedMs));
        }
        if (pairCache[symbolPair]) {
            clearInterval(pairCache[symbolPair].updateWorker);
            delete pairCache[symbolPair];
        }
    }
    pairCache[symbolPair] = { bid: 0, ask: 0, updateWorker: undefined };
    pairCache[symbolPair].updateWorker = setInterval(updatePrice, updateSpeedMs);
    return pricePromise;
}
exports.getMT5LatestPrice = getMT5LatestPrice;
async function retrieveLatestTick(symbol) {
    try {
        const response = await axios_1.default.get(`${config_1.config.apiBaseUrl}/retrieve_latest_tick/${symbol}`);
        return response.data;
    }
    catch (error) {
        console.error(`Error retrieving latest tick for ${symbol}:`, error);
        return { bid: 0, ask: 0 };
    }
}
