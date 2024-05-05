import {
  accounts,
  logger,
  web3Client,
  wallets,
  fakeUSDContract,
  pionerV1ComplianceContract,
  pionerV1Contract,
  pionerV1DefaultContract,
  pionerV1WrapperContract,
} from '../utils/init';
import { config } from '../config';
import {
  FakeUSD,
  PionerV1,
  PionerV1Compliance,
  PionerV1Default,
  PionerV1Wrapper,
} from '@pionerfriends/blockchain-client';
import { Address, parseUnits } from 'viem';
import { BOracleSignValueType, openQuoteSignValueType } from './types';
import { closeQuoteSignValueType } from './types';
import Web3 from 'web3';

export async function getAllowance(accountId: number, chainId: number) {
  const allowanceAmount = await web3Client.readContract({
    address: fakeUSDContract[chainId] as Address,
    abi: FakeUSD.abi,
    functionName: 'allowance',
    args: [
      config.publicKeys?.split(',')[accountId] as string,
      pionerV1ComplianceContract[chainId],
    ],
  });
  return allowanceAmount;
}

export async function getBalance(accountId: number, chainId: number) {
  const balance = await web3Client.readContract({
    address: pionerV1Contract[chainId] as Address,
    abi: PionerV1.abi,
    functionName: 'getBalances',
    args: [config.publicKeys?.split(',')[accountId] as string],
  });
  return balance;
}

export async function getMintFUSD(accountId: number, chainId: number) {
  const balance = await web3Client.readContract({
    address: fakeUSDContract[chainId] as Address,
    abi: FakeUSD.abi,
    functionName: 'balanceOf',
    args: [config.publicKeys?.split(',')[accountId] as string],
  });
  return balance;
}

export function convertToBytes32(str: string): string {
  const hex = Web3.utils.toHex(str);
  return Web3.utils.padRight(hex, 64, '0');
}
