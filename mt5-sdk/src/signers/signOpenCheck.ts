import {
  SignedFillOpenQuoteRequest,
  signedWrappedOpenQuoteResponse,
  RfqResponse,
} from '@pionerfriends/api-client';
import { config } from '../config';
import { ethers } from 'ethers';
import { checkRFQCore } from '../rfq/checkRfq';
import { extractSymbolFromAssetHex } from '../utils/ethersUtils';
import { networks, NetworkKey } from '@pionerfriends/blockchain-client';
import { getTripartyLatestPrice } from '../broker/tripartyPrice';
import { hedger } from '../broker/inventory';

const addr1 = new ethers.Wallet(config.privateKeys?.split(',')[0]);

export async function signOpenCheck(open: signedWrappedOpenQuoteResponse) {
  const symbol = extractSymbolFromAssetHex(open.assetHex);
  const tripartyLatestPrice = await getTripartyLatestPrice(
    `${symbol.assetAId}/${symbol.assetAId}`,
  );
  let isCheck = true;
  if (open.isLong) {
    if (tripartyLatestPrice.ask <= Number(open.price) * (1 + 0.0001)) {
      isCheck = false;
    }
  }
  if (!open.isLong) {
    if (tripartyLatestPrice.bid >= Number(open.price) * (1 - 0.0001)) {
      isCheck = false;
    }
  }

  console.log('symbol', symbol);

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

  const domainOpen = {
    name: 'PionerV1Open',
    version: '1.0',
    chainId: 64165,
    verifyingContract:
      networks[open.chainId as unknown as NetworkKey].contracts.PionerV1Open,
  };

  const AcceptOpenQuoteSignType = {
    AcceptQuote: [
      { name: 'bContractId', type: 'uint256' },
      { name: 'acceptPrice', type: 'uint256' },
      { name: 'backendAffiliate', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
    ],
  };
  const openQuoteSignValue = {
    bContractId: 0,
    acceptPrice: open.price,
    backendAffiliate: '0xd0dDF915693f13Cf9B3b69dFF44eE77C901882f8',
    amount: open.amount,
    nonce: open.nonceOpenQuote,
  };

  const signatureFillOpen = await addr1._signTypedData(
    domainOpen,
    AcceptOpenQuoteSignType,
    openQuoteSignValue,
  );

  if (isCheck) {
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
      signatureAcceptQuote: signatureFillOpen,
      emitTime: open.emitTime,
      messageState: 0,
    };

    const isPassed = await hedger(
      `${symbol.assetAId}/${symbol.assetAId}`,
      Number(open.price),
      open.signatureOpenQuote,
      open.amount,
      open.isLong,
      true,
    );

    return fill;
  } else throw new Error('check failed');
}
