"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePairPrices = void 0;
const api_client_1 = require("@pionerfriends/api-client");
const init_1 = require("./utils/init");
async function calculatePairPrices(pairs, token) {
    const assetIds = new Set();
    const pairPrices = {};
    try {
        // Collect unique asset IDs from the pairs
        for (const pair of pairs) {
            const [assetAId, assetBId] = pair.split('/');
            assetIds.add(assetAId);
            assetIds.add(assetBId);
        }
        // Check if token is null
        if (token === null) {
            throw new Error('Token is null');
        }
        // Retrieve prices for all unique asset IDs
        const prices = await (0, api_client_1.getPrices)(Array.from(assetIds), token);
        // Check if prices is defined
        if (prices && prices.data) {
            // Calculate bid and ask prices for each pair
            for (const pair of pairs) {
                const [assetAId, assetBId] = pair.split('/');
                if (prices.data[assetAId] && prices.data[assetBId]) {
                    const bidA = prices.data[assetAId]['bidPrice'] || 0;
                    const bidB = prices.data[assetBId]['bidPrice'] || 0;
                    const askA = prices.data[assetAId]['askPrice'] || 0;
                    const askB = prices.data[assetBId]['askPrice'] || 0;
                    const bid = bidB !== 0 ? bidA / bidB : 0;
                    const ask = askB !== 0 ? askA / askB : 0;
                    pairPrices[pair] = { bid, ask };
                    //logger.info(`${pair} - bid: ${bid}, ask: ${ask}`);
                }
                else {
                    pairPrices[pair] = { bid: 0, ask: 0 };
                    init_1.logger.warn(`Unable to retrieve prices for pair: ${pair}. Setting bid and ask to 0.`);
                }
            }
        }
        else {
            throw new Error('Unable to retrieve prices');
        }
    }
    catch (error) {
        init_1.logger.error('Error calculating pair prices:', error);
        throw error;
    }
    return pairPrices;
}
exports.calculatePairPrices = calculatePairPrices;
