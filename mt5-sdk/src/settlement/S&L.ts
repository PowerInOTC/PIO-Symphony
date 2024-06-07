import { getPionSignature } from '@pionerfriends/api-client';
import { updatePriceAndDefault } from '../blockchain/write';
import { getToken } from '../utils/init';
import { PionResult, pionSignType } from '../blockchain/types';
import { getBalance } from '../blockchain/read';

export async function sDefault(
  bContractId: string,
  assetHex: string,
  price: number,
  chainId: string,
) {
  const token = await getToken();

  const [assetAId, assetBId]: string[] = assetHex.split('/');

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

  if (!pionResponse || !pionResponse.data) {
    throw new Error('Failed to get Pion signature');
  }

  const pionResult: PionResult = pionResponse.data as PionResult;

  const priceSignature: pionSignType = {
    appId: BigInt(pionResult.result.appId),
    reqId: pionResult.result.reqId,
    requestassetHex:
      pionResult.result.data.params.asset1 +
      '/' +
      pionResult.result.data.params.asset2,
    requestPairBid: BigInt(pionResult.result.data.params.requestPairBid),
    requestPairAsk: BigInt(pionResult.result.data.params.requestPairAsk),
    requestConfidence: BigInt(pionResult.result.data.params.requestConfidence),
    requestSignTime: BigInt(pionResult.result.data.params.requestSignTime),
    requestPrecision: BigInt(5),
    signature: BigInt(pionResult.result.signatures[0].signature),
    owner: '0x237A6Ec18AC7D9693C06f097c0EEdc16518d7c21',
    nonce: '0x1365a32bDd33661a3282992D1C334D5aB2faaDc7',
  };

  await updatePriceAndDefault(priceSignature, bContractId, 0, chainId);
}
