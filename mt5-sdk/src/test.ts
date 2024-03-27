import dotenv from 'dotenv';
dotenv.config();

import { config } from './config';
import { Queue, Worker } from 'bullmq';
import { ethers } from 'ethers';
import {
  sendRfq,
  RfqWebsocketClient,
  RfqResponse,
  getPayloadAndLogin,
  QuoteWebsocketClient,
  QuoteResponse,
  RfqRequest,
  getPrices,
} from '@pionerfriends/api-client';
import { sendErrorToTelegram } from './utils/telegram';
import { sendMessage } from './utils/telegram';
import { logger } from './utils/init';
import {
  adjustQuantities,
  getPairConfig,
  // writeProxyTickersToFile,
} from './configBuilder/configRead';
import { calculatePairPrices } from './forSDK';
import { mt5Price } from './broker/mt5Price';

async function bullExample(): Promise<void> {
  const rpcURL = 'https://rpc.sonic.fantom.network/';
  const rpcKey = '';
  const provider: ethers.Provider = new ethers.JsonRpcProvider(
    `${rpcURL}${rpcKey}`,
  );
  const wallet = new ethers.Wallet(
    '578c436136413ec3626d3451e89ce5e633b249677851954dff6b56fad50ac6fe',
    provider,
  );
  logger.info('hi');

  const token = await getPayloadAndLogin(wallet);
  if (!wallet || !token) {
    console.log('login failed');
    return;
  }
  logger.info('hi');

  const websocketClient = new QuoteWebsocketClient(
    (message: QuoteResponse) => {
      //console.log(message);
    },
    (error) => {
      console.error('WebSocket error:', error);
      sendErrorToTelegram(error);
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
  logger.info('hi');
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
    expiration: 10,
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
    sExpirationA: 3600,
    sExpirationB: 3600,
    sTimelockA: 3600,
    sTimelockB: 3600,
    lPrice: String(ask),
    lQuantity: String(lQuantity),
    lInterestRate: String(lInterestRate),
    lIsPayingApr: true,
    lImA: String(lConfig.imA),
    lImB: String(lConfig.imB),
    lDfA: String(lConfig.dfA),
    lDfB: String(lConfig.dfB),
    lExpirationA: 3600,
    lExpirationB: 3600,
    lTimelockA: 3600,
    lTimelockB: 3600,
  };

  try {
    let counter = 0;
    const interval = setInterval(() => {
      logger.info(counter);
      mt5Price('forex.EURUSD', 200, 60000, 'user1');
      //sendRfq(rfq, token);
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
