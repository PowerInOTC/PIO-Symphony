import fs from 'fs';
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
import { startHedgerSafetyCheck } from './settlement/hedgerSafetyCheck';
import { startSettlementWorker } from './settlement/settlementWorker';

/**
 * @dev Starting all Workers, Symphony doesn't host DB, every actions answer to live datas from triparty
 */
async function index(): Promise<void> {
  try {
    console.log('Start');
    const token = await getToken();
    console.log(token);

    // Read the configuration from config.json
    const config = JSON.parse(fs.readFileSync('hedger.config.json', 'utf-8'));

    /*** RFQ */

    if (config.rfqProcess) {
      try {
        await startRfqProcess(token);
      } catch (error) {
        console.error('Error starting RFQ process:', error);
      }
    }

    /*** SignOpen */

    if (config.signedOpenWorker) {
      try {
        await processOpenQuotes(token);
        await startSignedOpenWorker(token);
      } catch (error) {
        console.error(
          'Error processing open quotes or starting signed open worker:',
          error,
        );
      }
    }

    /*** SignClose */

    if (config.closeQuotesWorker) {
      try {
        processCloseQuotes(token);
        startCloseQuotesWorker(token);
      } catch (error) {
        console.error(
          'Error processing close quotes or starting signed close worker:',
          error,
        );
      }
    }

    /*** Settlement */

    if (config.settlementWorker) {
      try {
        startSettlementWorker(token);
      } catch (error) {
        console.error(
          'Error processing settlements or starting open positions worker:',
          error,
        );
      }
    }

    /*** Hedger Safety Check */

    if (config.hedgerSafetyCheck) {
      try {
        await startHedgerSafetyCheck(token);
      } catch (error) {
        console.error('Error in Hedger Safety Check:', error);
      }
    }
  } catch (error: any) {
    console.error('Error in index function:', error);
    sendErrorToTelegram(error);
  }
}

index();
