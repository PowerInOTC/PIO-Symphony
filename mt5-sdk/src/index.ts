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
import { startHedgerSafetyCheckOpen } from './signers/31settlement/verifyHedgerOpenPositions';
import { startHedgerSafetyCheckClose } from './signers/31settlement/verifyHedgerClosedPositions';
import { startSettlementWorker } from './signers/31settlement/sym.31';
import { startPositionFetching } from './signers/31settlement/cachePositions';
import { config } from './config';
import {
  startBackupOpenSettlementWorker,
  processBackupOpenSettlementWorker,
} from './signers/22OpenQuoteFill/sym.22.backup';

async function index(): Promise<void> {
  try {
    console.log('Start');
    const token = await getToken(0);
    /* Test init ***
    await getToken(1);
    await getToken(2);
    await getToken(3);
    /**************/
    console.log(token);

    const hedgeConfig = JSON.parse(
      fs.readFileSync('hedger.config.json', 'utf-8'),
    );

    if (hedgeConfig.rfqProcess) {
      try {
        await startRfqProcess(token);
      } catch (error) {
        console.error('Error starting RFQ process:', error);
      }
    }

    if (hedgeConfig.signedOpenWorker) {
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

    if (hedgeConfig.closeQuotesWorker) {
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

    if (hedgeConfig.settlementWorker) {
      try {
        startSettlementWorker(token);
      } catch (error) {
        console.error('Error starting settlement worker:', error);
      }
    }

    if (hedgeConfig.hedgerSafetyCheck) {
      try {
        await startHedgerSafetyCheckOpen(token);
        await startHedgerSafetyCheckClose(token);
      } catch (error) {
        console.error('Error in Hedger Safety Check:', error);
      }
    }

    if (hedgeConfig.backupSettlementWorker) {
      try {
        await startBackupOpenSettlementWorker(token);
        await processBackupOpenSettlementWorker(token);
      } catch (error) {
        console.error('Error in Hedger Safety Check:', error);
      }
    }

    if (
      hedgeConfig.hedgerSafetyCheck ||
      hedgeConfig.settlementWorker ||
      hedgeConfig.backupSettlementWorker
    ) {
      try {
        console.log('Cache Positions');
        console.log(config.activeChainId);
        startPositionFetching(Number(config.activeChainId), token);
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
