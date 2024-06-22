import { BigNumber } from 'ethers';

export type BOracleSignValueType = {
  x: string;
  parity: string;
  maxConfidence: string;
  assetHex: string;
  maxDelay: string;
  precision: string;
  imA: string;
  imB: string;
  dfA: string;
  dfB: string;
  expiryA: string;
  expiryB: string;
  timeLock: string;
  signatureHashOpenQuote: string;
  nonce: string;
};

export type openQuoteSignValueType = {
  isLong: boolean;
  bOracleId: string;
  price: string;
  amount: string;
  interestRate: string;
  isAPayingAPR: boolean;
  frontEnd: string;
  affiliate: string;
  authorized: string;
  nonce: string;
};

export type closeQuoteSignValueType = {
  bContractId: string;
  price: string;
  amount: string;
  limitOrStop: string;
  expiry: string;
  authorized: string;
  nonce: string;
};

export interface BOracle {
  assetHex: string;
  oracleType: string;
  lastBid: string;
  lastAsk: string;
  publicOracleAddress: string;
  maxConfidence: string;
  x: string;
  parity: number;
  maxDelay: string;
  lastPrice: string;
  lastPriceUpdateTime: string;
  imA: string;
  imB: string;
  dfA: string;
  dfB: string;
  expiryA: string;
  expiryB: string;
  timeLock: string;
  cType: string;
  forceCloseType: string;
  kycAddress: string;
  isPaused: boolean;
  deployTime: string;
}

export interface pionSignType {
  appId: string;
  reqId: string;
  requestassetHex: string;
  requestPairBid: string;
  requestPairAsk: string;
  requestConfidence: string;
  requestSignTime: string;
  requestPrecision: string;
  signature: string;
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
