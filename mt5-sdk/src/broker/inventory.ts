import { manageSymbolInventory } from './dispatcher';
import { getBrokerFromAsset } from '../config/configRead';
import noHedgeList from './noHedgeList.json';

export class Hedger {
  private async isNoHedgeAddress(address: string): Promise<boolean> {
    return noHedgeList.includes(address);
  }

  private async openPositions(
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
      true,
      brokerA,
    );
    console.log(`Opened position for ${assetA}`);

    const tx2 = await manageSymbolInventory(
      assetB,
      amount,
      bContractId,
      !isLong,
      true,
      brokerB,
    );
    console.log(`Opened position for ${assetB}`);

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
      if (await this.isNoHedgeAddress(counterparty)) {
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
          console.log('Issue with position management');
          return false;
        }

        return true;
      } catch (error) {
        console.error('Error managing symbol inventory:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in hedge:', error);
      throw error;
    }
  }
}
