import { accounts, web3Clients, wallets } from '../utils/init';
import { config } from '../config';
import {
  FakeUSD,
  PionerV1Compliance,
  PionerV1Default,
  PionerV1Wrapper,
  NetworkKey,
  networks,
} from '@pionerfriends/blockchain-client';
import { Address, parseUnits, WriteContractParameters } from 'viem';
import {
  BOracleSignValueType,
  openQuoteSignValueType,
  closeQuoteSignValueType,
  pionSignType,
} from './types';

export async function mintFUSD(
  amount: string,
  accountId: number,
  chainId: string,
) {
  const request = await web3Clients[Number(chainId)].simulateContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .FakeUSD as Address,
    abi: FakeUSD.abi,
    functionName: 'mint',
    args: [amount],
    account: accounts[Number(chainId)][accountId],
  });

  const hash = await wallets[Number(chainId)][accountId].writeContract(
    request as unknown as WriteContractParameters,
  );
  return hash;
}

export async function deposit(
  amount: string,
  accountId: number,
  chainId: string,
) {
  const request = await web3Clients[Number(chainId)].simulateContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1Compliance as Address,
    abi: PionerV1Compliance.abi,
    functionName: 'deposit',
    args: [
      amount,
      parseUnits('1', 0),
      config.publicKeys?.split(',')[accountId] as string,
    ],
    account: accounts[Number(chainId)][accountId],
  });

  const hash = await wallets[Number(chainId)][accountId].writeContract(
    request as unknown as WriteContractParameters,
  );
  return hash;
}

export async function withdraw(
  amount: string,
  accountId: number,
  chainId: string,
) {
  const request = await web3Clients[Number(chainId)].simulateContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1Compliance as Address,
    abi: PionerV1Compliance.abi,
    functionName: 'initiateWithdraw',
    args: [amount],
    account: accounts[Number(chainId)][accountId],
  });

  const hash = await wallets[Number(chainId)][accountId].writeContract(
    request as unknown as WriteContractParameters,
  );
  return hash;
}

export async function claim(
  amount: string,
  accountId: number,
  chainId: string,
) {
  const request = await web3Clients[Number(chainId)].simulateContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1Compliance as Address,
    abi: PionerV1Compliance.abi,
    functionName: 'withdraw',
    args: [amount],
    account: accounts[Number(chainId)][accountId],
  });

  const hash = await wallets[Number(chainId)][accountId].writeContract(
    request as unknown as WriteContractParameters,
  );
  return hash;
}

export async function allowance(
  amount: string,
  accountId: number,
  chainId: string,
) {
  const request = await web3Clients[Number(chainId)].simulateContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .FakeUSD as Address,
    abi: FakeUSD.abi,
    functionName: 'approve',
    args: [
      networks[chainId as unknown as NetworkKey].contracts
        .PionerV1Compliance as Address,
      amount,
    ],
    account: accounts[Number(chainId)][accountId],
  });

  const hash = await wallets[Number(chainId)][accountId].writeContract(
    request as unknown as WriteContractParameters,
  );
  return hash;
}

export async function settle(
  bContractId: string,
  accountId: number,
  chainId: string,
) {
  const request = await web3Clients[Number(chainId)].simulateContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1Default as Address,
    abi: PionerV1Default.abi,
    functionName: 'settleAndLiquidate',
    args: [bContractId],
    account: accounts[Number(chainId)][accountId],
  });

  const hash = await wallets[Number(chainId)][accountId].writeContract(
    request as unknown as WriteContractParameters,
  );
  return hash;
}

export async function settleOpen(
  bOracleSignValue: BOracleSignValueType,
  signatureBoracle: string,
  openQuoteSignValue: openQuoteSignValueType,
  signatureOpenQuote: string,
  acceptPrice: string,
  accountId: number,
  chainId: string,
) {
  const request = await web3Clients[Number(chainId)].simulateContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1Wrapper as Address,
    abi: PionerV1Wrapper.abi,
    functionName: 'wrapperOpenQuoteMM',
    args: [
      bOracleSignValue,
      signatureBoracle,
      openQuoteSignValue,
      signatureOpenQuote,
      acceptPrice,
    ],
    account: accounts[Number(chainId)][accountId],
  });

  const hash = await wallets[Number(chainId)][accountId].writeContract(
    request as unknown as WriteContractParameters,
  );
  return hash;
}

export async function settleClose(
  openCloseQuoteValue: closeQuoteSignValueType,
  signatureCloseQuote: string,
  accountId: number,
  chainId: string,
) {
  const request = await web3Clients[Number(chainId)].simulateContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1Wrapper as Address,
    abi: PionerV1Wrapper.abi,
    functionName: 'wrapperCloseLimitMM',
    args: [openCloseQuoteValue, signatureCloseQuote],
    account: accounts[Number(chainId)][accountId],
  });

  const hash = await wallets[Number(chainId)][accountId].writeContract(
    request as unknown as WriteContractParameters,
  );
  return hash;
}

export async function updatePriceAndDefault(
  priceSignature: pionSignType,
  bContractId: string,
  accountId: number,
  chainId: string,
) {
  const request = await web3Clients[Number(chainId)].simulateContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1Wrapper as Address,
    abi: PionerV1Wrapper.abi,
    functionName: 'wrapperUpdatePriceAndDefault',
    args: [priceSignature, bContractId],
    account: accounts[Number(chainId)][accountId],
  });

  const hash = await wallets[Number(chainId)][accountId].writeContract(
    request as unknown as WriteContractParameters,
  );
  return hash;
}
