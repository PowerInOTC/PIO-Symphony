// settlementWorker.test.ts
import { fetchPositions, getCachedPositions } from './cachePositions';
import { getPionSignature } from '@pionerfriends/api-client';
import { updatePriceAndDefault } from '../../blockchain/write';
import { getToken } from '../../utils/init';
import { PionResult, pionSignType } from '../../blockchain/types';
import { config } from '../../config';

describe('settlementWorker', () => {
  let token: string;
  let pionerV1Open: string;
  let pionerV1Wrapper: string;
  let chainId: string;
  let userId: number;
  let hedgerId: number;

  it('should get Pion signature', async () => {
    token = await getToken(config.hedgerId);
    const assetAId = 'forex.EURUSD';
    const assetBId = 'forex.USDCHEF';
    const price = 0.8;

    const pionResponse = await getPionSignature(
      assetAId,
      assetBId,
      String(price),
      String(price),
      String(5),
      String(Date.now() + 1000 * 5),
      token,
      {
        requestPrecision: '5',
        requestConfPrecision: '5',
        maxTimestampDiff: '600',
        timeout: 10000,
      },
    );

    console.log('Pion Response:', pionResponse);

    expect(pionResponse).toBeDefined();
    expect(pionResponse?.data.success).toBeTruthy();

    const pionResult: PionResult = pionResponse?.data as PionResult;
    console.log('Pion Result:', pionResult);
  });
});
