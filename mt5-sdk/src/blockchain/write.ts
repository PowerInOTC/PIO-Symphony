import { accounts, web3Clients, wallets, getAccountData } from '../utils/init';
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
  const { account, wallet, address } = getAccountData(accountId, chainId);
  const request = await web3Clients[Number(chainId)].simulateContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .FakeUSD as Address,
    abi: FakeUSD.abi,
    functionName: 'mint',
    args: [amount],
    account: account,
  });
  return await wallet.writeContract(
    request.request as unknown as WriteContractParameters,
  );
}
export async function deposit(
  amount: string,
  accountId: number,
  chainId: string,
) {
  const { account, wallet, address } = getAccountData(accountId, chainId);
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
    account: account,
  });

  const hash = await wallet.writeContract(
    request.request as unknown as WriteContractParameters,
  );
  return hash;
}
export async function withdraw(
  amount: string,
  accountId: number,
  chainId: string,
) {
  const { account, wallet, address } = getAccountData(accountId, chainId);
  const request = await web3Clients[Number(chainId)].simulateContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1Compliance as Address,
    abi: PionerV1Compliance.abi,
    functionName: 'initiateWithdraw',
    args: [amount],
    account: account,
  });
  return await wallet.writeContract(
    request.request as unknown as WriteContractParameters,
  );
}

export async function claim(
  amount: string,
  accountId: number,
  chainId: string,
) {
  const { account, wallet, address } = getAccountData(accountId, chainId);
  const request = await web3Clients[Number(chainId)].simulateContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1Compliance as Address,
    abi: PionerV1Compliance.abi,
    functionName: 'withdraw',
    args: [amount],
    account: account,
  });
  return await wallet.writeContract(
    request.request as unknown as WriteContractParameters,
  );
}

export async function allowance(
  amount: string,
  accountId: number,
  chainId: string,
) {
  console.log(
    networks[chainId as unknown as NetworkKey].contracts
      .PionerV1Compliance as Address,
    'address',
  );
  const { account, wallet, address } = getAccountData(accountId, chainId);
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
    account: account,
  });
  return await wallet.writeContract(
    request.request as unknown as WriteContractParameters,
  );
}

export async function settle(
  bContractId: string,
  accountId: number,
  chainId: string,
) {
  const { account, wallet, address } = getAccountData(accountId, chainId);
  const request = await web3Clients[Number(chainId)].simulateContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1Default as Address,
    abi: PionerV1Default.abi,
    functionName: 'settleAndLiquidate',
    args: [bContractId],
    account: account,
  });
  return await wallet.writeContract(
    request.request as unknown as WriteContractParameters,
  );
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
  const { account, wallet, address } = getAccountData(accountId, chainId);
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
    account: account,
  });
  return await wallet.writeContract(
    request.request as unknown as WriteContractParameters,
  );
}

export async function settleClose(
  openCloseQuoteValue: closeQuoteSignValueType,
  signatureCloseQuote: string,
  accountId: number,
  chainId: string,
) {
  const { account, wallet, address } = getAccountData(accountId, chainId);
  const request = await web3Clients[Number(chainId)].simulateContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1Wrapper as Address,
    abi: PionerV1Wrapper.abi,
    functionName: 'wrapperCloseLimitMM',
    args: [openCloseQuoteValue, signatureCloseQuote],
    account: account,
  });
  return await wallet.writeContract(
    request.request as unknown as WriteContractParameters,
  );
}

export async function updatePriceAndDefault(
  priceSignature: pionSignType,
  bContractId: string,
  accountId: number,
  chainId: string,
) {
  const { account, wallet, address } = getAccountData(accountId, chainId);
  const request = await web3Clients[Number(chainId)].simulateContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1Wrapper as Address,
    abi: PionerV1Wrapper.abi,
    functionName: 'wrapperUpdatePriceAndDefault',
    args: [priceSignature, bContractId],
    account: account,
  });
  return await wallet.writeContract(
    request.request as unknown as WriteContractParameters,
  );
}
