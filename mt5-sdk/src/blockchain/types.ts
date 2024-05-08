import { BigNumber } from 'ethers';

export type BOracleSignValueType = {
  x: string;
  parity: number;
  maxConfidence: string;
  assetHex: string;
  maxDelay: number;
  precision: number;
  imA: string;
  imB: string;
  dfA: string;
  dfB: string;
  expiryA: number;
  expiryB: number;
  timeLock: number;
  signatureHashOpenQuote: string;
  nonce: number;
};

export type openQuoteSignValueType = {
  isLong: boolean;
  bOracleId: number;
  price: string;
  amount: string;
  interestRate: string;
  isAPayingAPR: boolean;
  frontEnd: string;
  affiliate: string;
  authorized: string;
  nonce: number;
};

export type closeQuoteSignValueType = {
  bContractId: number;
  price: BigNumber;
  amount: BigNumber;
  limitOrStop: BigNumber;
  expiry: number;
  authorized: string;
  nonce: number;
};

interface BOracle {
  assetHex: string;
  oracleType: BigNumber;
  lastBid: BigNumber;
  lastAsk: BigNumber;
  publicOracleAddress: string;
  maxConfidence: BigNumber;
  x: BigNumber;
  parity: number;
  maxDelay: BigNumber;
  lastPrice: BigNumber;
  lastPriceUpdateTime: BigNumber;
  imA: BigNumber;
  imB: BigNumber;
  dfA: BigNumber;
  dfB: BigNumber;
  expiryA: BigNumber;
  expiryB: BigNumber;
  timeLock: BigNumber;
  cType: BigNumber;
  forceCloseType: BigNumber;
  kycAddress: string;
  isPaused: boolean;
  deployTime: BigNumber;
}

export interface pionSignType {
  appId: bigint;
  reqId: string;
  requestassetHex: string;
  requestPairBid: bigint;
  requestPairAsk: bigint;
  requestConfidence: bigint;
  requestSignTime: bigint;
  requestPrecision: bigint;
  signature: bigint;
  owner: string;
  nonce: string;
}

export interface Signature {
  owner: string;
  ownerPubKey: {
    x: string;
    yParity: string;
  };
  signature: string;
}

export interface SignParams {
  name: string;
  type: string;
  value: string;
}

export interface Result {
  asset1: string;
  asset2: string;
  requestPairBid: string;
  requestPairAsk: string;
  pairBid: string;
  pairAsk: string;
  confidence: string;
  requestConfidence: string;
  requestSignTime: string;
  oldestTimestamp: string;
}

export interface Data {
  uid: string;
  params: {
    asset1: string;
    asset2: string;
    requestPairBid: string;
    requestPairAsk: string;
    requestConfidence: string;
    requestSignTime: string;
  };
  timestamp: number;
  result: Result;
  resultHash: string;
  signParams: SignParams[];
  init: {
    nonceAddress: string;
  };
}

export interface PionResult {
  success: boolean;
  result: {
    confirmed: boolean;
    reqId: string;
    app: string;
    appId: string;
    method: string;
    deploymentSeed: string;
    nSign: number;
    gwAddress: string;
    data: Data;
    startedAt: number;
    confirmedAt: number;
    signatures: Signature[];
  };
}
