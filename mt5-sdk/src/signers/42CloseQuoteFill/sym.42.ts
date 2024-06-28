import { config } from '../../config';
import {
  signedCloseQuoteResponse,
  PionerWebsocketClient,
  WebSocketType,
  getSignedCloseQuotes,
} from '@pionerfriends/api-client';
import { Worker, Queue, Job } from 'bullmq';
import { signCloseCheck } from './symCheck.42';
import { settleClose } from '../../blockchain/write';
import { closeQuoteSignValueType } from '../../blockchain/types';

const signedCloseQueue = new Queue('signedClose', {
  connection: {
    host: config.bullmqRedisHost,
    port: config.bullmqRedisPort,
    password: config.bullmqRedisPassword,
  },
});

export function startCloseQuotesWorker(token: string): void {
  new Worker(
    'signedClose',
    async (job: Job<signedCloseQuoteResponse>) => {
      try {
        const quote: signedCloseQuoteResponse = job.data;
        //console.log(`Processing quote: ${JSON.stringify(quote)}`);

        const fill = await signCloseCheck(quote);
        console.log(`Close Quote Filled ?: ${fill}`);
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
          console.log('WebSocket CloseQuote  opened');
        },
        () => {
          console.log('WebSocket CloseQuote  closed');
          setTimeout(() => {
            websocketClient.startWebSocket(token);
          }, 5000);
        },
        () => {
          console.log('WebSocket CloseQuote  reconnected');
        },
        (error: Error) => {
          console.error('WebSocket CloseQuote  error:', error);
          if (error.message.includes('400')) {
            // Ignore error 400 and keep the WebSocket connection open
            console.log(
              'Ignoring error 400 and keeping the WebSocket connection open',
            );
          } else {
            websocketClient.closeWebSocket();
          }
        },
      );

    await websocketClient.startWebSocket(token);

    let lastFetchTime = 0;
    const fetchInterval = config['42RefreshRate'];

    setInterval(async () => {
      const currentTime = Date.now();
      if (currentTime - lastFetchTime >= fetchInterval) {
        try {
          const response = await getSignedCloseQuotes(
            '1.0',
            Number(config.activeChainId),
            token,
            {
              onlyActive: true,
              targetAddress: config.publicKeys?.split(',')[0],
            },
          );
          const quotes = response?.data;

          if (quotes) {
            for (const quote of quotes) {
              //console.log(`Adding quote to queue: ${JSON.stringify(quote)}`);
              await signedCloseQueue.add('signedClose', quote);
            }
          }

          lastFetchTime = currentTime;
        } catch (error) {
          console.error('Error fetching signed close quotes:', error);
        }
      }
    }, fetchInterval);
  } catch (error) {
    console.error('Error processing close quotes:', error);
  }
}
