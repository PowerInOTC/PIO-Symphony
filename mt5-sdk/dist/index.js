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
console.log('rfqQueue', rfqQueue);
async function bullExample() {
    const rpcURL = 'https://rpc.sonic.fantom.network/';
    const rpcKey = '';
    const provider = new ethers_1.ethers.JsonRpcProvider(`${rpcURL}${rpcKey}`);
    const wallet = new ethers_1.ethers.Wallet('b63a221a15a6e40e2a79449c0d05b9a1750440f383b0a41b4d6719d7611607b4', provider);
    const token = await (0, api_client_1.getPayloadAndLogin)(wallet);
    if (!wallet || !token) {
        console.log('login failed');
        return;
    }
    const websocketClient = new api_client_1.RfqWebsocketClient((message) => {
        rfqQueue.add('rfq', message);
    }, (error) => {
        console.error('WebSocket error:', error);
    });
    await websocketClient.startWebSocket(token);
    new bullmq_1.Worker('rfq', async (job) => {
        const data = job.data;
        const quote = await rfqToQuote(data);
        (0, api_client_1.sendQuote)(quote, token);
        console.log(`Processing job ${job.id}: ${JSON.stringify(data)}`);
    }, {
        connection: {
            host: config_1.config.bullmqRedisHost,
            port: config_1.config.bullmqRedisPort,
            password: config_1.config.bullmqRedisPassword,
        },
        removeOnComplete: { count: 0 },
        //removeOnFail: { count: 0 }
    });
    const rfqToQuote = async (rfq) => {
        return {
            chainId: rfq.chainId,
            rfqId: rfq.id,
            expiration: rfq.expiration,
            sMarketPrice: '1',
            sPrice: rfq.sPrice,
            sQuantity: rfq.sQuantity,
            lMarketPrice: '1',
            lPrice: rfq.lPrice,
            lQuantity: rfq.lQuantity,
        };
    };
}
bullExample();
