// settlementWorker.ts
import { fetchPositions, getCachedPositions } from './cachePositions';
import { getPionSignature } from '@pionerfriends/api-client';
import { updatePriceAndDefault } from '../../blockchain/write';
import { PionResult, pionSignType } from '../../blockchain/types';
import { getTripartyLatestPrice } from '../../broker/tripartyPrice';

async function settlementWorker(token: string): Promise<void> {
  try {
    const chainId = 64165;
    await fetchPositions(chainId, token);
    const cachedPositions = getCachedPositions();

    // Settle & liquidate if IM is lacking
    for (const position of cachedPositions) {
      const { id, imA, imB, entryPrice, mtm, symbol, amount } = position;
      const imAValue = parseFloat(imA);
      const imBValue = parseFloat(imB);
      const entryPriceValue = parseFloat(entryPrice) * parseFloat(amount);
      const { bid, ask } = await getTripartyLatestPrice(symbol);
      const lastPriceValue = bid * 0.5 + ask * 0.5 * parseFloat(amount);

      const upnl =
        (lastPriceValue - entryPriceValue) * Math.max(imAValue, imBValue);

      if (imAValue * 0.8 < -upnl || imBValue * 0.8 < -upnl) {
        console.log(`Position ${id} has reached the threshold!`);
        await defaultAndLiquidation(
          position.bContractId.toString(),
          position.symbol,
          lastPriceValue,
          String(chainId),
          token,
        );
      }
    }
  } catch (error) {
    console.error('Error checking positions:', error);
  } finally {
    setTimeout(() => settlementWorker(token), 1000);
  }
}

export function startSettlementWorker(token: string) {
  settlementWorker(token).catch((error) => {
    console.error('Error during verification:', error);
  });

  setInterval(() => {
    settlementWorker(token).catch((error) => {
      console.error('Error during verification:', error);
    });
  }, 2500);
}

export async function defaultAndLiquidation(
  bContractId: string,
  assetHex: string,
  price: number,
  chainId: string,
  token: string,
) {
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
