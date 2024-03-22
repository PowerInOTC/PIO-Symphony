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
} from '@pionerfriends/api-client';

const rfqQueue = new Queue('rfq', {
  connection: {
    host: config.bullmqRedisHost,
    port: config.bullmqRedisPort,
    password: config.bullmqRedisPassword,
  },
});

async function bullExample(): Promise<void> {
  console.log('test');
  const rpcURL = 'https://rpc.sonic.fantom.network/';
  const rpcKey = '';
  const provider: ethers.Provider = new ethers.JsonRpcProvider(
    `${rpcURL}${rpcKey}`,
  );
  const wallet = new ethers.Wallet(
    'b63a221a15a6e40e2a79449c0d05b9a1750440f383b0a41b4d6719d7611607b4',
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
    },
  );
  await websocketClient.startWebSocket(token);

  const rfq = {
    chainId: 80001,
    expiration: 315360000,
    assetAId: 'crypto.BTC',
    assetBId: 'crypto.ETH',
    sPrice: '99.99',
    sQuantity: '99.99',
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
    lPrice: '99.99',
    lQuantity: '99.99',
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

  for (let i = 0; i < 10; i++) {
    await sendRfq(rfq, token);
  }
}

bullExample();
