import {
  BlockchainInterface,
  networks,
  Networks,
  NetworkKey,
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

class CustomBlockchainInterface extends BlockchainInterface {
  public chainId: NetworkKey;

  constructor(chainId: NetworkKey, wallet: ethers.Wallet) {
    super(chainId, wallet);
    this.chainId = chainId;
  }
}

class BlockchainInterfaceLib {
  private interfaces: { [chainId: number]: CustomBlockchainInterface } = {};
  private blockchainConfigs: BlockchainConfig[];

  constructor(jsonFilePath: string) {
    this.blockchainConfigs = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
    this.initInterfaces();
  }

  private initInterfaces(): void {
    const privateKeys = process.env.PRIVATE_KEYS?.split(',') || [];

    this.blockchainConfigs.forEach((config) => {
      const provider: ethers.Provider = new ethers.JsonRpcProvider(
        `${config.rpcURL}${config.rpcKey}`,
      );
      const privateKey = privateKeys[config.privateKeyIndex];
      const wallet = new ethers.Wallet(privateKey, provider);
      const pionerChainId = (networks as Record<string, any>)[config.chainKey]
        .pionerChainId as NetworkKey;
      logger.info(`pionerChainId: ${pionerChainId}`);
      const blockchainInterface = new CustomBlockchainInterface(
        pionerChainId,
        wallet,
      );
      this.interfaces[config.chainId] = blockchainInterface;
    });
  }

  public getInterfaceByIndex(index: number): CustomBlockchainInterface {
    const chainId = this.blockchainConfigs[index].chainId;
    return this.interfaces[chainId];
  }

  public getInterfaceByChainId(chainId: number): CustomBlockchainInterface {
    return this.interfaces[chainId];
  }

  public forEachInterface(
    callback: (
      blockchainInterface: CustomBlockchainInterface,
      index: number,
    ) => void,
  ): void {
    this.blockchainConfigs.forEach((config, index) => {
      const blockchainInterface = this.interfaces[config.chainId];
      callback(blockchainInterface, index);
    });
  }
}

const blockchainInterfaceLib = new BlockchainInterfaceLib('blockchain.json');

const interface1 = blockchainInterfaceLib.getInterfaceByIndex(0);
console.log(`Interface 1 Chain ID: ${interface1.chainId}`);

const interface2 = blockchainInterfaceLib.getInterfaceByChainId(2);
console.log(`Interface 2 Chain ID: ${interface2.chainId}`);

export { blockchainInterfaceLib };
