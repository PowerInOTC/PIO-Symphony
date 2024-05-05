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
