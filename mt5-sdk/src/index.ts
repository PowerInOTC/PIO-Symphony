import dotenv from 'dotenv';
dotenv.config();

import {
  QuoteRequest,
  RfqResponse,
  RfqWebsocketClient,
  getPayloadAndLogin,
  sendQuote,
} from '@pionerfriends/api-client';
import { Worker } from 'bullmq';
import { config } from './config';
import { rfqToQuote } from './rfq/rfq';
import { logger, rfqQueue, wallet } from './utils/init';
import { sendErrorToTelegram } from './utils/telegram';

async function index(): Promise<void> {
  try {
    //sendMessage('RFQ worker started');
    const token = await getPayloadAndLogin(wallet);
    if (!wallet || !token) {
      console.log('login failed');
      return;
    }
    const websocketClient = new RfqWebsocketClient(
      (message: RfqResponse) => {
        rfqQueue.add('rfq', message);
      },
      (error: Error) => {
        // Explicitly specify the type of error
        console.error('WebSocket error:', error);
      },
    );
    await websocketClient.startWebSocket(token);

    new Worker(
      'rfq',
      async (job) => {
        try {
          const data: RfqResponse = job.data;
          logger.info(`RFQ: ${JSON.stringify(data)}`);
          const quote: QuoteRequest = await rfqToQuote(data);
          sendQuote(quote, token);
          quote.sMarketPrice = (Number(quote.sMarketPrice) * 1.001).toString();
          quote.lMarketPrice = (Number(quote.lMarketPrice) / 1.001).toString();
        } catch {
          logger.error(`Error processing job: ${Error}`);
        }
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
  } catch (error: any) {
    sendErrorToTelegram(error);
  }
}

index();
