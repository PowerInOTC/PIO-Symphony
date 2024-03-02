import axios from 'axios';
const makeApiCalls = require('./src/proxyCall');
const dotenv = require('dotenv');
dotenv.config();

const fastApiUrl = process.env.FAST_API;

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
    const Precision = 5;
    const maxtimestampdiff = 200000;

    try {
        let price;
        let maxRetry = 3;
        while ((!price || price.pairBid === undefined ) && maxRetry > 0) {
            price = await makeApiCalls(maxtimestampdiff, Precision, symbol, symbol);
            maxRetry--;
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        if (price.pairBid === undefined) {
            console.log(symbol + ' is not available on the proxy');
        }
        return price.pairBid === 1;
    } catch (error) {
        return false;
    }
}

async function retrieveAllSymbols() {
  try {
    const response = await axios.get(fastApiUrl + '/retrieve_all_symbols');
    const symbols: string[] = response.data.symbols;
    const stocks = [];
    const forex = [];

    symbols.forEach(async (symbol: string) => {
        if (symbol.endsWith('.NAS')) {
            const name = 'stock.nasdaq.'+ symbol.replace('.NAS', '');
            const isProxy = await testProxySymbol(name);
            console.log(isProxy);
            if (isProxy){
                stocks.push(name);
                console.log(name);
            }
        } else if (symbol.endsWith('.NYSE')) {
            const name = 'stock.nyse.'+ symbol.replace('.NYSE', '');
            
        } else if (symbol.endsWith('.MAD')) {
            const name ='stock.euronext.'+ symbol.replace('.MAD', '.MD');
        } else if (symbol.endsWith('.PAR')) {
            const name ='stock.euronext.'+ symbol.replace('.PAR', '.PA');
        } else if (symbol.endsWith('.AMS')) {
            const name ='stock.euronext.'+ symbol.replace('.AMS', '.AS');
        } else if (symbol.endsWith('.LSE')) {
            const name ='stock.lse.'+ symbol.replace('.LSE', '.L');
        } else if (symbol.endsWith('.ETR')) {
            const name ='stock.xetra.'+ symbol.replace('.ETR', '.DE');
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

retrieveAllSymbols();
