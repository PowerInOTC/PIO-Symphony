import { getToken } from '../utils/init';
import { PionResult, pionSignType } from '../blockchain/types';
import { config } from '../config';
import { getPionSignatureWithRetry } from '../utils/pion';

describe('pionTest', () => {
  let token: string;
  let pionerV1Open: string;
  let pionerV1Wrapper: string;
  let chainId: string;
  let userId: number;
  let hedgerId: number;

  it('should get Pion signature', async () => {
    token = await getToken(config.hedgerId);
    const assetAId = 'forex.EURUSD';
    const assetBId = 'forex.USDCHF';
    const price = '0.8';
    const quantity = '5';
    const expiryTimestamp = String(Date.now() + 1000 * 5);
    const options = {
      requestPrecision: '5',
      requestConfPrecision: '5',
      maxTimestampDiff: '0',
      timeout: '10000',
    };

    const pionResult = await getPionSignatureWithRetry(
      assetAId,
      assetBId,
      price,
      price,
      quantity,
      expiryTimestamp,
      token,
      options,
    );

    console.log('Pion Result:', pionResult);

    expect(pionResult).toBeDefined();
    expect(pionResult.success).toBeTruthy();
  });
});
