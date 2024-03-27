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
const mt5Price_1 = require("./broker/mt5Price");
async function bullExample() {
    const rpcURL = 'https://rpc.sonic.fantom.network/';
    const rpcKey = '';
    const provider = new ethers_1.ethers.JsonRpcProvider(`${rpcURL}${rpcKey}`);
    const wallet = new ethers_1.ethers.Wallet('578c436136413ec3626d3451e89ce5e633b249677851954dff6b56fad50ac6fe', provider);
    init_1.logger.info('hi');
    const token = await (0, api_client_1.getPayloadAndLogin)(wallet);
    if (!wallet || !token) {
        console.log('login failed');
        return;
    }
    init_1.logger.info('hi');
    const websocketClient = new api_client_1.QuoteWebsocketClient((message) => {
        //console.log(message);
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
    const pairPrices = await (0, forSDK_1.calculatePairPrices)(pairs, token);
    bid = pairPrices[assetHex]['bid'];
    ask = pairPrices[assetHex]['ask'];
    const adjustedQuantities = await (0, configRead_1.adjustQuantities)(bid, ask, sQuantity, lQuantity, assetAId, assetBId, Leverage);
    init_1.logger.info('hi');
    sQuantity = adjustedQuantities.sQuantity;
    lQuantity = adjustedQuantities.lQuantity;
    const lConfig = await (0, configRead_1.getPairConfig)(assetAId, assetBId, 'long', Leverage, ask * lQuantity);
    const sConfig = await (0, configRead_1.getPairConfig)(assetAId, assetBId, 'long', Leverage, ask * lQuantity);
    let lInterestRate = lConfig.funding;
    let sInterestRate = sConfig.funding;
    const rfq = {
        chainId: chainId,
        expiration: 10,
        assetAId: assetAId,
        assetBId: assetBId,
        sPrice: String(bid),
        sQuantity: String(sQuantity),
        sInterestRate: String(sInterestRate),
        sIsPayingApr: true,
        sImA: String(sConfig.imA),
        sImB: String(sConfig.imA),
        sDfA: String(sConfig.imA),
        sDfB: String(sConfig.imA),
        sExpirationA: 3600,
        sExpirationB: 3600,
        sTimelockA: 3600,
        sTimelockB: 3600,
        lPrice: String(ask),
        lQuantity: String(lQuantity),
        lInterestRate: String(lInterestRate),
        lIsPayingApr: true,
        lImA: String(lConfig.imA),
        lImB: String(lConfig.imB),
        lDfA: String(lConfig.dfA),
        lDfB: String(lConfig.dfB),
        lExpirationA: 3600,
        lExpirationB: 3600,
        lTimelockA: 3600,
        lTimelockB: 3600,
    };
    try {
        let counter = 0;
        const interval = setInterval(() => {
            init_1.logger.info(counter);
            (0, mt5Price_1.mt5Price)('forex.EURUSD', 200, 60000, 'user1');
            //sendRfq(rfq, token);
            counter++;
        }, 1000);
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
