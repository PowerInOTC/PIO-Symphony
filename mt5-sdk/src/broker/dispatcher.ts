import axios from 'axios';
import { config } from '../config';
import { getMT5Ticker, getBrokerFromAsset } from '../configBuilder/configRead';

const apiBaseUrl = config.apiBaseUrl;

export interface Position {
  symbol: string;
  volume: number;
  type: number;
  price_current: number;
  comment: string;
}

export async function getOpenPositions(broker: string): Promise<Position[]> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        const response = await axios.get(`${apiBaseUrl}/get_positions`);
        return response.data.positions;
      } catch (error) {
        console.error('Error retrieving open positions:', error);
        return [];
      }
    default:
      console.error('Unsupported broker for getOpenPositions');
      return [];
  }
}

async function getTotalOpenAmount(
  symbol: string,
  broker: string,
): Promise<number> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        return (
          await axios.get(`${apiBaseUrl}/get_total_open_amount/${symbol}`)
        ).data.total_open_amount;
      } catch (error) {
        console.error('Error retrieving total open amount:', error);
        return 0;
      }
    default:
      console.error('Unsupported broker for getTotalOpenAmount');
      return 0;
  }
}

async function retrieveLatestTick(
  symbol: string,
  broker: string,
): Promise<{ bid: number; ask: number }> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        return (await axios.get(`${apiBaseUrl}/retrieve_latest_tick/${symbol}`))
          .data;
      } catch (error) {
        console.error('Error retrieving latest tick:', error);
        return { bid: 0, ask: 0 };
      }
    default:
      console.error('Unsupported broker for retrieveLatestTick');
      return { bid: 0, ask: 0 };
  }
}

async function retrieveLatestTicks(
  symbols: string[],
  broker: string,
): Promise<{ [key: string]: { bid: number; ask: number } }> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        const response = await axios.get(
          `${apiBaseUrl}/retrieve_latest_ticks`,
          {
            params: { symbols: symbols },
          },
        );
        return response.data;
      } catch (error) {
        console.error('Error retrieving latest ticks:', error);
        return {};
      }
    default:
      console.error('Unsupported broker for retrieveLatestTicks');
      return {};
  }
}

async function retrieveAllSymbols(broker: string): Promise<string[]> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        return (await axios.get(`${apiBaseUrl}/retrieve_all_symbols`)).data
          .symbols;
      } catch (error) {
        console.error('Error retrieving all symbols:', error);
        return [];
      }
    default:
      console.error('Unsupported broker for retrieveAllSymbols');
      return [];
  }
}

export async function verifyTradeOpenable(
  pair: string,
  amount: number,
  price: number,
): Promise<boolean> {
  const [pair1, pair2] = pair.split('/');
  const mt5Ticker1 = getMT5Ticker(pair1);
  const broker1 = getBrokerFromAsset(pair1);
  const mt5Ticker2 = getMT5Ticker(pair2);
  const broker2 = getBrokerFromAsset(pair2);
  const pairMT5 = `${mt5Ticker1}/${mt5Ticker2}`;

  if (!mt5Ticker1 || !broker1 || !mt5Ticker2 || !broker2) {
    return false;
  }

  if (broker1 === broker2) {
    switch (broker1) {
      case 'mt5.ICMarkets':
        try {
          const payload = {
            symbol: pairMT5,
            volume: amount,
            price: price,
          };
          const response = await axios.post(
            `${apiBaseUrl}/verify-trade`,
            JSON.stringify(payload),
            {
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
          return response.data;
        } catch (error) {
          console.error('Error verifying trade:', error);
          return false;
        }
      default:
        console.error('Unsupported broker for verifyTradeOpenable');
        return false;
    }
  } else {
    return false;
  }
}

async function manageSymbolInventory(
  pair: string,
  amount: number,
  hash: string,
  isLong: boolean,
  isOpen: boolean,
  broker: string,
): Promise<boolean> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        const payload = {
          pair: pair,
          b_contract_id: hash,
          amount: amount,
          is_long: isLong,
          is_open: isOpen,
        };
        const response = await axios.post(
          `${apiBaseUrl}/manage_symbol_inventory`,
          JSON.stringify(payload),
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
        return response.data;
      } catch (error) {
        console.error('Error managing symbol inventory:', error);
        return false;
      }
    default:
      console.error('Unsupported broker for manageSymbolInventory');
      return false;
  }
}

