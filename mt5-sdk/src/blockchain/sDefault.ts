import { getPionSignature } from '@pionerfriends/api-client';
import { updatePriceAndDefault } from './write';
import { BOracle, BContract } from '@pionerfriends/blockchain-client';
import { getbContract, getbOracle } from './read';
import { convertFromBytes32 } from '../utils/ethersUtils';
import { getTripartyLatestPrice } from '../broker/tripartyPrice';
import { getToken } from '../utils/init';
import { PionResult, pionSignType } from './types';

export async function sDefault(bContractId: bigint) {
  const token = await getToken();
  const bContract: BContract = await getbContract(bContractId, '64165');
  const bOracle: BOracle = await getbOracle(bContract.oracleId, '64165');

  const assetHex: string = convertFromBytes32(bOracle.assetHex);
  const [assetAId, assetBId]: string[] = assetHex.split('/');

  const price = await getTripartyLatestPrice(assetHex);

  const pionResponse = await getPionSignature(
    assetAId,
    assetBId,
    String(price.bid),
    String(price.ask),
    String(bOracle.maxConfidence),
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

  await updatePriceAndDefault(
    priceSignature,
    bContractId,
    bContract.oracleId,
    0,
    '64165',
  );
}