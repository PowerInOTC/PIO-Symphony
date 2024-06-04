import { getPositions } from '@pionerfriends/api-client';
import { sDefault } from './sDefault';

async function checkPositions(token: string, chainId: number): Promise<void> {
  try {
    const response = await getPositions(chainId, token, { onlyActive: true });
    if (response && response.data) {
      const positions = response.data;

      for (const position of positions) {
        const { id, imA, imB, entryPrice, mtm, chainId } = position;

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

      setTimeout(() => checkPositions(token, chainId), 1000);
    } else {
      console.error('Invalid response from getPositions');
      setTimeout(() => checkPositions(token, chainId), 1000);
    }
  } catch (error) {
    console.error('Error checking positions:', error);
    setTimeout(() => checkPositions(token, chainId), 1000);
  }
}

const token = 'your_token_here';
const chainId = 1;
checkPositions(token, chainId);
