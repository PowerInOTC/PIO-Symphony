import { redisClient } from '../utils/init';
import { BigNumberish, ethers } from 'ethers';
import {
  networks,
  BlockchainInterface,
  contracts,
  NetworkKey,
} from '@pionerfriends/blockchain-client';
import { logger } from '../utils/init';
import blockchainConfig from '../../blockchain.json';

const networkIdToKey: { [networkId: number]: NetworkKey } = {
  64165: 'sonic',
};

const providers: { [networkId: number]: ethers.Provider } = {};
for (const network of blockchainConfig.networks) {
  providers[network.networkId] = new ethers.JsonRpcProvider(
    `${network.rpcURL}${network.rpcKey}`,
  );
}

const wallets: { [walletName: string]: ethers.Wallet } = {};
for (const interfaceConfig of blockchainConfig.blockchainInterfaces) {
  const walletName = interfaceConfig.wallet;
  if (blockchainConfig.wallets.hasOwnProperty(walletName)) {
    const privateKey =
      blockchainConfig.wallets[
        walletName as keyof typeof blockchainConfig.wallets
      ];
    wallets[walletName] = new ethers.Wallet(privateKey);
  }
}

const blockchainInterfaces: { [networkId: number]: BlockchainInterface } = {};
for (const interfaceConfig of blockchainConfig.blockchainInterfaces) {
  const walletName = interfaceConfig.wallet;
  if (wallets.hasOwnProperty(walletName)) {
    const wallet = wallets[walletName].connect(
      providers[interfaceConfig.networkId],
    );
    const networkKey = networkIdToKey[interfaceConfig.networkId];
    blockchainInterfaces[interfaceConfig.networkId] = new BlockchainInterface(
      networkKey,
      wallet,
    );
  }
}

export function getBlockchainInterface(networkId: number): BlockchainInterface {
  const blockchainInterface = blockchainInterfaces[networkId];
  if (!blockchainInterface) {
    throw new Error(
      `BlockchainInterface not found for network ID: ${networkId}`,
    );
  }
  return blockchainInterface;
}

export function forEachBlockchainInterface(
  callback: (
    blockchainInterface: BlockchainInterface,
    networkId: number,
  ) => void,
): void {
  for (const networkId in blockchainInterfaces) {
    if (Object.prototype.hasOwnProperty.call(blockchainInterfaces, networkId)) {
      const blockchainInterface = blockchainInterfaces[Number(networkId)];
      callback(blockchainInterface, Number(networkId));
    }
  }
}
