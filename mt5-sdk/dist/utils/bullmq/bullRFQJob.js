"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config/config");
async function main() {
    const assetAProxyTicker = 'forex.EURUSD';
    const assetBProxyTicker = 'forex.GBPUSD';
    const quantity = 100000;
    const side = true; // Long
    const leverage = 50;
    await (0, config_1.getPairTradingConfig)(assetAProxyTicker, assetBProxyTicker, quantity, side, leverage);
}
main();
