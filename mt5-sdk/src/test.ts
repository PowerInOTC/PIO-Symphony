import {
  QuoteResponse,
  QuoteWebsocketClient,
  RfqRequest,
  getPayloadAndLogin,
  sendRfq,
} from '@pionerfriends/api-client';
import dotenv from 'dotenv';
import {
  mt5Price,
  getLatestPrice,
  initMt5PriceWorker,
} from './broker/mt5Price';
import { tripartyPrice, getTripartyLatestPrice } from './broker/tripartyPrice';
import {
  brokerHealth,
  getLatestMaxNotional,
} from './broker/brokerHealthModule';
import {
  startTotalOpenAmountInfo,
  getTotalOpenAmount,
} from './broker/totalOpenAmountModule';

import { adjustQuantities, getPairConfig } from './configBuilder/configRead';
import { calculatePairPrices } from './forSDK';
import { logger } from './utils/init';
dotenv.config();

import { wallet } from './utils/init';
import { config } from './config';

export let token = '';

async function bullExample(): Promise<void> {
  const tokens = await getPayloadAndLogin(wallet);
  if (!wallet || !tokens) {
    console.log('login failed');
    return;
  }
  token = tokens;

  const websocketClient = new QuoteWebsocketClient(
    (message: QuoteResponse) => {},
    (error) => {
      console.error('WebSocket error:', error);
    },
  );
  await websocketClient.startWebSocket(token);

  const chainId = 64165;
  const assetAId = 'forex.EURUSD';
  const assetBId = 'stock.nasdaq.AAPL';
  const Leverage = 100;
  let bid = 0;
  let ask = 0;
  let sQuantity = 100;
  let lQuantity = 101;
  const assetHex = `${assetAId}/${assetBId}`;
  const pairs: string[] = [assetHex, 'forex.EURUSD/stock.nasdaq.AI'];
  const pairPrices = await calculatePairPrices(pairs, token);
  bid = pairPrices[assetHex]['bid'];
  ask = pairPrices[assetHex]['ask'];

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
  initMt5PriceWorker();
  try {
    let counter = 0;
    mt5Price('EURUSD/GBPUSD', 1000, 60000, 'user1');
    tripartyPrice('forex.EURUSD/forex.GBPUSD', 800, 60000, 'user1');
    brokerHealth('mt5.ICMarkets', 5000, 1);
    startTotalOpenAmountInfo('EURUSD', 'EURUSD');

    setInterval(() => {
      const latestPrice = getLatestPrice('user1', 'EURUSD/GBPUSD');
      const tripartyLatestPrice = getTripartyLatestPrice(
        'user1',
        'forex.EURUSD/forex.GBPUSD',
      );
      const maxNotional = getLatestMaxNotional('mt5.ICMarkets');

      logger.info(latestPrice);
      logger.info(tripartyLatestPrice);
      logger.info(maxNotional);
      logger.info(getTotalOpenAmount('EURUSD', 'EURUSD'));

      sendRfq(rfq, token);
      counter++;
    }, 1000);
  } catch (error: any) {
    if (error instanceof Error) {
      logger.error(error);
    } else {
      logger.error('An unknown error occurred');
    }
  }
}

bullExample();
