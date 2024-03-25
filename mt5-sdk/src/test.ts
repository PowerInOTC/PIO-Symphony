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
import { adjustQuantities, getPairConfig } from './configBuilder/configRead';
import { calculatePairPrices } from './forSDK';

async function bullExample(): Promise<void> {
  console.log('test');
  const rpcURL = 'https://rpc.sonic.fantom.network/';
  const rpcKey = '';
  const provider: ethers.Provider = new ethers.JsonRpcProvider(
    `${rpcURL}${rpcKey}`,
  );
  const wallet = new ethers.Wallet(
    '578c436136413ec3626d3451e89ce5e633b249677851954dff6b56fad50ac6fe',
    provider,
  );

  const token = await getPayloadAndLogin(wallet);
  if (!wallet || !token) {
    console.log('login failed');
    return;
  }

  const websocketClient = new QuoteWebsocketClient(
    (message: QuoteResponse) => {
      console.log(message);
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

  logger.info('hi');
  const pairPrices = await calculatePairPrices(pairs, token);

  logger.info(pairPrices, 'Pair Prices');

  const adjustedQuantities = await adjustQuantities(
    bid,
    ask,
    sQuantity,
    lQuantity,
    assetAId,
    assetBId,
    Leverage,
  );

  // Retrieve adjusted quantities
  sQuantity = adjustedQuantities.sQuantity;
  lQuantity = adjustedQuantities.lQuantity;

  const pairConfig = getPairConfig(
    assetAId,
    assetBId,
    'long',
    Leverage,
    ask * lQuantity,
  );

  //logger.info(pairConfig, 'RFQ');

  const rfq: RfqRequest = {
    chainId: chainId,
    expiration: Math.floor((Date.now() + 3600) / 1000),
    assetAId: assetAId,
    assetBId: assetBId,
    sPrice: String(bid),
    sQuantity: String(sQuantity),
    sInterestRate: '9.99',
    sIsPayingApr: true,
    sImA: '9.99',
    sImB: '9.99',
    sDfA: '9.99',
    sDfB: '9.99',
    sExpirationA: 3600,
    sExpirationB: 3600,
    sTimelockA: 3600,
    sTimelockB: 3600,
    lPrice: String(ask),
    lQuantity: String(lQuantity),
    lInterestRate: '9.99',
    lIsPayingApr: true,
    lImA: '9.99',
    lImB: '9.99',
    lDfA: '9.99',
    lDfB: '9.99',
    lExpirationA: 3600,
    lExpirationB: 3600,
    lTimelockA: 3600,
    lTimelockB: 3600,
  };

  try {
    let counter = 0;
    const interval = setInterval(() => {
      logger.info(counter);
      sendRfq(rfq, token);
      counter++;
    }, 5000);
  } catch (error: any) {
    if (error instanceof Error) {
      logger.error(error);
    } else {
      logger.error('An unknown error occurred');
    }
  }
}

bullExample();
