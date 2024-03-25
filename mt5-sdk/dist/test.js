"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ethers_1 = require("ethers");
const api_client_1 = require("@pionerfriends/api-client");
const telegram_1 = require("./utils/telegram");
const init_1 = require("./utils/init");
const configRead_1 = require("./configBuilder/configRead");
const forSDK_1 = require("./forSDK");
async function bullExample() {
    console.log('test');
    const rpcURL = 'https://rpc.sonic.fantom.network/';
    const rpcKey = '';
    const provider = new ethers_1.ethers.JsonRpcProvider(`${rpcURL}${rpcKey}`);
    const wallet = new ethers_1.ethers.Wallet('578c436136413ec3626d3451e89ce5e633b249677851954dff6b56fad50ac6fe', provider);
    const token = await (0, api_client_1.getPayloadAndLogin)(wallet);
    if (!wallet || !token) {
        console.log('login failed');
        return;
    }
    const websocketClient = new api_client_1.QuoteWebsocketClient((message) => {
        console.log(message);
    }, (error) => {
        console.error('WebSocket error:', error);
        (0, telegram_1.sendErrorToTelegram)(error);
    });
    await websocketClient.startWebSocket(token);
    const chainId = 64165;
    const assetAId = 'forex.EURUSD';
    const assetBId = 'stock.nasdaq.AAPL';
    const Leverage = 100;
    let bid = 0;
    let ask = 0;
    let sQuantity = 100;
    let lQuantity = 101;
    const assetHex = `${assetAId}/${assetBId}`;
    const pairs = [assetHex, 'forex.EURUSD/stock.nasdaq.AI'];
    init_1.logger.info('hi');
    const pairPrices = await (0, forSDK_1.calculatePairPrices)(pairs, token);
    const sssss = await (0, forSDK_1.calculatePairPrices)(pairs, token);
    const passdsaairPrices = await (0, forSDK_1.calculatePairPrices)(pairs, token);
    const sssssss = await (0, forSDK_1.calculatePairPrices)(pairs, token);
    const sdas = await (0, forSDK_1.calculatePairPrices)(pairs, token);
    const sadsa = await (0, forSDK_1.calculatePairPrices)(pairs, token);
    const asdas = await (0, forSDK_1.calculatePairPrices)(pairs, token);
    const ad = await (0, forSDK_1.calculatePairPrices)(pairs, token);
    const pasdsaairPrices = await (0, forSDK_1.calculatePairPrices)(pairs, token);
    const adsa = await (0, forSDK_1.calculatePairPrices)(pairs, token);
    init_1.logger.info(pairPrices, 'Pair Prices');
    const adjustedQuantities = await (0, configRead_1.adjustQuantities)(bid, ask, sQuantity, lQuantity, assetAId, assetBId, Leverage);
    // Retrieve adjusted quantities
    sQuantity = adjustedQuantities.sQuantity;
    lQuantity = adjustedQuantities.lQuantity;
    const pairConfig = (0, configRead_1.getPairConfig)(assetAId, assetBId, 'long', Leverage, ask * lQuantity);
    //logger.info(pairConfig, 'RFQ');
    const rfq = {
        chainId: chainId,
        expiration: Math.floor((Date.now() + 3600) / 1000),
        assetAId: assetAId,
        assetBId: assetBId,
        sPrice: String(bid),
        sQuantity: String(sQuantity),
        sInterestRate: '9.99',
        sIsPayingApr: true,
        sImA: '9.99',
        sImB: '9.99',
        sDfA: '9.99',
        sDfB: '9.99',
        sExpirationA: 3600,
        sExpirationB: 3600,
        sTimelockA: 3600,
        sTimelockB: 3600,
        lPrice: String(ask),
        lQuantity: String(lQuantity),
        lInterestRate: '9.99',
        lIsPayingApr: true,
        lImA: '9.99',
        lImB: '9.99',
        lDfA: '9.99',
        lDfB: '9.99',
        lExpirationA: 3600,
        lExpirationB: 3600,
        lTimelockA: 3600,
        lTimelockB: 3600,
    };
    try {
        let counter = 0;
        const interval = setInterval(() => {
            init_1.logger.info(counter);
            (0, api_client_1.sendRfq)(rfq, token);
            counter++;
        }, 5000);
    }
    catch (error) {
        if (error instanceof Error) {
            init_1.logger.error(error);
        }
        else {
            init_1.logger.error('An unknown error occurred');
        }
    }
}
bullExample();
