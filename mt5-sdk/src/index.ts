// index.ts
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();
import { sendErrorToTelegram } from './utils/telegram';
import {
  startSignedOpenWorker,
  processOpenQuotes,
} from './signers/22OpenQuoteFill/sym.22';
import {
  startCloseQuotesWorker,
  processCloseQuotes,
} from './signers/42CloseQuoteFill/sym.42';
import { startRfqProcess } from './signers/12rfqFill/sym.12';
import { getToken } from './utils/init';
import { startHedgerSafetyCheckOpen } from './settlement/verifyHedgerOpenPositions';
import { startHedgerSafetyCheckClose } from './settlement/verifyHedgerClosedPositions';
import { startSettlementWorker } from './settlement/settlementWorker';
import { startPositionFetching } from './settlement/cachePositions';

async function index(): Promise<void> {
  try {
    console.log('Start');
    const token = await getToken(0);
    console.log(token);

    const config = JSON.parse(fs.readFileSync('hedger.config.json', 'utf-8'));

    if (config.rfqProcess) {
      try {
        await startRfqProcess(token);
      } catch (error) {
        console.error('Error starting RFQ process:', error);
      }
    }

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

    if (config.settlementWorker) {
      try {
        startSettlementWorker(token);
      } catch (error) {
        console.error('Error starting settlement worker:', error);
      }
    }

    if (config.hedgerSafetyCheck) {
      try {
        await startHedgerSafetyCheckOpen(token);
        await startHedgerSafetyCheckClose(token);
      } catch (error) {
        console.error('Error in Hedger Safety Check:', error);
      }
    }

    if (config.hedgerSafetyCheck || config.settlementWorker) {
      try {
        startPositionFetching(64165, token);
      } catch (error) {
        console.error('Error in Cache Positions:', error);
      }
    }
  } catch (error: any) {
    console.error('Error in index function:', error);
    sendErrorToTelegram(error);
  }
}

index();
