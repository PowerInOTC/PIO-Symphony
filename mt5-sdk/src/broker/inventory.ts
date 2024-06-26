import { manageSymbolInventory } from './dispatcher';
import { getBrokerFromAsset } from '../config/configRead';
import { isNoHedgeAddress } from '../utils/check';
import { isPositionOpen } from '../broker/utils';
import { getOpenPositions, Position } from '../broker/dispatcher';
import { getMT5Ticker } from '../config/configRead';
import { getFirst12Characters } from '../broker/utils';

export class Hedger {
  private async openPositions(
    assetA: string,
    assetB: string,
    amount: number,
    bContractId: string,
    isLong: boolean,
    brokerA: string,
    brokerB: string,
  ): Promise<boolean> {
    const mt5PairA = await getMT5Ticker(assetA);
    const mt5PairB = await getMT5Ticker(assetB);
    let tx1 = false,
      tx2 = false;
    if (mt5PairA) {
      assetA = mt5PairA;
    }
    if (mt5PairB) {
      assetB = mt5PairB;
    }
    const openPositions = await getOpenPositions('mt5.ICMarkets');
    const isAOpenned = await isPositionOpen(
      openPositions,
      assetA,
      bContractId,
      isLong,
    );
    const isBOpenned = await isPositionOpen(
      openPositions,
      assetB,
      bContractId,
      !isLong,
    );

    if (!isAOpenned) {
      tx1 = await manageSymbolInventory(
        assetA,
        amount,
        bContractId,
        isLong,
        true,
        brokerA,
      );
    }
    //console.log(`Opened position for ${assetA}`);

    if (!isBOpenned) {
      tx2 = await manageSymbolInventory(
        assetB,
        amount,
        bContractId,
        !isLong,
        true,
        brokerB,
      );
      //console.log(`Opened position for ${assetB}`);
    }
    return tx1 && tx2;
  }

  private async closePositions(
    assetA: string,
    assetB: string,
    amount: number,
    bContractId: string,
    isLong: boolean,
    brokerA: string,
    brokerB: string,
  ): Promise<boolean> {
    const tx1 = await manageSymbolInventory(
      assetA,
      amount,
      bContractId,
      isLong,
      false,
      brokerA,
    );
    console.log(`Closed position for ${assetA}`);

    const tx2 = await manageSymbolInventory(
      assetB,
      amount,
      bContractId,
      !isLong,
      false,
      brokerB,
    );
    console.log(`Closed position for ${assetB}`);

    return tx1 && tx2;
  }

  async hedge(
    pair: string,
    price: number,
    bContractId: string,
    amount: number,
    isLong: boolean,
    isOpen: boolean,
    counterparty: string,
  ): Promise<boolean> {
    try {
      bContractId = getFirst12Characters(bContractId);

      if (await isNoHedgeAddress(counterparty)) {
        return true;
      }

      isLong = !isLong;

      const [assetA, assetB] = pair.split('/');
      const brokerA = getBrokerFromAsset(assetA);
      const brokerB = getBrokerFromAsset(assetB);

      if (!brokerA || !brokerB) {
        return false;
      }

      try {
        const success = isOpen
          ? await this.openPositions(
              assetA,
              assetB,
              amount,
              bContractId,
              isLong,
              brokerA,
              brokerB,
            )
          : await this.closePositions(
              assetA,
              assetB,
              amount,
              bContractId,
              isLong,
              brokerA,
              brokerB,
            );

        if (!success) {
          return false;
        }

        return true;
      } catch (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }
}
