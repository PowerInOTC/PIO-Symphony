import dotenv from 'dotenv';
dotenv.config();
import {
  RfqResponse,
  RfqWebsocketClient,
  getPayloadAndLogin,
  getSignedWrappedOpenQuotes,
} from '@pionerfriends/api-client';
import { config } from './config';
import { logger, rfqQueue, wallet } from './utils/init';
import { sendErrorToTelegram } from './utils/telegram';
import { startSignedOpenWorker, processQuotes } from './signers/openSign';
import { startRfqWorker } from './rfq/bullRfq';

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

    startSignedOpenWorker(token);
    //startRfqWorker(token);

    const startInitial = Date.now();
    processQuotes(startInitial, token);
  } catch (error: any) {
    sendErrorToTelegram(error);
  }
}

index();
