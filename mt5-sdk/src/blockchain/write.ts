import { accounts, web3Clients, wallets, getAccountData } from '../utils/init';
import { config } from '../config';
import {
  FakeUSD,
  PionerV1Compliance,
  PionerV1Default,
  PionerV1Wrapper,
  PionerV1Close,
  PionerV1Oracle,
  NetworkKey,
  networks,
} from '@pionerfriends/blockchain-client';
import { Address, parseUnits, WriteContractParameters } from 'viem';
import {
  BOracleSignValueType,
  openQuoteSignValueType,
  closeQuoteSignValueType,
} from './types';
import { AxiosError } from 'axios';

export async function mintFUSD(
  amount: string,
  accountId: number,
  chainId: string,
) {
  try {
    const { account, wallet, address } = getAccountData(accountId, chainId);
    const nonce = await web3Clients[Number(chainId)].getTransactionCount({
      address: address as `0x${string}`,
    });
    const request = await web3Clients[Number(chainId)].simulateContract({
      address: networks[chainId as unknown as NetworkKey].contracts
        .FakeUSD as Address,
      abi: FakeUSD.abi,
      functionName: 'mint',
      args: [amount],
      account: account,
    });
    const transactionParameters = {
      ...request.request,
      nonce: nonce,
    };
    return await wallet.writeContract(
      transactionParameters as unknown as WriteContractParameters,
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

    const client = web3Clients[Number(chainId)];

    // Get the latest nonce, including pending transactions
    const nonce = await client.getTransactionCount({
      address: address as `0x${string}`,
      blockTag: 'pending',
    });

    const contractAddress = networks[chainId as unknown as NetworkKey].contracts
      .PionerV1Compliance as Address;

    const { request } = await client.simulateContract({
      address: contractAddress,
      abi: PionerV1Compliance.abi,
      functionName: 'deposit',
      args: [
        parseUnits(amount, 0),
        '1',
        '0xd0dDF915693f13Cf9B3b69dFF44eE77C901882f8',
      ],
      account,
    });

    const hash = await wallet.writeContract({
      address: contractAddress,
      abi: PionerV1Compliance.abi,
      functionName: 'deposit',
      args: [
        parseUnits(amount, 0),
        '1',
        '0xd0dDF915693f13Cf9B3b69dFF44eE77C901882f8',
      ],
      account,
      chain: client.chain,
      nonce,
    });

    return hash;
  } catch (e) {
    console.error('Deposit error:', e);
    throw e;
  }
}
export async function withdraw(
  amount: string,
  accountId: number,
  chainId: string,
) {
  try {
    const { account, wallet, address } = getAccountData(accountId, chainId);
    const nonce = await web3Clients[Number(chainId)].getTransactionCount({
      address: address as `0x${string}`,
    });
    const request = await web3Clients[Number(chainId)].simulateContract({
      address: networks[chainId as unknown as NetworkKey].contracts
        .PionerV1Compliance as Address,
      abi: PionerV1Compliance.abi,
      functionName: 'initiateWithdraw',
      args: [amount],
      account: account,
    });
    const transactionParameters = {
      ...request.request,
      nonce: nonce,
    };
    return await wallet.writeContract(
      transactionParameters as unknown as WriteContractParameters,
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
    const nonce = await web3Clients[Number(chainId)].getTransactionCount({
      address: address as `0x${string}`,
    });
    const request = await web3Clients[Number(chainId)].simulateContract({
      address: networks[chainId as unknown as NetworkKey].contracts
        .PionerV1Compliance as Address,
      abi: PionerV1Compliance.abi,
      functionName: 'withdraw',
      args: [amount],
      account: account,
    });
    const transactionParameters = {
      ...request.request,
      nonce: nonce,
    };
    return await wallet.writeContract(
      transactionParameters as unknown as WriteContractParameters,
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
    console.log(
      'address',
      networks[chainId as unknown as NetworkKey].contracts.PionerV1Compliance,
    );
    const { account, wallet, address } = getAccountData(accountId, chainId);
    const nonce = await web3Clients[Number(chainId)].getTransactionCount({
      address: address as `0x${string}`,
    });
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
    const transactionParameters = {
      ...request.request,
      nonce: nonce,
    };
    return await wallet.writeContract(
      transactionParameters as unknown as WriteContractParameters,
    );
  } catch (e) {
    console.log(`[Blockchain] [Allowance] : ${e}`);
  }
}

export async function settle(
  bContractId: string,
  accountId: number,
  chainId: string,
) {
  try {
    const { account, wallet, address } = getAccountData(accountId, chainId);
    const nonce = await web3Clients[Number(chainId)].getTransactionCount({
      address: address as `0x${string}`,
    });

    const request = await web3Clients[Number(chainId)].simulateContract({
      address: networks[chainId as unknown as NetworkKey].contracts
        .PionerV1Default as Address,
      abi: PionerV1Default.abi,
      functionName: 'settleAndLiquidate',
      args: [bContractId],
      account: account,
    });
    const transactionParameters = {
      ...request.request,
      nonce: nonce,
    };

    return await wallet.writeContract(
      transactionParameters as unknown as WriteContractParameters,
    );
  } catch (e) {
    console.log(`[Blockchain] [settle] : ${e}`);
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
    const nonce = await web3Clients[Number(chainId)].getTransactionCount({
      address: address as `0x${string}`,
    });
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
    const transactionParameters = {
      ...request.request,
      nonce: nonce,
    };
    return await wallet.writeContract(
      transactionParameters as unknown as WriteContractParameters,
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
    const nonce = await web3Clients[Number(chainId)].getTransactionCount({
      address: address as `0x${string}`,
    });
    const request = await web3Clients[Number(chainId)].simulateContract({
      address: networks[chainId as unknown as NetworkKey].contracts
        .PionerV1Wrapper as Address,
      abi: PionerV1Wrapper.abi,
      functionName: 'wrapperCloseLimitMM',
      args: [openCloseQuoteValue, signatureCloseQuote],
      account: account,
    });
    const transactionParameters = {
      ...request.request,
      nonce: nonce,
    };
    return await wallet.writeContract(
      transactionParameters as unknown as WriteContractParameters,
    );
  } catch (e) {
    console.log(`[Blockchain] [settleClose] : ${e}`);
  }
}

export async function openCloseQuoteSigned(
  openCloseQuoteValue: closeQuoteSignValueType,
  signatureCloseQuote: string,
  accountId: number,
  chainId: string,
) {
  try {
    const { account, wallet, address } = getAccountData(accountId, chainId);
    const nonce = await web3Clients[Number(chainId)].getTransactionCount({
      address: address as `0x${string}`,
    });
    const request = await web3Clients[Number(chainId)].simulateContract({
      address: networks[chainId as unknown as NetworkKey].contracts
        .PionerV1Close as Address,
      abi: PionerV1Close.abi,
      functionName: 'openCloseQuoteSigned',
      args: [
        openCloseQuoteValue,
        signatureCloseQuote,
        config.publicKeys?.split(',')[accountId],
      ],
      account: account,
    });
    const transactionParameters = {
      ...request.request,
      nonce: nonce,
    };
    return await wallet.writeContract(
      transactionParameters as unknown as WriteContractParameters,
    );
  } catch (e) {
    console.log(`[Blockchain] [settleClose] : ${e}`);
  }
}

export async function acceptCloseQuote(
  bCloseQuoteId: number,
  amount: string,
  accountId: number,
  chainId: string,
) {
  try {
    const { account, wallet, address } = getAccountData(accountId, chainId);
    const nonce = await web3Clients[Number(chainId)].getTransactionCount({
      address: address as `0x${string}`,
    });
    const network = networks[chainId as unknown as NetworkKey];
    const web3Client = web3Clients[Number(chainId)];
    if (!web3Client) {
      throw new Error('Invalid web3 client configuration');
    }
    const request = await web3Client.simulateContract({
      address: network.contracts.PionerV1Close as Address,
      abi: PionerV1Close.abi,
      functionName: 'acceptCloseQuote',
      args: [bCloseQuoteId, amount],
      account: account,
    });
    const result = await wallet.writeContract(
      request.request as unknown as WriteContractParameters,
    );
    return result;
  } catch (e) {
    console.log(`[Blockchain] [settleClose] : ${e}`);
    throw e;
  }
}

export async function updatePriceAndDefault(
  priceSignature: any,
  bContractId: string,
  accountId: number,
  chainId: string,
) {
  try {
    const { account, wallet, address } = getAccountData(accountId, chainId);
    const nonce = await web3Clients[Number(chainId)].getTransactionCount({
      address: address as `0x${string}`,
    });
    const request = await web3Clients[Number(chainId)].simulateContract({
      address: networks[chainId as unknown as NetworkKey].contracts
        .PionerV1Wrapper as Address,
      abi: PionerV1Wrapper.abi,
      functionName: 'wrapperUpdatePriceAndDefault',
      args: [priceSignature, parseUnits(bContractId, 0)],
      account: account,
    });
    const transactionParameters = {
      ...request.request,
      nonce: nonce,
    };
    return await wallet.writeContract(
      transactionParameters as unknown as WriteContractParameters,
    );
  } catch (e) {
    console.log(`[Blockchain] [updatePriceAndDefault1] : ${e}`);
  }
}

export async function updatePricePion(
  priceSignature: any,
  bOracleId: string,
  accountId: number,
  chainId: string,
) {
  try {
    const { account, wallet, address } = getAccountData(accountId, chainId);
    const nonce = await web3Clients[Number(chainId)].getTransactionCount({
      address: address as `0x${string}`,
    });
    const request = await web3Clients[Number(chainId)].simulateContract({
      address: networks[chainId as unknown as NetworkKey].contracts
        .PionerV1Oracle as Address,
      abi: PionerV1Oracle.abi,
      functionName: 'updatePricePion',
      args: [priceSignature, bOracleId],
      account: account,
    });
    const transactionParameters = {
      ...request.request,
      nonce: nonce,
    };
    return await wallet.writeContract(
      transactionParameters as unknown as WriteContractParameters,
    );
  } catch (e) {
    console.log(`[Blockchain] [updatePricePion] : ${e}`);
  }
}
