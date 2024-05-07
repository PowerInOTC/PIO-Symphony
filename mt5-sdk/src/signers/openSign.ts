import dotenv from 'dotenv';
dotenv.config();

import {
  QuoteRequest,
  RfqResponse,
  RfqWebsocketClient,
  getPayloadAndLogin,
  getSignedWrappedOpenQuotes,
  sendSignedFillOpenQuote,
  SignedFillOpenQuoteRequest,
  signedWrappedOpenQuoteResponse,
} from '@pionerfriends/api-client';
import { Worker } from 'bullmq';
import { config } from '../config';
import { signOpenToFill } from './signOpenToFill';
import { logger, rfqQueue, wallet } from '../utils/init';
import { sendErrorToTelegram } from '../utils/telegram';

export async function processQuotes(
  start: number,
  token: string,
): Promise<void> {
  try {
    const response = await getSignedWrappedOpenQuotes(
      '1.0',
      64165,
      true,
      start,
      undefined,
      config.publicKeys?.split(',')[0],
      undefined,
      token,
    );

    if (response && response.data) {
      response.data.forEach((quote: signedWrappedOpenQuoteResponse) => {
        rfqQueue.add('rfq', quote);
      });
    }

    const end = Date.now();
    setTimeout(() => {
      processQuotes(end, token);
    }, 300);
  } catch (error) {
    console.error('Error processing quotes:', error);
  }
}

export function startSignedOpenWorker(token: string): void {
  new Worker(
    'signedOpen',
    async (job) => {
      try {
        const data: signedWrappedOpenQuoteResponse = job.data;
        logger.info(`Signed Open: ${JSON.stringify(data)}`);
        const fill: SignedFillOpenQuoteRequest = await signOpenToFill(data);
        sendSignedFillOpenQuote(fill, token);
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
    },
  );
}

async function index(): Promise<void> {
  try {
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
        console.error('WebSocket error:', error);
      },
    );

    await websocketClient.startWebSocket(token);

    new Worker(
      'rfq',
      async (job) => {
        try {
          const data: signedWrappedOpenQuoteResponse = job.data;
          logger.info(`Signed Open: ${JSON.stringify(data)}`);
          const fill: SignedFillOpenQuoteRequest = await signOpenToFill(data);

          sendSignedFillOpenQuote(fill, token);
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
      },
    );

    const startInitial = 1714897507 * 1000;
    processQuotes(startInitial, token);
  } catch (error: any) {
    sendErrorToTelegram(error);
  }
}

index();
