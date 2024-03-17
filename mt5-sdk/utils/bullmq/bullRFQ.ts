import dotenv from 'dotenv';

dotenv.config();

import { Queue, Worker } from 'bullmq';
import { config } from '../../config';
import { RfqWebsocketClient } from '@pionerfriends/api-client';

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

async function setupBullMQ(token: string): Promise<void> {
  const websocketClient = new RfqWebsocketClient(
    (message: RfqResponse) => {
      rfqQueue.add('rfq', message);
    },
    (error) => {
      console.error('WebSocket error:', error);
    },
  );

  await websocketClient.startWebSocket(token);

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
      removeOnFail: { count: 0 }
    },
  );
}

export { setupBullMQ };


