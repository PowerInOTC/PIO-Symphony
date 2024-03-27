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
const rfq_1 = require("./rfq/rfq");
const init_1 = require("./utils/init");
const telegram_1 = require("./utils/telegram");
async function index() {
    try {
        (0, telegram_1.sendMessage)('RFQ worker started');
        const rpcURL = 'https://rpc.sonic.fantom.network/';
        const rpcKey = '';
        const provider = new ethers_1.ethers.JsonRpcProvider(`${rpcURL}${rpcKey}`);
        const wallet = new ethers_1.ethers.Wallet('b63a221a15a6e40e2a79449c0d05b9a1750440f383b0a41b4d6719d7611607b4', provider);
        const token = await (0, api_client_1.getPayloadAndLogin)(wallet);
        if (!wallet || !token) {
            console.log('login failed');
            return;
        }
        const wallet2 = new ethers_1.ethers.Wallet('ceed6376f9371cd316329c401d99ddcd3b1e3ab0792d4275ff18f6589a2e24af', provider);
        const token2 = await (0, api_client_1.getPayloadAndLogin)(wallet);
        if (!wallet2 || !token2) {
            console.log('login failed');
            return;
        }
        const wallet3 = new ethers_1.ethers.Wallet('ceed6376f9371cd316329c401d99ddcd3b1e3ab0792d4275ff18f6589a2e24af', provider);
        const token3 = await (0, api_client_1.getPayloadAndLogin)(wallet);
        if (!wallet3 || !token3) {
            console.log('login failed');
            return;
        }
        const wallet4 = new ethers_1.ethers.Wallet('ceed6376f9371cd316329c401d99ddcd3b1e3ab0792d4275ff18f6589a2e24af', provider);
        const token4 = await (0, api_client_1.getPayloadAndLogin)(wallet);
        if (!wallet4 || !token4) {
            console.log('login failed');
            return;
        }
        const wallet5 = new ethers_1.ethers.Wallet('ceed6376f9371cd316329c401d99ddcd3b1e3ab0792d4275ff18f6589a2e24af', provider);
        const token5 = await (0, api_client_1.getPayloadAndLogin)(wallet);
        if (!wallet5 || !token5) {
            console.log('login failed');
            return;
        }
        const websocketClient = new api_client_1.RfqWebsocketClient((message) => {
            init_1.rfqQueue.add('rfq', message);
        }, (error) => {
            // Explicitly specify the type of error
            console.error('WebSocket error:', error);
        });
        await websocketClient.startWebSocket(token);
        new bullmq_1.Worker('rfq', async (job) => {
            try {
                const data = job.data;
                init_1.logger.info(`RFQ: ${JSON.stringify(data)}`);
                const quote = await (0, rfq_1.rfqToQuote)(data);
                (0, api_client_1.sendQuote)(quote, token);
                quote.sMarketPrice = (Number(quote.sMarketPrice) * 1.001).toString();
                quote.lMarketPrice = (Number(quote.lMarketPrice) / 1.001).toString();
                const quote2 = quote;
                quote2.sMarketPrice = (Number(quote.sMarketPrice) * 1.001).toString();
                quote2.lMarketPrice = (Number(quote.lMarketPrice) / 1.001).toString();
                (0, api_client_1.sendQuote)(quote2, token2);
                const quote3 = quote2;
                quote3.sMarketPrice = (Number(quote2.sMarketPrice) * 1.001).toString();
                quote3.lMarketPrice = (Number(quote2.lMarketPrice) / 1.001).toString();
                (0, api_client_1.sendQuote)(quote3, token3);
                const quote4 = quote3;
                quote4.sMarketPrice = (Number(quote3.sMarketPrice) * 1.001).toString();
                quote4.lMarketPrice = (Number(quote3.lMarketPrice) / 1.001).toString();
                (0, api_client_1.sendQuote)(quote4, token4);
                const quote5 = quote4;
                quote5.sMarketPrice = (Number(quote4.sMarketPrice) * 1.001).toString();
                quote5.lMarketPrice = (Number(quote4.lMarketPrice) / 1.001).toString();
                (0, api_client_1.sendQuote)(quote5, token5);
            }
            catch {
                init_1.logger.error(`Error processing job: ${Error}`);
            }
        }, {
            connection: {
                host: config_1.config.bullmqRedisHost,
                port: config_1.config.bullmqRedisPort,
                password: config_1.config.bullmqRedisPassword,
            },
            removeOnComplete: { count: 0 },
            //removeOnFail: { count: 0 }
        });
    }
    catch (error) {
        (0, telegram_1.sendErrorToTelegram)(error);
    }
}
index();
