import { config } from '../config';
import {
  sendSignedFillOpenQuote,
  SignedFillOpenQuoteRequest,
  signedWrappedOpenQuoteResponse,
  PionerWebsocketClient,
  WebSocketType,
  getSignedWrappedOpenQuotes,
} from '@pionerfriends/api-client';
import { Worker, Queue, Job } from 'bullmq';
import { signOpenCheck } from './signOpenCheck';

const signedOpenQueue = new Queue('signedOpen', {
  connection: {
    host: config.bullmqRedisHost,
    port: config.bullmqRedisPort,
    password: config.bullmqRedisPassword,
  },
});

const processedPositions: Set<string> = new Set();

export function startSignedOpenWorker(token: string): void {
  new Worker(
    'signedOpen',
    async (job: Job<signedWrappedOpenQuoteResponse>) => {
      try {
        const quote: signedWrappedOpenQuoteResponse = job.data;
        console.log(`Processing quote: ${JSON.stringify(quote)}`);

        const positionKey = `${quote.signatureOpenQuote}`;
        if (processedPositions.has(positionKey)) {
          console.log(`Skipping duplicate position: ${positionKey}`);
          return;
        }

        const fill = await signOpenCheck(quote);
        const tx = await sendSignedFillOpenQuote(fill, token);

        console.log(tx?.status, tx?.data);

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

export async function processOpenQuotes(token: string): Promise<void> {
  try {
    const websocketClient =
      new PionerWebsocketClient<WebSocketType.LiveWrappedOpenQuotes>(
        WebSocketType.LiveWrappedOpenQuotes,
        async (message: signedWrappedOpenQuoteResponse) => {
          try {
            await signedOpenQueue.add('signedOpen', message);
          } catch (error) {
            console.error('Error adding quote to queue:', error);
          }
        },
        () => {
          console.log('WebSocket OpenQuote opened');
        },
        () => {
          console.log('WebSocket OpenQuote closed');
          // Retry connecting to the WebSocket
          setTimeout(() => {
            websocketClient.startWebSocket(token);
          }, 5000); // Retry after 5 seconds, adjust the delay as needed
        },
        () => {
          console.log('WebSocket OpenQuote reconnected');
        },
        (error: Error) => {
          console.error('WebSocket OpenQuote error:', error);
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

    // Run getSignedWrappedOpenQuotes in parallel every 750ms
    setInterval(async () => {
      try {
        const response = await getSignedWrappedOpenQuotes('v1', 1, token, {
          onlyActive: true,
        });
        const quotes = response?.data;

        if (quotes) {
          for (const quote of quotes) {
            await signedOpenQueue.add('signedOpen', quote);
          }
        }
      } catch (error) {
        console.error('Error fetching signed wrapped open quotes:', error);
      }
    }, 750);
  } catch (error) {
    console.error('Error processing open quotes:', error);
  }
}
