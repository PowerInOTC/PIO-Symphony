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
  sendQuote,
  QuoteRequest,
} from '@pionerfriends/api-client';
import { rfqToQuote } from './rfq/rfq';
import { logger, rfqQueue } from './utils/init';
import {
  sendMessage,
  sendErrorToTelegram,
  restartCode,
} from './utils/telegram';

async function index(): Promise<void> {
  try {
    sendMessage('RFQ worker started');

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

    const wallet2 = new ethers.Wallet(
      'ceed6376f9371cd316329c401d99ddcd3b1e3ab0792d4275ff18f6589a2e24af',
      provider,
    );
    const token2 = await getPayloadAndLogin(wallet);
    if (!wallet2 || !token2) {
      console.log('login failed');
      return;
    }

    const wallet3 = new ethers.Wallet(
      'ceed6376f9371cd316329c401d99ddcd3b1e3ab0792d4275ff18f6589a2e24af',
      provider,
    );
    const token3 = await getPayloadAndLogin(wallet);
    if (!wallet3 || !token3) {
      console.log('login failed');
      return;
    }

    const wallet4 = new ethers.Wallet(
      'ceed6376f9371cd316329c401d99ddcd3b1e3ab0792d4275ff18f6589a2e24af',
      provider,
    );
    const token4 = await getPayloadAndLogin(wallet);
    if (!wallet4 || !token4) {
      console.log('login failed');
      return;
    }

    const wallet5 = new ethers.Wallet(
      'ceed6376f9371cd316329c401d99ddcd3b1e3ab0792d4275ff18f6589a2e24af',
      provider,
    );
    const token5 = await getPayloadAndLogin(wallet);
    if (!wallet5 || !token5) {
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
          const quote2 = quote;
          quote2.sMarketPrice = (Number(quote.sMarketPrice) * 1.001).toString();
          quote2.lMarketPrice = (Number(quote.lMarketPrice) / 1.001).toString();
          sendQuote(quote2, token2);
          const quote3 = quote2;
          quote3.sMarketPrice = (
            Number(quote2.sMarketPrice) * 1.001
          ).toString();
          quote3.lMarketPrice = (
            Number(quote2.lMarketPrice) / 1.001
          ).toString();
          sendQuote(quote3, token3);
          const quote4 = quote3;
          quote4.sMarketPrice = (
            Number(quote3.sMarketPrice) * 1.001
          ).toString();
          quote4.lMarketPrice = (
            Number(quote3.lMarketPrice) / 1.001
          ).toString();
          sendQuote(quote4, token4);
          const quote5 = quote4;
          quote5.sMarketPrice = (
            Number(quote4.sMarketPrice) * 1.001
          ).toString();
          quote5.lMarketPrice = (
            Number(quote4.lMarketPrice) / 1.001
          ).toString();
          sendQuote(quote5, token5);
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
