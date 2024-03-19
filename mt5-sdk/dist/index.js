"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bullmq_1 = require("bullmq");
const config_1 = require("./config");
const api_client_1 = require("@pionerfriends/api-client");
const ethers_1 = require("ethers");
let token = '';
const rpcURL = 'https://rpc.sonic.fantom.network/';
const rpcKey = '';
const provider = new ethers_1.ethers.JsonRpcProvider(`${rpcURL}${rpcKey}`);
let pk;
if (process.env.PRIVATE_KEYS) {
    pk = process.env.PRIVATE_KEYS.split(',')[0];
}
const websocketClient = new api_client_1.RfqWebsocketClient((message) => {
    rfqQueue.add('rfq', message);
}, (error) => {
    console.error('WebSocket error:', error);
});
const rfqQueue = new bullmq_1.Queue('rfq', {
    connection: {
        host: config_1.config.bullmqRedisHost,
        port: config_1.config.bullmqRedisPort,
        password: config_1.config.bullmqRedisPassword,
    },
});
async function bullExample() {
    if (typeof pk === 'string') {
        console.log('pk', pk);
        const wallet = new ethers_1.ethers.Wallet(pk, provider);
        token = (await (0, api_client_1.getPayloadAndLogin)(wallet)) ?? '';
    }
    console.log(token);
    await websocketClient.startWebSocket(token);
    const rfq = {
        chainId: 80001,
        expiration: 315360000,
        assetAId: 'forex.EURUSD',
        assetBId: 'forex.USDJPY',
        sPrice: '99.99',
        sQuantity: '99.99',
        sInterestRate: '9.99',
        sIsPayingApr: true,
        sImA: '0.1',
        sImB: '0.1',
        sDfA: '0.025',
        sDfB: '0.025',
        sExpirationA: 3600,
        sExpirationB: 3600,
        sTimelockA: 3600,
        sTimelockB: 3600,
        lPrice: '99.99',
        lQuantity: '99.99',
        lInterestRate: '9.99',
        lIsPayingApr: true,
        lImA: '0.1',
        lImB: '0.1',
        lDfA: '0.25',
        lDfB: '0.25',
        lExpirationA: 3600,
        lExpirationB: 3600,
        lTimelockA: 3600,
        lTimelockB: 3600,
    };
    await (0, api_client_1.sendRfq)(rfq, token);
    const worker = new bullmq_1.Worker('rfq', async (job) => {
        const data = job.data;
        //const isVerified = await verifyRfq(data);
        const isVerified = true;
        if (isVerified) {
            console.log(data.chainId, data.id);
            const quote = {
                chainId: data.chainId,
                rfqId: data.id,
                expiration: 3600,
                sMarketPrice: '99.99',
                sPrice: '99.99',
                sQuantity: '99.99',
                lMarketPrice: '99.99',
                lPrice: '99.99',
                lQuantity: '99.99',
            };
            await (0, api_client_1.sendQuote)(quote, token);
        }
        (0, api_client_1.getQuotes)(data.id, token)
            .then((response) => {
            console.log(response?.data);
        })
            .catch((error) => {
            console.error(error);
        });
        console.log(`Processing job ${job.id}: ${JSON.stringify(data)}`);
    }, {
        connection: {
            host: config_1.config.bullmqRedisHost,
            port: config_1.config.bullmqRedisPort,
            password: config_1.config.bullmqRedisPassword,
        },
        removeOnComplete: { count: 0 },
        removeOnFail: { count: 0 },
        limiter: { max: 1, duration: 1000 },
        //settings: { lockDuration: 1000 * 60 * 60 * 24, stalledInterval: 1000 * 60 * 60 * 24, maxStalledCount: 1,
        //  guardInterval: 1000 * 60 * 60 * 24, retryProcessDelay: 1000 * 60 * 60 * 24, backoffStrategies:
        //  { custom: (attemptsMade: number, err: Error) => { return 1000 * 60 * 60 * 24; } } },
    });
}
bullExample();
