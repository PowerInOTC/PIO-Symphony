import {
  SignedFillOpenQuoteRequest,
  signedWrappedOpenQuoteResponse,
  RfqResponse,
} from '@pionerfriends/api-client';
import { config } from '../config';
import { ethers } from 'ethers';
import { checkRFQCore } from '../rfq/checkRfq';
import { verifyCheckRFQ } from '../rfq/rfq';
import { extractSymbolFromAssetHex } from '../utils/ethersUtils';
import { networks, NetworkKey } from '@pionerfriends/blockchain-client';
import { getTripartyLatestPrice } from '../broker/tripartyPrice';
import { hedger } from '../broker/inventory';
import { settleOpen } from '../blockchain/write';
import {
  BOracleSignValueType,
  openQuoteSignValueType,
} from '../blockchain/types';
import { parseUnits, formatUnits } from 'viem';

const addr1 = new ethers.Wallet(config.privateKeys?.split(',')[0]);

export async function signOpenCheck(open: signedWrappedOpenQuoteResponse) {
  let isCheck = true;
  const openPrice = formatUnits(parseUnits(open.price, 1), 18);
  let acceptPrice = String(openPrice);

  const symbol = extractSymbolFromAssetHex(open.assetHex);
  const tripartyLatestPrice = await getTripartyLatestPrice(
    `${symbol.assetAId}/${symbol.assetAId}`,
  );

  if (open.isLong) {
    if (tripartyLatestPrice.ask <= Number(openPrice) * (1 + 0.0001)) {
      isCheck = false;
      throw new Error(
        `open check failed : ask : ${tripartyLatestPrice.ask} > price ${openPrice}`,
      );
    } else {
      acceptPrice = String(tripartyLatestPrice.ask * (1 + 0.0001));
    }
  }
  if (!open.isLong) {
    if (tripartyLatestPrice.bid >= Number(openPrice) * (1 - 0.0001)) {
      isCheck = false;
      throw new Error(
        'open check failed : bid : ${tripartyLatestPrice.bid} < price ${openPrice}',
      );
    } else {
      acceptPrice = String(tripartyLatestPrice.bid * (1 - 0.0001));
    }
  }

  console.log('Check opening symbol', symbol);

  const rfqResponse: RfqResponse = {
    id: '',
    chainId: open.chainId,
    createdAt: '',
    userId: '',
    userAddress: open.issuerAddress,
    expiration: open.expiryA,
    assetAId: symbol.assetAId,
    assetBId: symbol.assetBId,
    sPrice: openPrice,
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
    lPrice: openPrice,
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
  const isRFQValid = await verifyCheckRFQ(checkOpenSign);

  if (isRFQValid != true) {
    isCheck = false;
    throw new Error('open check failed : checkRFQ failed ');
  }

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
    acceptPrice: openPrice,
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
      acceptPrice: openPrice,
      backendAffiliate: '0xd0dDF915693f13Cf9B3b69dFF44eE77C901882f8',
      amount: open.amount,
      nonceAcceptQuote: open.nonceOpenQuote,
      signatureAcceptQuote: signatureFillOpen,
      emitTime: open.emitTime,
      messageState: 0,
    };

    const isPassed = await hedger(
      `${symbol.assetAId}/${symbol.assetAId}`,
      Number(openPrice),
      open.signatureOpenQuote,
      Number(open.amount), // TODO /1e18
      open.isLong,
      true,
    );

    const bOracleSignValue = {
      x: open.x,
      parity: Number(open.parity),
      maxConfidence: open.maxConfidence,
      assetHex: open.assetHex,
      maxDelay: Number(open.maxDelay),
      precision: open.precision,
      imA: open.imA,
      imB: open.imB,
      dfA: open.dfA,
      dfB: open.dfB,
      expiryA: Number(open.expiryA),
      expiryB: Number(open.expiryB),
      timeLock: Number(open.timeLock),
      signatureHashOpenQuote: open.signatureOpenQuote,
      nonce: open.nonceOpenQuote,
    };

    const openQuoteSignValue: openQuoteSignValueType = {
      isLong: open.isLong,
      bOracleId: 0,
      price: openPrice,
      amount: open.amount,
      interestRate: open.interestRate,
      isAPayingAPR: open.isAPayingApr,
      frontEnd: open.frontEnd,
      affiliate: open.affiliate,
      authorized: open.authorized,
      nonce: open.nonceOpenQuote,
    };

    const isFilled = settleOpen(
      bOracleSignValue,
      open.signatureBoracle,
      openQuoteSignValue,
      open.signatureOpenQuote,
      acceptPrice,
      0,
      String(open.chainId),
    );

    return fill;
  } else throw new Error('open check failed for : unknown');
}
