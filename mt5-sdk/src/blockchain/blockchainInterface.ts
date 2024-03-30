import {
  BlockchainInterface,
  networks,
  Networks,
} from '@pionerfriends/blockchain-client';
import * as dotenv from 'dotenv';
import { Network, ethers } from 'ethers';
import * as fs from 'fs';
import { logger } from '../utils/init';

dotenv.config();

interface BlockchainConfig {
  chainId: number;
  chainKey: string;
  rpcURL: string;
  rpcKey: string;
  privateKeyIndex: number;
}

class BlockchainInterfaceLib {
  private interfaces: { [chainId: number]: BlockchainInterface } = {};

  constructor() {
    this.initInterfaces();
  }

  private initInterfaces(): void {
    const blockchainConfigs: BlockchainConfig[] = JSON.parse(
      fs.readFileSync('blockchain.json', 'utf-8'),
    );
    const privateKeys = process.env.PRIVATE_KEYS?.split(',') || [];

    blockchainConfigs.forEach((config) => {
      const provider: ethers.Provider = new ethers.JsonRpcProvider(
        `${config.rpcURL}${config.rpcKey}`,
      );
      const privateKey = privateKeys[config.privateKeyIndex];
      const wallet = new ethers.Wallet(privateKey, provider);
      const pionerChainId = (networks as Record<string, any>)[config.chainKey]
        .pionerChainId;
      logger.info(`pionerChainId: ${pionerChainId}`);
      const blockchainInterface = new BlockchainInterface(
        pionerChainId,
        wallet,
      );
      this.interfaces[config.chainId] = blockchainInterface;
    });
  }

  public getInterfaceByIndex(index: number): BlockchainInterface {
    const blockchainConfigs: BlockchainConfig[] = JSON.parse(
      fs.readFileSync('blockchain.json', 'utf-8'),
    );
    const chainId = blockchainConfigs[index].chainId;
    return this.interfaces[chainId];
  }

  public getInterfaceByChainId(chainId: number): BlockchainInterface {
    return this.interfaces[chainId];
  }

  public forEachInterface(
    callback: (blockchainInterface: BlockchainInterface, index: number) => void,
  ): void {
    const blockchainConfigs: BlockchainConfig[] = JSON.parse(
      fs.readFileSync('blockchain.json', 'utf-8'),
    );

    blockchainConfigs.forEach((config, index) => {
      const blockchainInterface = this.interfaces[config.chainId];
      callback(blockchainInterface, index);
    });
  }
}

const blockchainInterfaceLib = new BlockchainInterfaceLib();

export { blockchainInterfaceLib };

/* ex
    blockchainInterfaceLib.forEachInterface((blockchainInterface, index) => {
    blockchainInterface.mint(1);
    console.log(`Blockchain Interface ${index}:`);
    console.log('---');
    });

    const interface1 = blockchainInterfaceLib.getInterfaceByIndex(0);

    const interface2 = blockchainInterfaceLib.getInterfaceByChainId(2);
    */
