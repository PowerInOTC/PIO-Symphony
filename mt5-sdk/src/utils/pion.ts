import { PionResult } from '../blockchain/types';
import { getPionSignature } from '@pionerfriends/api-client';
import { getTripartyLatestPrice } from '../broker/tripartyPrice';
import { config } from '../config';
import { AxiosResponse, AxiosRequestConfig } from 'axios';

export async function getPionSignatureWithRetry(
  assetAId: string,
  assetBId: string,
  bid: string,
  ask: string,
  confidence: string,
  expiryTimestamp: string,
  token: string,
  options: Record<string, string>,
  retryInterval = 500,
  timeout = 10000,
): Promise<PionResult> {
  if (options.maxTimestampDiff == '0' && config.isPionLive == 'false') {
    console.log('Using mock Pion response');
    const mockPionValues = {
      appId: '12345',
      reqId: 'REQ123456',
      requestPairBid: String(Number(bid) * 1e18),
      requestPairAsk: String(Number(ask) * 1e18),
      requestConfidence: confidence,
      requestSignTime: Date.now().toString(),
      signature:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    };
    const mockData = {
      success: true,
      result: {
        confirmed: true,
        reqId: mockPionValues.reqId,
        app: 'PionApp',
        appId: mockPionValues.appId,
        method: 'getSignature',
        deploymentSeed: '0xabcdef1234567890',
        nSign: 1,
        gwAddress: '0x1234567890123456789012345678901234567890',
        data: {
          uid: 'UID123456789',
          params: {
            asset1: 'BTC',
            asset2: 'USD',
            requestPairBid: mockPionValues.requestPairBid,
            requestPairAsk: mockPionValues.requestPairAsk,
            requestConfidence: mockPionValues.requestConfidence,
            requestSignTime: mockPionValues.requestSignTime,
          },
          timestamp: 1687363200000,
          result: {
            asset1: 'BTC',
            asset2: 'USD',
            requestPairBid: mockPionValues.requestPairBid,
            requestPairAsk: mockPionValues.requestPairAsk,
            pairBid: '100100000',
            pairAsk: '100400000',
            confidence: '97',
            requestConfidence: mockPionValues.requestConfidence,
            requestSignTime: mockPionValues.requestSignTime,
            oldestTimestamp: '1687362900',
          },
          resultHash:
            '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
          signParams: [
            { name: 'asset1', type: 'string', value: 'BTC' },
            { name: 'asset2', type: 'string', value: 'USD' },
          ],
          init: {
            nonceAddress: '0x2468101214161820222426283032343638',
          },
        },
        startedAt: 1687363190000,
        confirmedAt: 1687363200000,
        signatures: [
          {
            owner: '0x237A6Ec18AC7D9693C06f097c0EEdc16518d7c21',
            ownerPubKey: {
              x: '0x3456789012345678901234567890123456789012345678901234567890123456',
              yParity: '0x01',
            },
            signature: mockPionValues.signature,
          },
        ],
      },
    };
    return mockData as unknown as PionResult;
  }

  const price = await getTripartyLatestPrice('${assetAId}/${assetBId}');

  const maxRetries = Math.floor(timeout / retryInterval);
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const pionResponse = await getPionSignature(
        assetAId,
        assetBId,
        String(price.bid),
        String(price.ask),
        confidence,
        expiryTimestamp,
        token,
        options,
      );
      console.log('Pion response:', pionResponse);

      if (pionResponse?.data?.success) {
        return pionResponse.data as PionResult;
      }
    } catch (e: any) {
      console.error('Error fetching Pion signature:', e);
      if (e.response) {
        console.error('Response status:', e.response.status);
        console.error('Response data:', e.response.data);
      }
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, retryInterval));
  }

  throw new Error(
    'Failed to get a successful Pion signature within the timeout period.',
  );
}
