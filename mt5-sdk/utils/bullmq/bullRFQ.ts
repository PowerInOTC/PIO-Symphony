
import dotenv from 'dotenv';
dotenv.config();

import { Queue, Worker } from 'bullmq';
import { config } from '../../config';
import {
  createWalletAndSignIn,
  sendRfq,
  RfqWebsocketClient,
} from '@pionerfriends/api-client';



type RfqResponse = {
    id: string;
    chainId: number;
    createdAt: number;
    userId: string;
    expiration: number;
    AssetAId: string;
    AssetBId: string;
    sPrice: string;
    sQuantity: string;
    sInterestRate: string;
    sIsPayingApr: boolean;
    sImA: string;
    sImB: string;
    sDfA: string;
    sDfB: string;
    sExpirationA: number;
    sExpirationB: number;
    sTimelockA: number;
    sTimelockB: number;
    lPrice: string;
    lQuantity: string;
    lInterestRate: string;
    lIsPayingApr: boolean;
    lImA: string;
    lImB: string;
    lDfA: string;
    lDfB: string;
    lExpirationA: number;
    lExpirationB: number;
    lTimelockA: number;
    lTimelockB: number;
  };
  
  const rfqQueue = new Queue('rfq', {
    connection: {
      host: config.bullmqRedisHost,
      port: config.bullmqRedisPort,
      password: config.bullmqRedisPassword,
    },
  });

async function bullExample(): Promise<void> {
    const { wallet: wallet, token: token } = await createWalletAndSignIn();
    if (!wallet || !token) {
      console.log('login failed');
      return;
    }
    const websocketClient = new RfqWebsocketClient(
      (message: RfqResponse) => {
        rfqQueue.add('rfq', message);
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
  
    new Worker(
      'rfq',
      async (job) => {
        const data: RfqResponse = job.data;
        console.log(`Processing job ${job.id}: ${JSON.stringify(data)}`);
      },
      {
        connection: {
          host: config.bullmqRedisHost,
          port: config.bullmqRedisPort,
          password: config.bullmqRedisPassword,
        },
        removeOnComplete: { count: 0 },
        //removeOnFail: { count: 0 }
      },
    );
  }
  
  export { bullExample};