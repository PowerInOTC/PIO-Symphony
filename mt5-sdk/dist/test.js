"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config_1 = require("./config");
const bullmq_1 = require("bullmq");
const ethers_1 = require("ethers");
const api_client_1 = require("@pionerfriends/api-client");
const rfqQueue = new bullmq_1.Queue('rfq', {
    connection: {
        host: config_1.config.bullmqRedisHost,
        port: config_1.config.bullmqRedisPort,
        password: config_1.config.bullmqRedisPassword,
    },
});
async function bullExample() {
    console.log('test');
    const rpcURL = 'https://rpc.sonic.fantom.network/';
    const rpcKey = '';
    const provider = new ethers_1.ethers.JsonRpcProvider(`${rpcURL}${rpcKey}`);
    const wallet = new ethers_1.ethers.Wallet('b63a221a15a6e40e2a79449c0d05b9a1750440f383b0a41b4d6719d7611607b4', provider);
    const token = await (0, api_client_1.getPayloadAndLogin)(wallet);
    if (!wallet || !token) {
        console.log('login failed');
        return;
    }
    const websocketClient = new api_client_1.QuoteWebsocketClient((message) => {
        console.log(message);
    }, (error) => {
        console.error('WebSocket error:', error);
    });
    await websocketClient.startWebSocket(token);
    const rfq = {
        chainId: 80001,
        expiration: 315360000,
        assetAId: 'crypto.BTC',
        assetBId: 'crypto.ETH',
        sPrice: '99.99',
        sQuantity: '99.99',
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
        lPrice: '99.99',
        lQuantity: '99.99',
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
    for (let i = 0; i < 10; i++) {
        await (0, api_client_1.sendRfq)(rfq, token);
    }
}
bullExample();
