import { fetchPositions, getCachedPositions } from './cachePositions';
import { getPionSignature } from '@pionerfriends/api-client';
import { updatePriceAndDefault } from '../../blockchain/write';
import { getToken } from '../../utils/init';
import { PionResult, pionSignType } from '../../blockchain/types';
import { config } from '../../config';
import { getPionSignatureWithRetry } from '../../utils/pion';
import { convertToBytes32 } from '../../utils/ethersUtils';
import { ethers } from 'ethers';

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

    console.log(pionResult.result)
    const priceSignature: pionSignType = {
      appId: ethers.BigNumber.from(pionResult.result.appId),
      reqId: ethers.utils.formatBytes32String(pionResult.result.reqId),
      requestassetHex: convertToBytes32(`${assetAId}/${assetBId}`),
      requestPairBid: ethers.BigNumber.from(pionResult.result.data.params.requestPairBid),
      requestPairAsk: ethers.BigNumber.from(pionResult.result.data.params.requestPairAsk),
      requestConfidence: ethers.BigNumber.from(pionResult.result.data.params.requestConfidence),
      requestSignTime: ethers.BigNumber.from(pionResult.result.data.params.requestSignTime),
      requestPrecision: ethers.BigNumber.from("5"),
      signature: pionResult.result.signatures[0].signature,
      owner: "0x237A6Ec18AC7D9693C06f097c0EEdc16518d7c21",
      nonce: "0x1365a32bDd33661a3282992D1C334D5aB2faaDc7"
    };

    //console.log('Pion Result:', pionResult);

    const bContractId = '1';
    const accountId = 0;
    const chainId = '64165';

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
