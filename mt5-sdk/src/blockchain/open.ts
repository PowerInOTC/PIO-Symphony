import {
  accounts,
  logger,
  web3Client,
  wallets,
  fakeUSDContract,
  pionerV1ComplianceContract,
  pionerV1Contract,
} from '../utils/init';
import { config } from '../config';
import {
  FakeUSD,
  PionerV1,
  PionerV1Compliance,
} from '@pionerfriends/blockchain-client';
import { Address, parseUnits } from 'viem';

export async function mintFUSD(
  amount: bigint,
  accountId: number,
  chainId: number,
) {
  const { request } = await web3Client.simulateContract({
    address: fakeUSDContract[chainId] as Address,
    abi: FakeUSD.abi,
    functionName: 'mint',
    args: [amount],
    account: accounts[accountId],
  });
  const hash = await wallets[accountId].writeContract(request);
  return hash;
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

export async function deposit(
  amount: bigint,
  accountId: number,
  chainId: number,
) {
  const { request } = await web3Client.simulateContract({
    address: pionerV1ComplianceContract[chainId] as Address,
    abi: PionerV1Compliance.abi,
    functionName: 'deposit',
    args: [
      amount,
      parseUnits('1', 0),
      config.publicKeys?.split(',')[accountId] as string,
    ],
    account: accounts[accountId],
  });
  const hash = await wallets[accountId].writeContract(request);
  return hash;
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

export async function allowance(
  amount: bigint,
  accountId: number,
  chainId: number,
) {
  logger.info('address', pionerV1ComplianceContract[chainId]);
  const contract = await pionerV1ComplianceContract[chainId];
  const { request } = await web3Client.simulateContract({
    address: fakeUSDContract[chainId] as Address,
    abi: FakeUSD.abi,
    functionName: 'approve',
    args: [pionerV1ComplianceContract[chainId], amount],
    account: accounts[accountId],
  });

  const hash = await wallets[accountId].writeContract(request);
  return hash;
}

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
