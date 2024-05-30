import dotenv from 'dotenv';
dotenv.config();

import {
  QuoteRequest,
  RfqResponse,
  PionerWebsocketClient,
  getPayloadAndLogin,
  sendQuote,
  WebSocketType,
} from '@pionerfriends/api-client';
import { Worker, Queue, Job } from 'bullmq';
import { config } from '../config';
import { rfqToQuote } from './rfq';

const rfqQueue = new Queue('rfq', {
  connection: {
    host: config.bullmqRedisHost,
    port: config.bullmqRedisPort,
    password: config.bullmqRedisPassword,
  },
});

export function startRfqWorker(token: string): void {
  new Worker<RfqResponse>(
    'rfq',
    async (job: Job<RfqResponse>) => {
      try {
        const data: RfqResponse = job.data;
        console.info(`RFQ: ${data.assetAId}/ ${data.assetBId}`);
        const quote: QuoteRequest = await rfqToQuote(data);
        sendQuote(quote, token);
        quote.sMarketPrice = (Number(quote.sMarketPrice) * 1.001).toString();
        quote.lMarketPrice = (Number(quote.lMarketPrice) / 1.001).toString();
      } catch (error) {
        console.error(`Error processing job: ${error}`);
      }
    },
    {
      connection: {
        host: config.bullmqRedisHost,
        port: config.bullmqRedisPort,
        password: config.bullmqRedisPassword,
      },
      removeOnComplete: { count: 0 },
    },
  );
}

export async function processRfqs(token: string): Promise<void> {
  try {
    const websocketClient = new PionerWebsocketClient<WebSocketType.LiveRfqs>(
      WebSocketType.LiveRfqs,
      async (message: RfqResponse) => {
        try {
          await rfqQueue.add('rfq', message);
        } catch (error) {
          console.error('Error adding RFQ to queue:', error);
        }
      },
      () => console.log('Quote Open'),
      () => console.log('Quote Closed'),
      () => console.log('Quote Reconnected'),
      (error: Error) => console.error('Quote Error:', error),
    );

    await websocketClient.startWebSocket(token);
  } catch (error) {
    console.error('Error processing RFQs:', error);
  }
}

export async function startRfqProcess(token: string): Promise<void> {
  try {
    startRfqWorker(token);
    await processRfqs(token);
  } catch (error: any) {
    console.error(error);
  }
}
