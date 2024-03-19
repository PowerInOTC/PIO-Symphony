import dotenv from 'dotenv';
dotenv.config();

import axios, { AxiosResponse } from 'axios';
import { Queue, Worker } from 'bullmq';
import { config } from './config';
import {
  getPayloadAndLogin,
  RfqResponse,
  RfqWebsocketClient,
  sendQuote,
  getQuotes,
  sendRfq,
} from '@pionerfriends/api-client';
import { ethers } from 'ethers';

let token: string = '';

const rpcURL = 'https://rpc.sonic.fantom.network/';
const rpcKey = '';
const provider: ethers.Provider = new ethers.JsonRpcProvider(
  `${rpcURL}${rpcKey}`,
);

let pk: string | undefined;
if (process.env.PRIVATE_KEYS) {
  pk = process.env.PRIVATE_KEYS.split(',')[0];
}

const websocketClient = new RfqWebsocketClient(
  (message: RfqResponse) => {
    rfqQueue.add('rfq', message);
  },
  (error) => {
    console.error('WebSocket error:', error);
  },
);

const rfqQueue = new Queue('rfq', {
  connection: {
    host: config.bullmqRedisHost,
    port: config.bullmqRedisPort,
    password: config.bullmqRedisPassword,
  },
});

async function bullExample(): Promise<void> {
  if (typeof pk === 'string') {
    console.log('pk', pk);
    const wallet = new ethers.Wallet(pk, provider);
    token = (await getPayloadAndLogin(wallet)) ?? '';
  }

  console.log(token);
  await websocketClient.startWebSocket(token);

  const rfq = {
    chainId: 80001,
    expiration: 315360000,
    assetAId: 'forex.EURUSD',
    assetBId: 'forex.USDJPY',
    sPrice: '99.99',
    sQuantity: '99.99',
    sInterestRate: '9.99',
    sIsPayingApr: true,
    sImA: '0.1',
    sImB: '0.1',
    sDfA: '0.025',
    sDfB: '0.025',
    sExpirationA: 3600,
    sExpirationB: 3600,
    sTimelockA: 3600,
    sTimelockB: 3600,
    lPrice: '99.99',
    lQuantity: '99.99',
    lInterestRate: '9.99',
    lIsPayingApr: true,
    lImA: '0.1',
    lImB: '0.1',
    lDfA: '0.25',
    lDfB: '0.25',
    lExpirationA: 3600,
    lExpirationB: 3600,
    lTimelockA: 3600,
    lTimelockB: 3600,
  };

  type QuoteRequest = {
    chainId: number;
    rfqId: string;
    expiration: number;
    sMarketPrice: string;
    sPrice: string;
    sQuantity: string;
    lMarketPrice: string;
    lPrice: string;
    lQuantity: string;
  };

  await sendRfq(rfq, token);

  const worker = new Worker(
    'rfq',
    async (job) => {
      const data: RfqResponse = job.data;
      //const isVerified = await verifyRfq(data);
      const isVerified = true;
      if (isVerified) {
        console.log(data.chainId, data.id);

        const quote: QuoteRequest = {
          chainId: data.chainId,
          rfqId: data.id,
          expiration: 3600,
          sMarketPrice: '99.99',
          sPrice: '99.99',
          sQuantity: '99.99',
          lMarketPrice: '99.99',
          lPrice: '99.99',
          lQuantity: '99.99',
        };
        await sendQuote(quote, token);
      }
      getQuotes(data.id, token)
        .then((response) => {
          console.log(response?.data);
        })
        .catch((error) => {
          console.error(error);
        });
      console.log(`Processing job ${job.id}: ${JSON.stringify(data)}`);
    },
    {
      connection: {
        host: config.bullmqRedisHost,
        port: config.bullmqRedisPort,
        password: config.bullmqRedisPassword,
      },
      removeOnComplete: { count: 0 },
      removeOnFail: { count: 0 },
      limiter: { max: 1, duration: 1000 },

      //settings: { lockDuration: 1000 * 60 * 60 * 24, stalledInterval: 1000 * 60 * 60 * 24, maxStalledCount: 1,
      //  guardInterval: 1000 * 60 * 60 * 24, retryProcessDelay: 1000 * 60 * 60 * 24, backoffStrategies:
      //  { custom: (attemptsMade: number, err: Error) => { return 1000 * 60 * 60 * 24; } } },
    },
  );
}

bullExample();
