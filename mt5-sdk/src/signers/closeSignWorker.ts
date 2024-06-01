import { config } from '../config';
import {
  signedCloseQuoteResponse,
  PionerWebsocketClient,
  WebSocketType,
  getSignedCloseQuotes,
} from '@pionerfriends/api-client';
import { Worker, Queue, Job } from 'bullmq';
import { signCloseCheck } from './signCloseCheck';
import { settleClose } from '../blockchain/write';
import { closeQuoteSignValueType } from '../blockchain/types';

const signedCloseQueue = new Queue('signedClose', {
  connection: {
    host: config.bullmqRedisHost,
    port: config.bullmqRedisPort,
    password: config.bullmqRedisPassword,
  },
});

const processedPositions: Set<string> = new Set();

export function startCloseQuotesWorker(token: string): void {
  new Worker(
    'signedClose',
    async (job: Job<signedCloseQuoteResponse>) => {
      try {
        const quote: signedCloseQuoteResponse = job.data;
        console.log(`Processing quote: ${JSON.stringify(quote)}`);

        const positionKey = `${quote.signatureClose}`;
        if (processedPositions.has(positionKey)) {
          console.log(`Skipping duplicate position: ${positionKey}`);
          return;
        }

        /** todo */
        const closeQuoteSignValueType: closeQuoteSignValueType = {
          bContractId: quote.chainId,
          price: quote.price,
          amount: quote.amount,
          limitOrStop: String(quote.limitOrStop),
          expiry: Number(quote.expiry),
          authorized: quote.authorized,
          nonce: quote.nonce,
        };

        const fill = await signCloseCheck(quote);
        if (fill) {
          settleClose(
            closeQuoteSignValueType,
            quote.signatureClose,
            1,
            String(quote.chainId),
          );
        }

        processedPositions.add(positionKey);
      } catch (error) {
        console.error(`Error processing job: ${error}`);
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

export async function processCloseQuotes(token: string): Promise<void> {
  try {
    const websocketClient =
      new PionerWebsocketClient<WebSocketType.LiveCloseQuotes>(
        WebSocketType.LiveCloseQuotes,
        async (message: signedCloseQuoteResponse) => {
          try {
            await signedCloseQueue.add('signedClose', message);
          } catch (error) {
            console.error('Error adding quote to queue:', error);
          }
        },
        () => {
          console.log('WebSocket opened');
        },
        () => {
          console.log('WebSocket closed');
          // Retry connecting to the WebSocket
          setTimeout(() => {
            websocketClient.startWebSocket(token);
          }, 5000); // Retry after 5 seconds, adjust the delay as needed
        },
        () => {
          console.log('WebSocket reconnected');
        },
        (error: Error) => {
          console.error('WebSocket error:', error);
          if (error.message.includes('400')) {
            // Ignore error 400 and keep the WebSocket connection open
            console.log(
              'Ignoring error 400 and keeping the WebSocket connection open',
            );
          } else {
            // Close the WebSocket connection for other errors
            websocketClient.closeWebSocket();
          }
        },
      );

    await websocketClient.startWebSocket(token);

    // Run getSignedCloseQuotes in parallel every 750ms
    setInterval(async () => {
      try {
        const response = await getSignedCloseQuotes('v1', 1, token, {
          onlyActive: true,
        });
        const quotes = response?.data;

        if (quotes) {
          for (const quote of quotes) {
            await signedCloseQueue.add('signedClose', quote);
          }
        }
      } catch (error) {
        console.error('Error fetching signed close quotes:', error);
      }
    }, 750);
  } catch (error) {
    console.error('Error processing close quotes:', error);
  }
}
