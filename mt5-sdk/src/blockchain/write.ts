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
import { AxiosError } from 'axios';

export async function mintFUSD(
  amount: string,
  accountId: number,
  chainId: string,
) {
  try {
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
  } catch (e) {
    console.log(`[Blockchain] [mintFUSD] : ${e}`);
  }
}
export async function deposit(
  amount: string,
  accountId: number,
  chainId: string,
) {
  try {
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
  } catch (e) {
    console.log(`[Blockchain] [deposit] : ${e}`);
  }
}
export async function withdraw(
  amount: string,
  accountId: number,
  chainId: string,
) {
  try {
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
  } catch (e) {
    console.log(`[Blockchain] [withdraw] : ${e}`);
  }
}

export async function claim(
  amount: string,
  accountId: number,
  chainId: string,
) {
  try {
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
  } catch (e) {
    console.log(`[Blockchain] [claim] : ${e}`);
  }
}

export async function allowance(
  amount: string,
  accountId: number,
  chainId: string,
) {
  try {
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
  } catch (e) {
    console.log(`[Blockchain] [settleClose] : ${e}`);
  }
}

export async function settle(
  bContractId: string,
  accountId: number,
  chainId: string,
) {
  try {
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
  } catch (e) {
    console.log(`[Blockchain] [settleClose] : ${e}`);
  }
}

export async function settleOpen(
  bOracleSignValue: BOracleSignValueType,
  signatureBoracle: string,
  openQuoteSignValue: openQuoteSignValueType,
  signatureOpenQuote: string,
  acceptPrice: string,
  accountId: number,
  chainId: string,
): Promise<any> {
  try {
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
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.log(
          `[Blockchain] [settleOpen] : Status: ${axiosError.response.status}, Data: ${JSON.stringify(axiosError.response.data)}, Headers: ${JSON.stringify(axiosError.response.headers)}`,
        );
      } else if (axiosError.request) {
        console.log(
          `[Blockchain] [settleOpen] : No response received, Request: ${JSON.stringify(axiosError.request)}`,
        );
      } else {
        console.log(
          `[Blockchain] [settleOpen] : Error message: ${axiosError.message}`,
        );
      }
    } else {
      console.log(
        `[Blockchain] [settleOpen] : Unexpected error: ${String(error)}`,
      );
    }
  }
}

function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError !== undefined;
}
export async function settleClose(
  openCloseQuoteValue: closeQuoteSignValueType,
  signatureCloseQuote: string,
  accountId: number,
  chainId: string,
) {
  try {
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
  } catch (e) {
    console.log(`[Blockchain] [settleClose] : ${e}`);
  }
}

export async function updatePriceAndDefault(
  priceSignature: pionSignType,
  bContractId: string,
  accountId: number,
  chainId: string,
) {
  try {
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
  } catch (e) {
    console.log(`[Blockchain] [updatePriceAndDefault] : ${e}`);
  }
}
