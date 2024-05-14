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
import { startSignedOpenWorker, processOpenQuotes } from './signers/openSign';
import { startRfqWorker } from './rfq/rfqWorker';
import { getToken } from './utils/init';

async function index(): Promise<void> {
  try {
    const token = await getToken();

    /*** RFQ  */
    /*
    const websocketClient = new RfqWebsocketClient(
      (message: RfqResponse) => {
        rfqQueue.add('rfq', message);
      },
      (error: Error) => {
        console.error('WebSocket error:', error);
      },
    );

    await websocketClient.startWebSocket(token);
    //startRfqWorker(token);

    */
    /*** SignOpen  */
    startSignedOpenWorker(token);
    const startInitial = 1714897507 * 1000;
    processOpenQuotes(startInitial, token);

    /*** SignClose  */

    /*** Settlement  */

    /***  */
    //
  } catch (error: any) {
    sendErrorToTelegram(error);
  }
}

index();
