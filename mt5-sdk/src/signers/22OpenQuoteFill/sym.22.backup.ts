import { config } from '../../config';
import {
  sendSignedFillOpenQuote,
  SignedFillOpenQuoteRequest,
  signedWrappedOpenQuoteResponse,
  getSignedWrappedOpenQuotes,
} from '@pionerfriends/api-client';
import { Worker, Queue, Job } from 'bullmq';
import { settleOpen } from '../../blockchain/write';

const backupOpenSettlementWorkerQueue = new Queue(
  'backupOpenSettlementWorker',
  {
    connection: {
      host: config.bullmqRedisHost,
      port: config.bullmqRedisPort,
      password: config.bullmqRedisPassword,
    },
  },
);

export function startBackupOpenSettlementWorker(token: string): void {
  new Worker(
    'backupOpenSettlementWorker',
    async (job: Job<signedWrappedOpenQuoteResponse>) => {
      try {
        const open: signedWrappedOpenQuoteResponse = job.data;

        const bOracleSignValue = {
          x: open.x,
          parity: open.parity,
          maxConfidence: open.maxConfidence,
          assetHex: open.assetHex,
          maxDelay: open.maxDelay,
          precision: String(open.precision),
          imA: open.imA,
          imB: open.imB,
          dfA: open.dfA,
          dfB: open.dfB,
          expiryA: open.expiryA,
          expiryB: open.expiryB,
          timeLock: open.timeLock,
          signatureHashOpenQuote: open.signatureOpenQuote,
          nonce: open.nonceOpenQuote,
        };

        const openQuoteSignValue = {
          isLong: open.isLong,
          bOracleId: '0',
          price: open.price,
          amount: open.amount,
          interestRate: open.interestRate,
          isAPayingAPR: open.isAPayingApr,
          frontEnd: open.frontEnd,
          affiliate: open.affiliate,
          authorized: open.authorized,
          nonce: open.nonceOpenQuote,
        };

        //console.log(bOracleSignValue, openQuoteSignValue);

        try {
          const isFilled = await settleOpen(
            bOracleSignValue,
            open.signatureBoracle,
            openQuoteSignValue,
            open.signatureOpenQuote,
            open.price,
            config.hedgerId,
            String(open.chainId),
          );
          //console.log(`Settle open onchain response: ${isFilled}`);
        } catch (error) {
          console.error(`Error processing job: ${error}`);
        }
      } catch (error) {}
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

export async function processBackupOpenSettlementWorker(
  token: string,
): Promise<void> {
  try {
    const fetchInterval = config['22RefreshRate'];

    setInterval(async () => {
      try {
        const response = await getSignedWrappedOpenQuotes(
          '1.0',
          Number(config.activeChainId),
          token,
          {
            onlyFilled: true,
            targetAddress: config.publicKeys?.split(',')[0],
          },
        );
        const quotes = response?.data;
        //console.log(`Fetched quotes: ${JSON.stringify(quotes)}`);
        if (quotes) {
          for (const quote of quotes) {
            await backupOpenSettlementWorkerQueue.add(
              'backupOpenSettlementWorker',
              quote,
            );
          }
        }
      } catch (error) {
        console.error('Error fetching signed wrapped open quotes:', error);
      }
    }, fetchInterval);
  } catch (error) {
    console.error('Error processing backup open settlement worker:', error);
  }
}
