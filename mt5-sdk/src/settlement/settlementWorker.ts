import { getPositions } from '@pionerfriends/api-client';
import { sDefault } from './S&L';

async function settlementWorker(token: string): Promise<void> {
  try {
    const chainId = 64165;
    const response = await getPositions(chainId, token, { onlyActive: true });
    if (response && response.data) {
      const positions = response.data;

      /** settle&liquidate if im is lacking */
      for (const position of positions) {
        const { id, imA, imB, entryPrice, mtm } = position;

        const imAValue = parseFloat(imA);
        const imBValue = parseFloat(imB);
        const entryPriceValue = parseFloat(entryPrice);
        const lastPriceValue = parseFloat(mtm);

        const upnl =
          (lastPriceValue - entryPriceValue) * Math.max(imAValue, imBValue);

        if (imAValue * 0.8 < -upnl || imBValue * 0.8 < -upnl) {
          console.log(`Position ${id} has reached the threshold!`);
          await sDefault(
            position.bContractId.toString(),
            position.symbol,
            lastPriceValue,
            String(chainId),
          );
        }
      }

      /** verify position is still open in either onchain and broker */
      for (const position of positions) {
        const { id, bContractId, symbol } = position;
      }

      setTimeout(() => settlementWorker(token), 1000);
    } else {
      console.error('Invalid response from getPositions');
      setTimeout(() => settlementWorker(token), 1000);
    }
  } catch (error) {
    console.error('Error checking positions:', error);
    setTimeout(() => settlementWorker(token), 1000);
  }
}
