"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeApiCalls = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
async function makeApiCalls(maxtimestampdiff, abPrecision, confPrecision, asset1, asset2) {
    try {
        const proxies = JSON.parse(config_1.config.proxyVars);
        const responsePromises = [];
        for (let i = 1; i <= parseInt(proxies.PROXY_NUMBERS); i++) {
            const proxy = proxies[`PROXY${i}`];
            const apiKey = proxies[`PROXY${i}KEY`];
            const apiUrl = `${proxy}${apiKey}&a=${asset1}&b=${asset2}&abprecision=${abPrecision.toString()}&confprecision=${confPrecision.toString()}&maxtimestampdiff=${maxtimestampdiff}`;
            const timeoutConfig = { timeout: 5000 };
            responsePromises.push(axios_1.default
                .get(apiUrl, timeoutConfig)
                .then((response) => {
                if (response.status === 200) {
                    const { pairBid, pairAsk, confidence, timestamp } = response.data;
                    const numericPairBid = parseFloat(pairBid);
                    const numericPairAsk = parseFloat(pairAsk);
                    const numericConfidence = parseFloat(confidence);
                    const numericTimestamp = parseFloat(timestamp);
                    if (!isNaN(numericPairBid) &&
                        !isNaN(numericPairAsk) &&
                        !isNaN(numericConfidence) &&
                        !isNaN(numericTimestamp)) {
                        return {
                            ...response,
                            data: {
                                ...response.data,
                                pairBid: numericPairBid,
                                pairAsk: numericPairAsk,
                                confidence: numericConfidence,
                                timestamp: numericTimestamp,
                            },
                        };
                    }
                    else {
                        //console.log(`Invalid data from Proxy ${i}.`);
                        return null;
                    }
                }
                else {
                    //console.log(`Invalid response status from Proxy ${i}. Status: ${response.status}`);
                    return null;
                }
            })
                .catch((error) => {
                console.error(`Error with Proxy ${i}:`, error.message);
                return null;
            }));
        }
        const responses = await Promise.all(responsePromises);
        const validResponses = responses.filter((response) => response !== null);
        if (validResponses.length > 0) {
            let averageTimestamp = 0;
            let averagePairBid = 0;
            let averagePairAsk = 0;
            let averageConfidence = 0;
            for (const response of validResponses) {
                if (response && response.data) {
                    const { timestamp, pairBid, pairAsk, confidence } = response.data;
                    averageTimestamp += timestamp;
                    averagePairBid += pairBid;
                    averagePairAsk += pairAsk;
                    averageConfidence += confidence;
                }
            }
            averageTimestamp /= validResponses.length;
            averagePairBid /= validResponses.length;
            averagePairAsk /= validResponses.length;
            averageConfidence /= validResponses.length;
            let closestDistance = Infinity;
            let closestResponse = null;
            for (const response of validResponses) {
                if (response && response.data) {
                    const { timestamp, pairBid, pairAsk, confidence } = response.data;
                    const distance = Math.abs(timestamp - averageTimestamp) +
                        Math.abs(pairBid - averagePairBid) +
                        Math.abs(pairAsk - averagePairAsk) +
                        Math.abs(confidence - averageConfidence);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestResponse = response.data;
                    }
                }
            }
            return closestResponse;
        }
    }
    catch (error) {
        console.error('Error making API calls:', error);
    }
}
exports.makeApiCalls = makeApiCalls;
