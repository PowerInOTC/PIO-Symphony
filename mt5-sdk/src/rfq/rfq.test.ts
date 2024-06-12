// pnpm jest -- rfq.test.ts

import {
  PionerWebsocketClient,
  QuoteResponse,
  WebSocketType,
} from '@pionerfriends/api-client';
import { getToken } from '../utils/init';

// test websocket in @/test2.ts
export async function testWebSocketQuote() {
  try {
    const token = await getToken(1);

    const quoteClient = new PionerWebsocketClient<WebSocketType.LiveQuotes>(
      WebSocketType.LiveQuotes,
      (message: QuoteResponse) => {
        console.log('Received Quote:', message);
      },
      () => console.log('WebSocket Open'),
      () => console.log('WebSocket Closed'),
      () => console.log('WebSocket Reconnected'),
      (error: Error) => console.error('WebSocket Error:', error),
    );

    await quoteClient.startWebSocket(token);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}
