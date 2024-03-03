import dotenv from 'dotenv';
dotenv.config();

import axios, { AxiosResponse } from 'axios';
import { Queue, Worker } from 'bullmq';
import { config } from './config';
import API from 'apiclientsdk';

const fastApiUrl = process.env.FAST_API || "";

export type PairPrice = {
    assetA: string;
    assetB: string;
    pairBid: string;
    pairAsk: string;
    confidence: string;
    timestamp: number;
}

async function getPairPrice(a: string, b: string, maxTimestampDiff: number, abPrecision: number, confPrecision: number): Promise<PairPrice> {
    try {
        const protocol: string = config.fastApiHttps ? 'https' : 'http';
        const url = `${protocol}://${config.fastApiHost}:${config.fastApiPort}?key=123&a=${a}&b=${b}&abprecision=${abPrecision}&confprecision=${confPrecision}&maxtimestampdiff=${maxTimestampDiff}`
        const response: AxiosResponse<PairPrice> = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

//ConfigBuilder.ts
async function symbolStartsWithForex(symbol: string): Promise<boolean> {
    try {
        const response = await axios.get(fastApiUrl + '/symbol_info/' + symbol);
        const symbolInfo = response.data;
        const lastElement = symbolInfo[symbolInfo.length - 1];
        return typeof lastElement === 'string' && lastElement.startsWith('Forex');
    } catch (error) {
        console.error('Error retrieving symbol info:', error);
        return false;
    }
}

async function testProxySymbol(symbol: string): Promise<boolean> {
    const abPrecision = 5;
    const confPrecision = 5;
    const maxTimestampDiff = 200000;

    try {
        let price: PairPrice | null = null;
        let maxRetry: number = 3;
        while ((!price || !price.pairBid || !price.pairAsk) && maxRetry > 0) {
            price = await getPairPrice(symbol, symbol, maxTimestampDiff, abPrecision, confPrecision);
            maxRetry--;
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        if (!price || !price.pairBid || !price.pairAsk) {
            console.log(symbol + ' is not available on the proxy');
            return false
        }

        return true;
    } catch (error) {
        return false;
    }
}

async function retrieveAllSymbols(): Promise<void> {
    try {
        const response = await axios.get(fastApiUrl + '/retrieve_all_symbols');
        const symbols: string[] = response.data.symbols;
        const stocks: string[] = [];
        const forex: string[] = [];

        symbols.forEach(async (symbol: string) => {
            if (symbol.endsWith('.NAS')) {
                const name = 'stock.nasdaq.' + symbol.replace('.NAS', '');
                const isProxy = await testProxySymbol(name);
                console.log(isProxy);
                if (isProxy) {
                    stocks.push(name);
                    console.log(name);
                }
            } else if (symbol.endsWith('.NYSE')) {
                const name = 'stock.nyse.' + symbol.replace('.NYSE', '');

            } else if (symbol.endsWith('.MAD')) {
                const name = 'stock.euronext.' + symbol.replace('.MAD', '.MD');
            } else if (symbol.endsWith('.PAR')) {
                const name = 'stock.euronext.' + symbol.replace('.PAR', '.PA');
            } else if (symbol.endsWith('.AMS')) {
                const name = 'stock.euronext.' + symbol.replace('.AMS', '.AS');
            } else if (symbol.endsWith('.LSE')) {
                const name = 'stock.lse.' + symbol.replace('.LSE', '.L');
            } else if (symbol.endsWith('.ETR')) {
                const name = 'stock.xetra.' + symbol.replace('.ETR', '.DE');
            } else {
                const isForex = await symbolStartsWithForex(symbol);
                if (isForex) {
                    const name = 'forex.' + symbol;
                }
            }
        });
    } catch (error) {
        console.error('Error retrieving all symbols:', error);
    }
}

//retrieveAllSymbols();







type RfqResponse = {
    id: string;
    chainId: number;
    createdAt: number;
    userId: string;
    expiration: number;
    AssetAId: string;
    AssetBId: string;
    sPrice: string;
    sQuantity: string;
    sInterestRate: string;
    sIsPayingApr: boolean;
    sImA: string;
    sImB: string;
    sDfA: string;
    sDfB: string;
    sExpirationA: number;
    sExpirationB: number;
    sTimelockA: number;
    sTimelockB: number;
    lPrice: string;
    lQuantity: string;
    lInterestRate: string;
    lIsPayingApr: boolean;
    lImA: string;
    lImB: string;
    lDfA: string;
    lDfB: string;
    lExpirationA: number;
    lExpirationB: number;
    lTimelockA: number;
    lTimelockB: number;
}

const rfqQueue = new Queue('rfq', {
    connection: {
        host: config.bullmqRedisHost,
        port: config.bullmqRedisPort,
        password: config.bullmqRedisPassword
    }
});

async function bullExample(): Promise<void> {
    const { wallet: wallet, token: token } = await API.createWalletAndSignIn();
    if (!wallet || !token) {
        console.log("login failed");
        return;
    }
    const websocketClient = new API.RfqWebsocketClient(
        (message: RfqResponse) => {
            rfqQueue.add('rfq', message);
        },
        (error) => {
            console.error("WebSocket error:", error);
        }
    );
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
    }

    for (let i = 0; i < 10; i++) {
        await API.sendRfq(rfq, token);
    }

    const worker = new Worker('rfq', async (job) => {
        const data: RfqResponse = job.data;
        //console.log(`Processing job ${job.id}: ${JSON.stringify(data)}`);
    }, {
        connection: {
            host: config.bullmqRedisHost,
            port: config.bullmqRedisPort,
            password: config.bullmqRedisPassword
        },
        removeOnComplete: { count: 0 },
        //removeOnFail: { count: 0 }
    });
}

bullExample();
