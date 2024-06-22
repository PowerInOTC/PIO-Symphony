import dotenv from 'dotenv';
dotenv.config();
import {
  QuoteRequest,
  RfqResponse,
  PionerWebsocketClient,
  getPayloadAndLogin,
  sendQuote,
  WebSocketType,
} from '@pionerfriends/api-client';
import { Worker, Queue, Job } from 'bullmq';
import { config } from '../../config';
import RfqChecker, { ErrorObject } from './symCheck.12';
import { getTripartyLatestPrice } from '../../broker/tripartyPrice';
import { minAmountSymbol } from '../../broker/minAmount';

const rfqQueue = new Queue('rfq', {
  connection: {
    host: config.bullmqRedisHost,
    port: config.bullmqRedisPort,
    password: config.bullmqRedisPassword,
  },
});

export function startRfqWorker(token: string): void {
  new Worker<RfqResponse>(
    'rfq',
    async (job: Job<RfqResponse>) => {
      try {
        const data: RfqResponse = job.data;
        const quote: QuoteRequest | null = await rfqToQuote(data);
        if (quote) {
          console.log(
            data.assetAId,
            data.assetBId,
            data.lQuantity,
            data.lPrice,
          );
          await sendQuote(quote, token);
        } else {
          console.warn('Invalid quote generated. Skipping sending the quote.');
        }
      } catch (error) {
        console.error('Error processing job:', error);
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

export async function processRfqs(token: string): Promise<void> {
  try {
    const websocketClient = new PionerWebsocketClient<WebSocketType.LiveRfqs>(
      WebSocketType.LiveRfqs,
      async (message: RfqResponse) => {
        try {
          await rfqQueue.add('rfq', message);
        } catch (error) {
          console.error('Error adding RFQ to queue:', error);
        }
      },
      () => console.log('Quote Open'),
      () => console.log('Quote Closed'),
      () => console.log('Quote Reconnected'),
      (error: Error) => console.error('Quote Error:', error),
    );
    await websocketClient.startWebSocket(token);
  } catch (error) {
    console.error('Error processing RFQs:', error);
  }
}

export async function startRfqProcess(token: string): Promise<void> {
  try {
    startRfqWorker(token);
    await processRfqs(token);
  } catch (error: any) {
    console.error(error);
  }
}

const rfqToQuote = async (rfq: RfqResponse): Promise<QuoteRequest> => {
  //console.log(rfq);
  const checker = new RfqChecker(rfq);
  checker
    .check()
    .then((errors: ErrorObject[]) => {
      if (errors.length === 0) {
      } else {
        console.log('RFQ failed the following checks:');
        errors.forEach((error) => {
          console.log(`Field: ${error.field}, Value: ${error.value}`);
        });
      }
    })
    .catch((error) => {
      console.error('An error occurred during RFQ checking:', error);
    });

  const tripartyLatestPrice = await getTripartyLatestPrice(
    `${rfq.assetAId}/${rfq.assetBId}`,
  );
  //console.log(`${checkRFQ.assetAId}/${checkRFQ.assetBId}`, tripartyLatestPrice);

  const minAmount = await minAmountSymbol(`${rfq.assetAId}/${rfq.assetBId}`);

  return {
    chainId: rfq.chainId,
    rfqId: rfq.id,
    expiration: rfq.expiration,
    sMarketPrice: (Number(tripartyLatestPrice.bid) * 1.001).toString(),
    sPrice: rfq.sPrice,
    sQuantity: String(rfq.sQuantity),
    lMarketPrice: (Number(tripartyLatestPrice.ask) * 0.999).toString(),
    lPrice: rfq.lPrice,
    lQuantity: String(rfq.lQuantity),
    minAmount: minAmount.toString(),
    maxAmount: Math.floor(
      Math.min(
        minAmount,
        10000 / Math.min(Number(rfq.sPrice), Number(rfq.lPrice)),
      ),
    ).toString(),
  };
};
