import { manageSymbolInventory, verifyTradeOpenable } from './dispatcher';
import { getTripartyLatestPrice } from './tripartyPrice';
import { minAmountSymbol } from '../broker/minAmount';
import { getFirst12Characters } from '../broker/utils';
import { getOpenPositions, Position } from '../broker/dispatcher';
import { getMT5Ticker, getBrokerFromAsset } from '../configBuilder/configRead';

function isPositionOpen(
  positions: Position[],
  symbol: string,
  bContractId: string,
  isLong: boolean,
): boolean {
  const result = positions.some(
    (position) =>
      position.symbol === symbol &&
      position.comment.startsWith(bContractId) &&
      position.type === (isLong ? 0 : 1),
  );
  console.log(
    `isPositionOpen(${symbol}, ${bContractId}, ${isLong}): ${result}`,
  );
  return result;
}

export async function hedger(
  pair: string,
  price: number,
  bContractId: string,
  amount: number,
  isLong: boolean,
  isOpen: boolean,
) {
  try {
    const positions: Position[] = await getOpenPositions('mt5.ICMarkets');
    console.log('Open positions:', positions);

    bContractId = getFirst12Characters(bContractId);

    const [assetA, assetB] = pair.split('/');
    const mt5TickerA = getMT5Ticker(assetA);
    const mt5TickerB = getMT5Ticker(assetB);
    const brokerA = getBrokerFromAsset(assetA);
    const brokerB = getBrokerFromAsset(assetB);

    if (!mt5TickerA || !mt5TickerB || !brokerA || !brokerB) {
      return false;
    }

    const isAssetAPositionOpen = isPositionOpen(
      positions,
      mt5TickerA,
      bContractId,
      isLong,
    );
    const isAssetBPositionOpen = isPositionOpen(
      positions,
      mt5TickerB,
      bContractId,
      !isLong,
    );

    try {
      let tx1 = true;
      let tx2 = true;

      if (isOpen) {
        if (!isAssetAPositionOpen) {
          console.log(mt5TickerA, amount, bContractId, isLong, isOpen);
          tx1 = await manageSymbolInventory(
            mt5TickerA,
            amount,
            bContractId,
            isLong,
            isOpen,
            brokerA,
          );
          console.log(`Opened position for ${assetA}`);
        } else {
          console.log(`Position for ${assetA} is already open`);
        }

        if (!isAssetBPositionOpen) {
          console.log(mt5TickerB, amount, bContractId, !isLong, isOpen);

          tx2 = await manageSymbolInventory(
            mt5TickerB,
            amount,
            bContractId,
            !isLong,
            isOpen,
            brokerB,
          );
          console.log(`Opened position for ${assetB}`);
        } else {
          console.log(`Position for ${assetB} is already open`);
        }
      } else {
        if (isAssetAPositionOpen) {
          tx1 = await manageSymbolInventory(
            mt5TickerA,
            amount,
            bContractId,
            isLong,
            isOpen,
            brokerA,
          );
          console.log(`Closed position for ${assetA}`);
        } else {
          console.log(`Position for ${assetA} is not open`);
        }

        if (isAssetBPositionOpen) {
          tx2 = await manageSymbolInventory(
            mt5TickerB,
            amount,
            bContractId,
            !isLong,
            isOpen,
            brokerB,
          );
          console.log(`Closed position for ${assetB}`);
        } else {
          console.log(`Position for ${assetB} is not open`);
        }
      }

      if (!tx1 || !tx2) {
        console.log('Issue with position management');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error managing symbol inventory:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in manageSymbolInventory:', error);
    throw error;
  }
}
