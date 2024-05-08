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
  pionerV1ViewContract,
} from '../utils/init';
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

export async function getbOracle(
  bOracleId: bigint,
  chainId: number,
): Promise<BOracle> {
  const oracle = await web3Client.readContract({
    address: pionerV1ViewContract[chainId] as Address,
    abi: PionerV1View.abi,
    functionName: 'getOracle',
    args: [bOracleId],
  });
  console.log('bOracleId', oracle);
  return oracle as BOracle;
}

export async function getbContract(
  bContractId: bigint,
  chainId: number,
): Promise<BContract> {
  const bContract = await web3Client.readContract({
    address: pionerV1ViewContract[chainId] as Address,
    abi: PionerV1View.abi,
    functionName: 'getContract',
    args: [bContractId],
  });
  console.log('bContractId', bContract);
  return bContract as BContract;
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
