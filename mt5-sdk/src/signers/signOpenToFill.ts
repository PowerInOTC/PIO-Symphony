import {
  SignedFillOpenQuoteRequest,
  signedWrappedOpenQuoteResponse,
  RfqResponse,
} from '@pionerfriends/api-client';
import { config } from '../config';
import { ethers } from 'ethers';
import { checkRFQCore } from '../rfq/checkRfq';
import { extractSymbolFromAssetHex } from '../utils/ethersUtils';
const addr1 = new ethers.Wallet(config.privateKeys?.split(',')[0]);

export interface checkFillSign {
  checkSelfBalance: boolean;
  checkCounterpartyBalance: boolean;
}

export async function signOpenToFill(open: signedWrappedOpenQuoteResponse) {
  const symbol = extractSymbolFromAssetHex(open.assetHex);

  const rfqResponse: RfqResponse = {
    id: '',
    chainId: open.chainId,
    createdAt: '',
    userId: '',
    userAddress: open.issuerAddress,
    expiration: open.expiryA,
    assetAId: symbol.assetAId,
    assetBId: symbol.assetBId,
    sPrice: open.price,
    sQuantity: open.amount,
    sInterestRate: open.interestRate,
    sIsPayingApr: open.isAPayingApr,
    sImA: open.imA,
    sImB: open.imB,
    sDfA: open.dfA,
    sDfB: open.dfB,
    sExpirationA: open.expiryA,
    sExpirationB: open.expiryB,
    sTimelockA: open.timeLock,
    sTimelockB: open.timeLock,
    lPrice: open.price,
    lQuantity: open.amount,
    lInterestRate: open.interestRate,
    lIsPayingApr: open.isAPayingApr,
    lImA: open.imA,
    lImB: open.imB,
    lDfA: open.dfA,
    lDfB: open.dfB,
    lExpirationA: open.expiryA,
    lExpirationB: open.expiryB,
    lTimelockA: open.timeLock,
    lTimelockB: open.timeLock,
  };
  const checkOpenSign = await checkRFQCore(rfqResponse);

  const signCloseQuote = await addr1.signMessage(open.signatureOpenQuote);

  const fill: SignedFillOpenQuoteRequest = {
    issuerAddress: open.counterpartyAddress,
    counterpartyAddress: open.issuerAddress,
    signatureOpenQuote: open.signatureOpenQuote,
    version: open.version,
    chainId: open.chainId,
    verifyingContract: open.verifyingContract,
    bcontractId: 0,
    acceptPrice: open.price,
    backendAffiliate: '0xd0dDF915693f13Cf9B3b69dFF44eE77C901882f8',
    amount: open.amount,
    nonceAcceptQuote: open.nonceOpenQuote,
    signatureAcceptQuote: signCloseQuote,
    emitTime: open.emitTime,
    messageState: open.messageState,
  };
  open.nonceOpenQuote;
  return fill;
}
