import { fetchPositions, getCachedPositions } from './cachePositions';
import { getPionSignature } from '@pionerfriends/api-client';
import { updatePriceAndDefault } from '../../blockchain/write';
import { getToken } from '../../utils/init';
import { PionResult, pionSignType } from '../../blockchain/types';
import { config } from '../../config';
import { getPionSignatureWithRetry } from '../../utils/pion';
import { convertToBytes32 } from '../../utils/ethersUtils';
import { ethers } from 'ethers';
import { parseUnits, formatUnits } from 'viem';

describe('pionTest', () => {
  jest.setTimeout(30000);
  let token: string;
  let pionerV1Open: string;
  let pionerV1Wrapper: string;
  let chainId: string;
  let userId: number;
  let hedgerId: number;

  it('should get Pion signature', async () => {
    token = await getToken(config.hedgerId);
    const assetAId = 'forex.GBPUSD';
    const assetBId = 'forex.EURUSD';
    const price = '0.8';
    const quantity = '5';
    const expiryTimestamp = String(Date.now() + 1000 * 100);
    const options = {
      requestPrecision: '5',
      requestConfPrecision: '5',
      maxTimestampDiff: '600',
      timeout: '10000',
    };

    const pionResult = await getPionSignatureWithRetry(
      assetAId,
      assetBId,
      quantity,
      expiryTimestamp,
      token,
      options,
    );

    const priceSignature: pionSignType = {
      appId: pionResult.result.data.signParams[0].value,
      reqId: pionResult.result.data.signParams[1].value,
      requestassetHex: convertToBytes32(`${assetAId}/${assetBId}`),
      requestPairBid: pionResult.result.data.signParams[3].value,
      requestPairAsk: pionResult.result.data.signParams[4].value,
      requestConfidence: formatUnits(
        parseUnits(pionResult.result.data.signParams[5].value, 0),
        18,
      ),
      requestSignTime: pionResult.result.data.signParams[6].value,
      requestPrecision: formatUnits(
        parseUnits(pionResult.result.data.signParams[7].value, 0),
        18,
      ),
      signature: pionResult.result.signatures[0].signature,
      owner: pionResult.result.signatures[0].owner,
      nonce: pionResult.result.data.init.nonceAddress,
    };
    console.log('priceSignature:', priceSignature);

    const bContractId = '1';
    const accountId = 0;
    const chainId = config.activeChainId;

    const tx = await updatePriceAndDefault(
      priceSignature,
      bContractId,
      accountId,
      chainId,
    );
    //console.log('tx:', tx);

    expect(pionResult).toBeDefined();
    expect(tx).toBeDefined();
    expect(pionResult.success).toBeTruthy();
  });
});
