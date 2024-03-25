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
        const data: RfqResponse = job.data;
        logger.info(`Sending RFQ: ${JSON.stringify(data)}`);
        const quote: QuoteRequest = await rfqToQuote(data);
        logger.info(`Sending quote: ${JSON.stringify(quote)}`);
        sendQuote(quote, token);
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
