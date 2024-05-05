import {
  SignedFillOpenQuoteRequest,
  signedWrappedOpenQuoteResponse,
} from '@pionerfriends/api-client';
import { getCheckRFQ } from '../rfq/checkRFQ';

export interface checkFillSign {
  checkSelfBalance: boolean;
  checkCounterpartyBalance: boolean;
}

const checkOpenSign = await getCheckRFQ(rfq);

const types4 = {
  CancelCloseQuoteRequest: [
    { name: 'targetHash', type: 'bytes' },
    { name: 'nonce', type: 'uint256' },
  ],
};
const cancelCloseRequestValue = {
  targetHash: signCloseQuote,
  nonce: 0,
};

//const signCancelCloseQuote = await addr1.signTypedData(domain, CancelCloseQuoteRequest, cancelCloseRequestValue);

export async function signOpenToFill(open: signedWrappedOpenQuoteResponse) {
  const fill: SignedFillOpenQuoteRequest = {
    issuerAddress: open.issuerAddress,
    counterpartyAddress: open.counterpartyAddress,
    signatureOpenQuote: open.signatureOpenQuote,
    version: open.version,
    chainId: open.chainId,
    verifyingContract: open.verifyingContract,
    bcontractId: open.bcontractId,
    acceptPrice: open.acceptPrice,
    backendAffiliate: '0xd0dDF915693f13Cf9B3b69dFF44eE77C901882f8',
    amount: open.amount,
    nonceAcceptQuote: open.nonceAcceptQuote,
    signatureAcceptQuote: open.signatureAcceptQuote,
    emitTime: open.emitTime,
    messageState: open.messageState,
  };
  return fill;
}
