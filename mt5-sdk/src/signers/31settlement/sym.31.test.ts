import { fetchPositions, getCachedPositions } from './cachePositions';
import { getPionSignature } from '@pionerfriends/api-client';
import { updatePriceAndDefault } from '../../blockchain/write';
import { getToken } from '../../utils/init';
import { PionResult, pionSignType } from '../../blockchain/types';
import { config } from '../../config';
import { getPionSignatureWithRetry } from '../../utils/pion';
import { convertToBytes32 } from '../../utils/ethersUtils';
import { ethers } from 'ethers';
import { parseUnits } from 'viem';

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
    const assetAId = 'forex.EURUSD';
    const assetBId = 'forex.USDCHF';
    const price = '0.8';
    const quantity = '5';
    const expiryTimestamp = String(Date.now() + 1000 * 100);
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

    console.log(pionResult.result);
    const priceSignature: pionSignType = {
      appId: pionResult.result.appId,
      reqId: ethers.utils.formatBytes32String(pionResult.result.reqId),
      requestassetHex:
        '0x666f7265782e5553444348462f666f7265782e45555255534400000000000000',
      requestPairBid: parseUnits(
        pionResult.result.data.params.requestPairBid,
        18,
      ).toString(),

      requestPairAsk: parseUnits(
        pionResult.result.data.params.requestPairAsk,
        18,
      ).toString(),

      requestConfidence: pionResult.result.data.params.requestConfidence,

      requestSignTime: String(
        Math.floor(
          Number(pionResult.result.data.params.requestSignTime) / 1000,
        ),
      ),

      requestPrecision: '5',
      signature: pionResult.result.signatures[0].signature,
      owner: '0x237A6Ec18AC7D9693C06f097c0EEdc16518d7c21',
      nonce: '0x1365a32bDd33661a3282992D1C334D5aB2faaDc7',
    };
    console.log('priceSignature:', priceSignature);

    const bContractId = '0';
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
