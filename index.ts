import axios from 'axios';
import { get } from 'http';

const fastApiUrl = 'http://127.0.0.1:8000';


async function retrieveAllSymbols() {
  try {
    const response = await axios.get(fastApiUrl + '/retrieve_all_symbols');
    const symbols: string[] = response.data.symbols;

    symbols.forEach((symbol: string) => {
        if (symbol.endsWith('.NAS')) {
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
          console.log ('Non-attributed Symbol:', symbol);
        }
      });
  } catch (error) {
    console.error('Error retrieving all symbols:', error);
  }
}

async function getSymbolInfo(symbol: string) {  
  try {
    const response = await axios.get(fastApiUrl + '/get_symbol_info/'+ symbol);
    const symbolInfo = response.data;
    console.log(symbolInfo);
  } catch (error) {
    console.error('Error retrieving symbol info:', error);
  }
}

getSymbolInfo('EURUSD');