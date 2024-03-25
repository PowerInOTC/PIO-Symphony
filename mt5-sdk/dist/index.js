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
        const websocketClient = new api_client_1.RfqWebsocketClient((message) => {
            init_1.rfqQueue.add('rfq', message);
        }, (error) => {
            // Explicitly specify the type of error
            console.error('WebSocket error:', error);
        });
        await websocketClient.startWebSocket(token);
        new bullmq_1.Worker('rfq', async (job) => {
            const data = job.data;
            init_1.logger.info(`Sending RFQ: ${JSON.stringify(data)}`);
            const quote = await (0, rfq_1.rfqToQuote)(data);
            init_1.logger.info(`Sending quote: ${JSON.stringify(quote)}`);
            (0, api_client_1.sendQuote)(quote, token);
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
