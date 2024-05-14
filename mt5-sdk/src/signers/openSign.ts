import { config } from '../config';
import {
  getPayloadAndLogin,
  getSignedWrappedOpenQuotes,
  sendSignedFillOpenQuote,
  SignedFillOpenQuoteRequest,
  signedWrappedOpenQuoteResponse,
} from '@pionerfriends/api-client';
import { Worker, Queue, Job } from 'bullmq';
import { signOpenCheck } from './signOpenCheck';
import { logger, wallet } from '../utils/init';
import { sendErrorToTelegram } from '../utils/telegram';

interface OpenPosition {
  counterparty: string;
  price: string;
  amount: string;
  isLong: boolean;
}

const openPositionsMap = new Map<string, OpenPosition>();
const signedOpenQueue = new Queue('signedOpen', {
  connection: {
    host: config.bullmqRedisHost,
    port: config.bullmqRedisPort,
    password: config.bullmqRedisPassword,
  },
});

export async function processOpenQuotes(
  start: number,
  token: string,
): Promise<void> {
  try {
    console.log('Processing open quotes...');

    const response = await getSignedWrappedOpenQuotes('1.0', 64165, token, {
      /* onlyActive: true,
      start: start,
      end: Date.now(),
      //issuerAddress: config.publicKeys?.split(',')[0],*/
    });
    if (response && response.data) {
      console.log(`Open quotes: ${JSON.stringify(response.data)}`);
      for (const quote of response.data) {
        await signedOpenQueue.add('signedOpen', quote);
      }
    }
    const end = Date.now();
    setTimeout(() => {
      processOpenQuotes(end, token);
    }, 300);
  } catch (error) {
    console.error('Error processing open quotes:', error);
  }
}

export function startSignedOpenWorker(token: string): void {
  new Worker(
    'signedOpen',
    async (job: Job<signedWrappedOpenQuoteResponse>) => {
      try {
        const quote: signedWrappedOpenQuoteResponse = job.data;
        console.log(`Signed Open Quote: ${JSON.stringify(quote)}`);

        const {
          counterpartyAddress,
          price,
          amount,
          isLong,
          signatureOpenQuote,
        } = quote;
        openPositionsMap.set(signatureOpenQuote, {
          counterparty: counterpartyAddress,
          price,
          amount,
          isLong,
        });
      } catch (error) {
        logger.error(`Error processing job: ${error}`);
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
