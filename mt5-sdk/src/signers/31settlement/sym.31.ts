// settlementWorker.ts
import { fetchPositions, getCachedPositions } from './cachePositions';
import { updatePriceAndDefault } from '../../blockchain/write';
import { getPionSignature, PionResult } from '@pionerfriends/api-client';
import { pionSignType } from '../../blockchain/types';
import { getTripartyLatestPrice } from '../../broker/tripartyPrice';
import { getPionSignatureWithRetry } from '../../utils/pion';
import { convertToBytes32 } from '../../utils/ethersUtils';
import { formatUnits, parseUnits } from 'viem';
import { config } from '../../config';

async function settlementWorker(token: string): Promise<void> {
  try {
    await fetchPositions(Number(config.activeChainId), token);
    const cachedPositions = getCachedPositions();

    // Settle & liquidate if IM is lacking
    for (const position of cachedPositions) {
      let { id, imA, imB, entryPrice, mtm, symbol, amount } = position;
      const imAValue = parseFloat(formatUnits(imA, 18));
      const imBValue = parseFloat(formatUnits(imB, 18));
      entryPrice = parseFloat(formatUnits(imB, 18));
      amount = parseFloat(formatUnits(amount, 18));
      const entryPriceValue = entryPrice * amount;
      const { bid, ask } = await getTripartyLatestPrice(symbol);
      const lastPriceValue = (bid * 0.5 + ask * 0.5) * amount;

      const percChange = (entryPriceValue - lastPriceValue) / entryPriceValue;
      console.log(percChange, imAValue, imBValue);

      if (
        imAValue * 0.8 < -percChange / 100 ||
        imBValue * 0.8 < -percChange / 100
      ) {
        console.log(`Position ${id} has reached the threshold!`);
        await defaultAndLiquidation(
          position.bContractId,
          position.symbol,
          token,
        );
      }
    }
  } catch (error) {
    console.error('Error checking positions:', error);
  } finally {
    setTimeout(
      () => settlementWorker(token),
      config.verifyHedgerCloseRefreshRate,
    );
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
  }, config['31RefreshRate']);
}

export async function defaultAndLiquidation(
  bOracleId: string,
  assetHex: string,
  token: string,
) {
  const [assetAId, assetBId]: string[] = assetHex.split('/');

  const confidence = '5';
  const expiryTimestamp = String(Date.now() + 1000 * 100);
  const options = {
    requestPrecision: '5',
    requestConfPrecision: '5',
    maxTimestampDiff: '600',
    timeout: '10000',
  };

  console.log(
    'test31:',
    assetAId,
    assetBId,
    confidence,
    expiryTimestamp,
    token,
    options,
  );

  const pionResult = await getPionSignatureWithRetry(
    assetAId,
    assetBId,
    confidence,
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
    requestSignTime: String(
      Math.floor(
        parseFloat(pionResult.result.data.signParams[6].value) / 1000,
      ) - 100,
    ),
    requestPrecision: formatUnits(
      parseUnits(pionResult.result.data.signParams[7].value, 0),
      18,
    ),
    signature: pionResult.result.signatures[0].signature,
    owner: pionResult.result.signatures[0].owner,
    nonce: pionResult.result.data.init.nonceAddress,
  };
  console.log('priceSignature:', priceSignature);

  const accountId = config.hedgerId;
  const chainId = config.activeChainId;

  const tx = await updatePriceAndDefault(
    priceSignature,
    bOracleId,
    accountId,
    chainId,
  );
  console.log('tx settle:', tx);
}
