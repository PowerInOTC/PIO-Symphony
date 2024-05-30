import { RfqRequest } from '@pionerfriends/api-client';
import dotenv from 'dotenv';
import { getMT5LatestPrice } from './broker/mt5Price';
import { getTripartyLatestPrice } from './broker/tripartyPrice';
import { getBrokerMaxNotional } from './broker/brokerMaxNotional';
import { getTotalOpenAmount } from './broker/totalOpenAmountModule';
import { minAmountSymbol } from './broker/minAmount';
import {
  manageSymbolInventory,
  totalOpenAmountInfo,
  verifyTradeOpenable,
} from './broker/dispatcher';
import { hedger } from './broker/inventory';
import {
  adjustQuantities,
  getPairConfig,
  getProxyTicker,
} from './configBuilder/configRead';
import { getToken } from './utils/init';

import { wallets } from './utils/init';
import { config } from './config';

async function bullExample(): Promise<void> {
  const token = await getToken();

  const chainId = 64165;
  const assetAId = 'forex.EURUSD';
  const assetBId = 'stock.nasdaq.AAPL';
  const Leverage = 100;
  let bid = 0;
  let ask = 0;
  let sQuantity = 100;
  let lQuantity = 101;
  const assetHex = `${assetAId}/${assetBId}`;

  const pairPrices = await getTripartyLatestPrice(assetHex);
  bid = pairPrices.bid;
  ask = pairPrices.ask;

  const adjustedQuantities = await adjustQuantities(
    bid,
    ask,
    sQuantity,
    lQuantity,
    assetAId,
    assetBId,
    Leverage,
  );
  sQuantity = adjustedQuantities.sQuantity;
  lQuantity = adjustedQuantities.lQuantity;

  const lConfig = await getPairConfig(
    assetAId,
    assetBId,
    'long',
    Leverage,
    ask * lQuantity,
  );
  const sConfig = await getPairConfig(
    assetAId,
    assetBId,
    'long',
    Leverage,
    ask * lQuantity,
  );
  let lInterestRate = lConfig.funding;
  let sInterestRate = sConfig.funding;

  const rfq: RfqRequest = {
    chainId: chainId,
    expiration: String(10000),
    assetAId: assetAId,
    assetBId: assetBId,
    sPrice: String(bid),
    sQuantity: String(sQuantity),
    sInterestRate: String(sInterestRate),
    sIsPayingApr: true,
    sImA: String(sConfig.imA),
    sImB: String(sConfig.imA),
    sDfA: String(sConfig.imA),
    sDfB: String(sConfig.imA),
    sExpirationA: String(3600),
    sExpirationB: String(3600),
    sTimelockA: String(3600),
    sTimelockB: String(3600),
    lPrice: String(ask),
    lQuantity: String(lQuantity),
    lInterestRate: String(lInterestRate),
    lIsPayingApr: true,
    lImA: String(lConfig.imA),
    lImB: String(lConfig.imB),
    lDfA: String(lConfig.dfA),
    lDfB: String(lConfig.dfB),
    lExpirationA: String(3600),
    lExpirationB: String(3600),
    lTimelockA: String(3600),
    lTimelockB: String(3600),
  };

  const bob = await getProxyTicker('ABBV');
  console.log(bob);

  try {
    let counter = 100;
    const price = getTripartyLatestPrice('forex.GBPUSD/forx.EURUSD');
    console.log(price);

    /*

    brokerHealth('mt5.ICMarkets', 5000, 1);
    startTotalOpenAmountInfo('EURUSD', 'EURUSD');
    /*
 const pair = 'forex.EURUSD/forex.GBPUSD';
    const price = 0.858;
    const bContractId = 0;
    const amount = 1000;
    const isLong = true;
    const isOpen = false;
      const isPassed = await hedger(
        pair,
        price,
        bContractId,
        amount,
        isLong,
        isOpen,
      );*/

    setInterval(async () => {
      /*
      sendRfq(rfq, token);*/
      counter++;
    }, 7000);
  } catch (error: any) {
    if (error instanceof Error) {
      console.error(error);
    } else {
      console.error('An unknown error occurred');
    }
  }
}

bullExample();
