import { manageSymbolInventory, verifyTradeOpenable } from './dispatcher';
import { getTripartyLatestPrice } from './tripartyPrice';
import { minAmountSymbol } from '../broker/minAmount';

export async function hedger(
  pair: string,
  price: number,
  bContractId: number,
  amount: number,
  isLong: boolean,
  isOpen: boolean,
) {
  try {
    const minAmount = await minAmountSymbol(pair);

    if (minAmount <= amount) {
      const livePrice = await getTripartyLatestPrice(pair);

      if (
        (livePrice.bid <= price && isLong && isOpen) ||
        (livePrice.bid <= price && !isLong && !isOpen) ||
        (livePrice.ask >= price && !isLong && isOpen) ||
        (livePrice.ask >= price && isLong && !isOpen)
      ) {
        const isTradeOpenable = await verifyTradeOpenable(
          pair,
          amount,
          livePrice.bid,
        );

        if (isTradeOpenable) {
          try {
            await manageSymbolInventory(
              pair,
              amount,
              bContractId,
              isLong,
              isOpen,
            );
            return true;
            console.log('Symbol inventory managed successfully');
          } catch (error) {
            console.error('Error managing symbol inventory:', error);
            // Handle the error or throw it to the caller
            throw error;
          }
        } else {
          console.log('Trade is not openable');
        }
      } else {
        console.log('Price condition not met');
        console.log('livePrice:', livePrice);
        console.log('price:', price);
      }
    } else {
      console.log('Amount is less than the minimum required amount');
    }
  } catch (error) {
    console.error('Error in manageSymbolInventory:', error);
    // Handle the error or throw it to the caller
    throw error;
  }
}
