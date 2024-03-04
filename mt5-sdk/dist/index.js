"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const axios_1 = __importDefault(require("axios"));
const bullmq_1 = require("bullmq");
const config_1 = require("./config");
const apiclientsdk_1 = __importDefault(require("apiclientsdk"));
const fastApiUrl = process.env.FAST_API || "";
async function getPairPrice(a, b, maxTimestampDiff, abPrecision, confPrecision) {
    try {
        const protocol = config_1.config.fastApiHttps ? 'https' : 'http';
        const url = `${protocol}://${config_1.config.fastApiHost}:${config_1.config.fastApiPort}?key=123&a=${a}&b=${b}&abprecision=${abPrecision}&confprecision=${confPrecision}&maxtimestampdiff=${maxTimestampDiff}`;
        const response = await axios_1.default.get(url);
        return response.data;
    }
    catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}
//ConfigBuilder.ts
async function symbolStartsWithForex(symbol) {
    try {
        const response = await axios_1.default.get(fastApiUrl + '/symbol_info/' + symbol);
        const symbolInfo = response.data;
        const lastElement = symbolInfo[symbolInfo.length - 1];
        return typeof lastElement === 'string' && lastElement.startsWith('Forex');
    }
    catch (error) {
        console.error('Error retrieving symbol info:', error);
        return false;
    }
}
async function testProxySymbol(symbol) {
    const abPrecision = 5;
    const confPrecision = 5;
    const maxTimestampDiff = 200000;
    try {
        let price = null;
        let maxRetry = 3;
        while ((!price || !price.pairBid || !price.pairAsk) && maxRetry > 0) {
            price = await getPairPrice(symbol, symbol, maxTimestampDiff, abPrecision, confPrecision);
            maxRetry--;
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        if (!price || !price.pairBid || !price.pairAsk) {
            console.log(symbol + ' is not available on the proxy');
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
}
async function retrieveAllSymbols() {
    try {
        const response = await axios_1.default.get(fastApiUrl + '/retrieve_all_symbols');
        const symbols = response.data.symbols;
        const stocks = [];
        const forex = [];
        symbols.forEach(async (symbol) => {
            if (symbol.endsWith('.NAS')) {
                const name = 'stock.nasdaq.' + symbol.replace('.NAS', '');
                const isProxy = await testProxySymbol(name);
                console.log(isProxy);
                if (isProxy) {
                    stocks.push(name);
                    console.log(name);
                }
            }
            else if (symbol.endsWith('.NYSE')) {
                const name = 'stock.nyse.' + symbol.replace('.NYSE', '');
            }
            else if (symbol.endsWith('.MAD')) {
                const name = 'stock.euronext.' + symbol.replace('.MAD', '.MD');
            }
            else if (symbol.endsWith('.PAR')) {
                const name = 'stock.euronext.' + symbol.replace('.PAR', '.PA');
            }
            else if (symbol.endsWith('.AMS')) {
                const name = 'stock.euronext.' + symbol.replace('.AMS', '.AS');
            }
            else if (symbol.endsWith('.LSE')) {
                const name = 'stock.lse.' + symbol.replace('.LSE', '.L');
            }
            else if (symbol.endsWith('.ETR')) {
                const name = 'stock.xetra.' + symbol.replace('.ETR', '.DE');
            }
            else {
                const isForex = await symbolStartsWithForex(symbol);
                if (isForex) {
                    const name = 'forex.' + symbol;
                }
            }
        });
    }
    catch (error) {
        console.error('Error retrieving all symbols:', error);
    }
}
const rfqQueue = new bullmq_1.Queue('rfq', {
    connection: {
        host: config_1.config.bullmqRedisHost,
        port: config_1.config.bullmqRedisPort,
        password: config_1.config.bullmqRedisPassword
    }
});
async function bullExample() {
    const { wallet: wallet, token: token } = await apiclientsdk_1.default.createWalletAndSignIn();
    if (!wallet || !token) {
        console.log("login failed");
        return;
    }
    const websocketClient = new apiclientsdk_1.default.RfqWebsocketClient((message) => {
        rfqQueue.add('rfq', message);
    }, (error) => {
        console.error("WebSocket error:", error);
    });
    await websocketClient.startWebSocket(token);
    const rfq = {
        chainId: 80001,
        expiration: 315360000,
        assetAId: "crypto.BTC",
        assetBId: "crypto.ETH",
        sPrice: "99.99",
        sQuantity: "99.99",
        sInterestRate: "9.99",
        sIsPayingApr: true,
        sImA: "9.99",
        sImB: "9.99",
        sDfA: "9.99",
        sDfB: "9.99",
        sExpirationA: 3600,
        sExpirationB: 3600,
        sTimelockA: 3600,
        sTimelockB: 3600,
        lPrice: "99.99",
        lQuantity: "99.99",
        lInterestRate: "9.99",
        lIsPayingApr: true,
        lImA: "9.99",
        lImB: "9.99",
        lDfA: "9.99",
        lDfB: "9.99",
        lExpirationA: 3600,
        lExpirationB: 3600,
        lTimelockA: 3600,
        lTimelockB: 3600
    };
    for (let i = 0; i < 10; i++) {
        await apiclientsdk_1.default.sendRfq(rfq, token);
    }
    const worker = new bullmq_1.Worker('rfq', async (job) => {
        const data = job.data;
        //console.log(`Processing job ${job.id}: ${JSON.stringify(data)}`);
    }, {
        connection: {
            host: config_1.config.bullmqRedisHost,
            port: config_1.config.bullmqRedisPort,
            password: config_1.config.bullmqRedisPassword
        },
        removeOnComplete: { count: 0 },
        //removeOnFail: { count: 0 }
    });
}
bullExample();
