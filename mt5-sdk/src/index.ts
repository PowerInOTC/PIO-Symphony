import dotenv from 'dotenv';
dotenv.config();
import { sendErrorToTelegram } from './utils/telegram';
import {
  startSignedOpenWorker,
  processOpenQuotes,
} from './signers/openSignWorker';
import {
  startCloseQuotesWorker,
  processCloseQuotes,
} from './signers/closeSignWorker';
import { startRfqProcess } from './rfq/rfqWorker';
import { getToken } from './utils/init';

async function index(): Promise<void> {
  try {
    console.log('Start');
    const token = await getToken();
    console.log(token);

    /*** RFQ */

    try {
      await startRfqProcess(token);
    } catch (error) {
      console.error('Error starting RFQ process:', error);
    }

    /*** SignOpen */

    try {
      await processOpenQuotes(token);
      await startSignedOpenWorker(token);
    } catch (error) {
      console.error(
        'Error processing open quotes or starting signed open worker:',
        error,
      );
    }

    /*** SignClose */

    try {
      processCloseQuotes(token);
      startCloseQuotesWorker(token);
    } catch (error) {
      console.error(
        'Error processing close quotes or starting signed close worker:',
        error,
      );
    }

    /*** Settlement */
    /*
    // Add your Settlement logic here
    try {
      startSettlementWorker(token);
    } catch (error) {
      console.error(
        'Error processing settlements or starting open positions worker:',
        error,
      );
    */
  } catch (error: any) {
    console.error('Error in index function:', error);
    sendErrorToTelegram(error);
  }
}

index();
