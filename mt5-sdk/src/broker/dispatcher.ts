import axios from 'axios';

//const apiBaseUrl = process.env.FAST_API;
const apiBaseUrl = 'http://20.55.0.76:8000';

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

async function manageSymbolInventory(
  symbol: string,
  amount: number,
  broker: string,
): Promise<boolean> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        return (
          (
            await axios.post(
              `${apiBaseUrl}/manage_symbol_inventory/${symbol}`,
              { amount },
            )
          ).status === 200
        );
      } catch (error) {
        console.error('Error managing symbol inventory:', error);
        return false;
      }
    default:
      console.error('Unsupported broker for manageSymbolInventory');
      return false;
  }
}

async function resetAccount(broker: string): Promise<boolean> {
  switch (broker) {
    case 'mt5.ICMarkets':
      try {
        return (await axios.post(`${apiBaseUrl}/reset_account`)).status === 200;
      } catch (error) {
        console.error('Error resetting account:', error);
        return false;
      }
    default:
      console.error('Unsupported broker for resetAccount');
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

export {
  getTotalOpenAmount,
  retrieveLatestTick,
  retrieveAllSymbols,
  manageSymbolInventory,
  resetAccount,
  retrieveMaxNotional,
  minAmountSymbol,
  symbolInfo,
  precisionInfo,
  fundingLongInfo,
  fundingShortInfo,
  minAmountAssetInfo,
  maxAmountAssetInfo,
};
