import { accounts, web3Clients, wallets } from '../utils/init';
import { config } from '../config';
import {
  FakeUSD,
  PionerV1,
  PionerV1Compliance,
  PionerV1Default,
  PionerV1Wrapper,
  PionerV1View,
  BOracle,
  BContract,
  networks,
  NetworkKey,
} from '@pionerfriends/blockchain-client';
import { Address, parseUnits } from 'viem';
import { BOracleSignValueType, openQuoteSignValueType } from './types';
import { closeQuoteSignValueType } from './types';
import Web3 from 'web3';

export async function getAllowance(accountId: number, chainId: string) {
  const allowanceAmount = await web3Clients[Number(chainId)].readContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .FakeUSD as Address,
    abi: FakeUSD.abi,
    functionName: 'allowance',
    args: [
      config.publicKeys?.split(',')[accountId] as string,
      networks[chainId as unknown as NetworkKey].contracts
        .PionerV1Compliance as Address,
    ],
  });
  return allowanceAmount;
}

export async function getBalance(accountId: number, chainId: string) {
  const balance = await web3Clients[Number(chainId)].readContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1 as Address,
    abi: PionerV1.abi,
    functionName: 'getBalances',
    args: [config.publicKeys?.split(',')[accountId] as string],
  });
  return balance;
}

export async function getUserBalance(accountId: string, chainId: string) {
  const balance = await web3Clients[Number(chainId)].readContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1 as Address,
    abi: PionerV1.abi,
    functionName: 'getBalances',
    args: [accountId],
  });
  return balance;
}

export async function getMintFUSD(accountId: number, chainId: string) {
  const balance = await web3Clients[Number(chainId)].readContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .FakeUSD as Address,
    abi: FakeUSD.abi,
    functionName: 'balanceOf',
    args: [config.publicKeys?.split(',')[accountId] as string],
  });
  return balance;
}

export async function getbOracle(
  bOracleId: bigint,
  chainId: string,
): Promise<BOracle> {
  const oracle = await web3Clients[Number(chainId)].readContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1View as Address,
    abi: PionerV1View.abi,
    functionName: 'getOracle',
    args: [bOracleId],
  });
  console.log('bOracleId', oracle);
  return oracle as BOracle;
}
