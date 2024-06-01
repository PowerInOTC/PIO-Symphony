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
        .pionerV1Compliance as Address,
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

export async function getbContract(
  bContractId: string,
  chainId: string,
): Promise<BContract> {
  const bContract = await web3Clients[Number(chainId)].readContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1View as Address,
    abi: PionerV1View.abi,
    functionName: 'getContract',
    args: [bContractId],
  });

  console.log('bContractId', bContract);

  const {
    pA,
    pB,
    oracleId,
    initiator,
    price,
    amount,
    interestRate,
    isAPayingAPR,
    openTime,
    state,
    frontEnd,
    hedger,
    affiliate,
    cancelTime,
  } = bContract as {
    pA: string;
    pB: string;
    oracleId: bigint;
    initiator: string;
    price: bigint;
    amount: bigint;
    interestRate: bigint;
    isAPayingAPR: boolean;
    openTime: bigint;
    state: bigint;
    frontEnd: string;
    hedger: string;
    affiliate: string;
    cancelTime: bigint;
  };

  return {
    pA,
    pB,
    oracleId,
    initiator,
    price,
    amount,
    interestRate,
    isAPayingAPR,
    openTime,
    state,
    frontEnd,
    hedger,
    affiliate,
    cancelTime,
  };
}
/*
   function getOracle(uint256 oracleId) public view returns (
        bytes32 assetHex,
        uint256 oracleType,
        uint256 lastBid,
        uint256 lastAsk,
        address publicOracleAddress,
        uint256 maxConfidence,
        uint256 x,
        uint8 parity,
        uint256 maxDelay,
        uint256 lastPrice,
        uint256 lastPriceUpdateTime,
        uint256 imA,
        uint256 imB,
        uint256 dfA,
        uint256 dfB,
        uint256 expiryA,
        uint256 expiryB,
        uint256 timeLock,
        uint256 cType,
        uint256 forceCloseType,
        address kycAddress,
        bool isPaused,
        uint256 deployTime
    ) {
        utils.bOracle memory oracle = pio.getBOracle(oracleId);
        return (
            oracle.assetHex,
            oracle.oracleType,
            oracle.lastBid,
            oracle.lastAsk,
            oracle.publicOracleAddress,
            oracle.maxConfidence,
            oracle.x,
            oracle.parity,
            oracle.maxDelay,
            oracle.lastPrice,
            oracle.lastPriceUpdateTime,
            oracle.imA,
            oracle.imB,
            oracle.dfA,
            oracle.dfB,
            oracle.expiryA,
            oracle.expiryB,
            oracle.timeLock,
            oracle.cType,
            oracle.forceCloseType,
            oracle.kycAddress,
            oracle.isPaused,
            oracle.deployTime
        );
    }


    function getContract(uint256 contractId) public view returns (
        address pA,
        address pB,
        uint256 oracleId,
        address initiator,
        uint256 price,
        uint256 amount,
        uint256 interestRate,
        bool isAPayingAPR,
        uint256 openTime,
        uint256 state,
        address frontEnd,
        address hedger,
        address affiliate,
        uint256 cancelTime
    ) {
        utils.bContract memory bC = pio.getBContract(contractId);
        return (
            bC.pA,
            bC.pB,
            bC.oracleId,
            bC.initiator,
            bC.price,
            bC.amount,
            bC.interestRate,
            bC.isAPayingAPR,
            bC.openTime,
            bC.state,
            bC.frontEnd,
            bC.hedger,
            bC.affiliate,
            bC.cancelTime
        );
    }
    */
export function convertToBytes32(str: string): string {
  const hex = Web3.utils.toHex(str);
  return Web3.utils.padRight(hex, 64, '0');
}