async function retrieveMaxNotional(broker: string): Promise<number> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        return (await axios.get(`${apiBaseUrl}/retrieve_max_notional`)).data
          .max_notional;
      } catch (error) {
        console.error('Error retrieving max notional:', error);
        return 0;
      }
    default:
      console.error('Unsupported broker for retrieveMaxNotional');
      return 0;
  }
}

async function minAmountSymbol(
  symbol: string,
  broker: string,
): Promise<number> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        return (await axios.get(`${apiBaseUrl}/min_amount_symbol/${symbol}`))
          .data.min_amount;
      } catch (error) {
        console.error('Error retrieving minimum amount:', error);
        return 0;
      }
    default:
      console.error('Unsupported broker for minAmountSymbol');
      return 0;
  }
}

async function symbolInfo(symbol: string, broker: string): Promise<any> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        return (await axios.get(`${apiBaseUrl}/symbol_info/${symbol}`)).data;
      } catch (error) {
        console.error('Error retrieving symbol info:', error);
        return null;
      }
    default:
      console.error('Unsupported broker for symbolInfo');
      return null;
  }
}

async function precisionInfo(symbol: string, broker: string): Promise<number> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        return (await axios.get(`${apiBaseUrl}/precision_info/${symbol}`)).data;
      } catch (error) {
        console.error('Error retrieving precision info:', error);
        return 0;
      }
    default:
      console.error('Unsupported broker for precisionInfo');
      return 0;
  }
}

async function fundingLongInfo(
  symbol: string,
  broker: string,
): Promise<number> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        return (await axios.get(`${apiBaseUrl}/funding_long_info/${symbol}`))
          .data;
      } catch (error) {
        console.error('Error retrieving funding long info:', error);
        return 0;
      }
    default:
      console.error('Unsupported broker for fundingLongInfo');
      return 0;
  }
}

async function fundingShortInfo(
  symbol: string,
  broker: string,
): Promise<number> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        return (await axios.get(`${apiBaseUrl}/funding_short_info/${symbol}`))
          .data;
      } catch (error) {
        console.error('Error retrieving funding short info:', error);
        return 0;
      }
    default:
      console.error('Unsupported broker for fundingShortInfo');
      return 0;
  }
}

async function minAmountAssetInfo(
  symbol: string,
  broker: string,
): Promise<number> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        return (
          await axios.get(`${apiBaseUrl}/min_ammount_asset_info/${symbol}`)
        ).data;
      } catch (error) {
        console.error('Error retrieving minimum amount asset info:', error);
        return 0;
      }
    default:
      console.error('Unsupported broker for minAmountAssetInfo');
      return 0;
  }
}

async function maxAmountAssetInfo(
  symbol: string,
  broker: string,
): Promise<number> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        return (
          await axios.get(`${apiBaseUrl}/max_ammount_asset_info/${symbol}`)
        ).data;
      } catch (error) {
        console.error('Error retrieving maximum amount asset info:', error);
        return 0;
      }
    default:
      console.error('Unsupported broker for maxAmountAssetInfo');
      return 0;
  }
}

async function totalOpenAmountInfo(symbol: string): Promise<number> {
  const mt5Ticker = getMT5Ticker(symbol);
  const broker = getBrokerFromAsset(symbol);
  if (!mt5Ticker || !broker) {
    return 0;
  }
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        return (
          await axios.get(`${apiBaseUrl}/get_total_open_amount/${symbol}`)
        ).data;
      } catch (error) {
        console.error('Error retrieving total open amount info:', error);
        return 0;
      }
    default:
      console.error('Unsupported broker for totalOpenAmountInfo');
      return 0;
  }
}

export {
  totalOpenAmountInfo,
  getTotalOpenAmount,
  retrieveLatestTick,
  retrieveAllSymbols,
  manageSymbolInventory,
  retrieveMaxNotional,
  minAmountSymbol,
  symbolInfo,
  precisionInfo,
  fundingLongInfo,
  fundingShortInfo,
  minAmountAssetInfo,
  maxAmountAssetInfo,
  retrieveLatestTicks,
};
