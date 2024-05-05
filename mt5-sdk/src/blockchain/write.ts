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
import {
  BOracleSignValueType,
  openQuoteSignValueType,
  closeQuoteSignValueType,
} from './types';
import Web3 from 'web3';

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

export async function withdraw(
  amount: bigint,
  accountId: number,
  chainId: number,
) {
  const { request } = await web3Client.simulateContract({
    address: pionerV1ComplianceContract[chainId] as Address,
    abi: PionerV1Compliance.abi,
    functionName: 'initiateWithdraw',
    args: [amount],
    account: accounts[accountId],
  });
  const hash = await wallets[accountId].writeContract(request);
  return hash;
}

export async function claim(
  amount: bigint,
  accountId: number,
  chainId: number,
) {
  const { request } = await web3Client.simulateContract({
    address: pionerV1ComplianceContract[chainId] as Address,
    abi: PionerV1Compliance.abi,
    functionName: 'withdraw',
    args: [amount],
    account: accounts[accountId],
  });
  const hash = await wallets[accountId].writeContract(request);
  return hash;
}

export async function allowance(
  amount: bigint,
  accountId: number,
  chainId: number,
) {
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

export async function settle(
  bContractId: bigint,
  accountId: number,
  chainId: number,
) {
  const { request } = await web3Client.simulateContract({
    address: pionerV1DefaultContract[chainId] as Address,
    abi: PionerV1Default.abi,
    functionName: 'settleAndLiquidate',
    args: [bContractId],
    account: accounts[accountId],
  });

  const hash = await wallets[accountId].writeContract(request);
  return hash;
}

export async function settleOpen(
  bOracleSignValue: BOracleSignValueType,
  signatureBoracle: string,
  openQuoteSignValue: openQuoteSignValueType,
  signatureOpenQuote: string,
  acceptPrice: bigint,
  accountId: number,
  chainId: number,
) {
  const { request } = await web3Client.simulateContract({
    address: pionerV1WrapperContract[chainId] as Address,
    abi: PionerV1Wrapper.abi,
    functionName: 'wrapperOpenQuoteMM',
    args: [
      bOracleSignValue,
      signatureBoracle,
      openQuoteSignValue,
      signatureOpenQuote,
      acceptPrice,
    ],
    account: accounts[accountId],
  });

  const hash = await wallets[accountId].writeContract(request);
  return hash;
}

export async function settleClose(
  openCloseQuoteValue: closeQuoteSignValueType,
  signatureCloseQuote: string,
  accountId: number,
  chainId: number,
) {
  const { request } = await web3Client.simulateContract({
    address: pionerV1WrapperContract[chainId] as Address,
    abi: PionerV1Wrapper.abi,
    functionName: 'wrapperCloseLimitMM',
    args: [openCloseQuoteValue, signatureCloseQuote],
    account: accounts[accountId],
  });

  const hash = await wallets[accountId].writeContract(request);
  return hash;
}
