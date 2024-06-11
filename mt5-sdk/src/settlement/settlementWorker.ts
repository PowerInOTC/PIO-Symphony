// settlementWorker.ts
import { defaultAndLiquidation } from './S&L';
import { fetchPositions, getCachedPositions } from './cachePositions';

async function settlementWorker(token: string): Promise<void> {
  try {
    const chainId = 64165;
    await fetchPositions(chainId, token);
    const cachedPositions = getCachedPositions();

    // Settle & liquidate if IM is lacking
    for (const position of cachedPositions) {
      const { id, imA, imB, entryPrice, mtm } = position;
      const imAValue = parseFloat(imA);
      const imBValue = parseFloat(imB);
      const entryPriceValue = parseFloat(entryPrice);
      const lastPriceValue = parseFloat(mtm);
      const upnl =
        (lastPriceValue - entryPriceValue) * Math.max(imAValue, imBValue);

      if (imAValue * 0.8 < -upnl || imBValue * 0.8 < -upnl) {
        console.log(`Position ${id} has reached the threshold!`);
        await defaultAndLiquidation(
          position.bContractId.toString(),
          position.symbol,
          lastPriceValue,
          String(chainId),
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
