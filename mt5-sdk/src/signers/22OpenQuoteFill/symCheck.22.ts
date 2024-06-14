import {
  SignedFillOpenQuoteRequest,
  signedWrappedOpenQuoteResponse,
  RfqResponse,
} from '@pionerfriends/api-client';
import { config } from '../../config';
import { ethers } from 'ethers';
import RfqChecker, { ErrorObject } from '../12rfqFill/symCheck.12';
import { extractSymbolFromAssetHex } from '../../utils/ethersUtils';
import { networks, NetworkKey } from '@pionerfriends/blockchain-client';
import { getTripartyLatestPrice } from '../../broker/tripartyPrice';
import { hedger } from '../../broker/inventory';
import { settleOpen } from '../../blockchain/write';
import {
  BOracleSignValueType,
  openQuoteSignValueType,
} from '../../blockchain/types';
import { parseUnits, formatUnits } from 'viem';
import {
  getMarketStatus,
  MarketStatusResponse,
} from '../../broker/marketStatus';

const addr1 = new ethers.Wallet(config.privateKeys?.split(',')[0]);

export async function signOpenCheck(
  open: signedWrappedOpenQuoteResponse,
  token: string,
) {
  let isCheck = true;
  const openPrice = formatUnits(parseUnits(open.price, 1), 18);
  const openAmount: string = formatUnits(parseUnits(open.amount, 1), 18);
  let acceptPrice = String(openPrice);

  const symbol = extractSymbolFromAssetHex(open.assetHex);
  const tripartyLatestPrice = await getTripartyLatestPrice(
    `${symbol.assetAId}/${symbol.assetBId}`,
  );

  const marketStatus = getMarketStatus(
    token,
    `${symbol.assetAId}/${symbol.assetBId}`,
  );
  if (!marketStatus) {
    isCheck = false;
    throw new Error('open check failed : market status is not open');
  }

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
    sQuantity: openAmount,
    sInterestRate: formatUnits(parseUnits(open.interestRate, 1), 18),
    sIsPayingApr: open.isAPayingApr,
    sImA: formatUnits(parseUnits(open.imA, 1), 18),
    sImB: formatUnits(parseUnits(open.imB, 1), 18),
    sDfA: formatUnits(parseUnits(open.dfA, 1), 18),
    sDfB: formatUnits(parseUnits(open.dfB, 1), 18),
    sExpirationA: open.expiryA,
    sExpirationB: open.expiryB,
    sTimelockA: open.timeLock,
    sTimelockB: open.timeLock,
    lPrice: openPrice,
    lQuantity: openAmount,
    lInterestRate: formatUnits(parseUnits(open.interestRate, 1), 18),
    lIsPayingApr: open.isAPayingApr,
    lImA: formatUnits(parseUnits(open.imA, 1), 18),
    lImB: formatUnits(parseUnits(open.imB, 1), 18),
    lDfA: formatUnits(parseUnits(open.dfA, 1), 18),
    lDfB: formatUnits(parseUnits(open.dfB, 1), 18),
    lExpirationA: open.expiryA,
    lExpirationB: open.expiryB,
    lTimelockA: open.timeLock,
    lTimelockB: open.timeLock,
  };
  const checker = new RfqChecker(rfqResponse);
  checker
    .check()
    .then((errors: ErrorObject[]) => {
      if (errors.length === 0) {
      } else {
        isCheck = false;
        console.log('RFQ failed the following checks:');
        errors.forEach((error) => {
          console.log(`Field: ${error.field}, Value: ${error.value}`);
        });
      }
    })
    .catch((error) => {
      console.error('An error occurred during RFQ checking:', error);
    });

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
    const fill2 = new SignedFillOpenQuoteRequest
    // fill3
  
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

    console.log('fill', fill);

    const isPassed = await hedger(
      `${symbol.assetAId}/${symbol.assetBId}`,
      Number(openPrice),
      open.signatureOpenQuote,
      Number(openAmount), // TODO /1e18
      open.isLong,
      true,
    );
    if (!isPassed) {
      isCheck = false;
      throw new Error('open check failed for : hedger failed');
    }

    const bOracleSignValue = {
      x: open.x,
      parity: Number(open.parity),
      maxConfidence: parseUnits(open.maxConfidence, 0),
      assetHex: open.assetHex,
      maxDelay: Number(open.maxDelay),
      precision: open.precision,
      imA: parseUnits(open.imA,0),
      imB: parseUnits(open.imB,0),
      dfA: parseUnits(open.dfA,0),
      dfB: parseUnits(open.dfB,0),
      expiryA: Number(open.expiryA),
      expiryB: Number(open.expiryB),
      timeLock: Number(open.timeLock),
      signatureHashOpenQuote: open.signatureOpenQuote,
      nonce: parseUnits(open.nonceOpenQuote,0),
    };

    const openQuoteSignValue = {
      isLong: open.isLong,
      bOracleId: 0,
      price: parseUnits(openPrice,0),
      amount: parseUnits(open.amount,0),
      interestRate: parseUnits(open.interestRate,0),
      isAPayingAPR: open.isAPayingApr,
      frontEnd: open.frontEnd,
      affiliate: open.affiliate,
      authorized: open.authorized,
      nonce: open.nonceOpenQuote,
    };
    try {
      const isFilled = settleOpen(
        bOracleSignValue,
        open.signatureBoracle,
        openQuoteSignValue,
        open.signatureOpenQuote,
        open.price,
        0,
        String(open.chainId),
      );
    } catch (e) {}

    return fill;
  } else throw new Error('open check failed for : unknown');
}



The contract function "wrapperOpenQuoteMM" reverted with the following reason:
signers mismatch

Contract Call:
  address:   0x49161e5F8b03765a126184e337f6E6234D05E816
  function:  wrapperOpenQuoteMM((uint256 x, uint8 parity, uint256 maxConfidence, bytes32 assetHex, uint256 maxDelay, uint256 precision, uint256 imA, uint256 imB, uint256 dfA, uint256 dfB, uint256 expiryA, uint256 expiryB, uint256 timeLock, bytes signatureHashOpenQuote, uint256 nonce), bytes signaturebOracleSign, (bool isLong, uint256 bOracleId, uint256 price, uint256 amount, uint256 interestRate, bool isAPayingAPR, address frontEnd, address affiliate, address authorized, uint256 nonce), bytes openQuoteSignature, uint256 _acceptPrice)       
  args:                        ({"x":"0x20568a84796e6ade0446adfd2d8c4bba2c798c2af0e8375cc3b734f71b17f5fd","parity":0,"maxConfidence":"1000000000000000000","assetHex":"0x666f7265782e4555525553442f666f7265782e55534443484600000000000000","maxDelay":600,"precision":5,"imA":"100000000000000000","imB":"100000000000000000","dfA":"25000000000000000","dfB":"25000000000000000","expiryA":129600,"expiryB":129600,"timeLock":129600,"signatureHashOpenQuote":"0x1bbc476fff01cfb1abfd95aa50a86b356e187686d742457d0f89613988a2bd54056f798fa53a173bb94b502b1f399a1bdb7956f52131803ff06350991290c3161b","nonce":"1718328201519"}, 0xeff6d8f53f56b974f3b89dcf18bab47b7d03d8ae8e1be11df96e3573e10086de0fee0bf898cda98a39d119fb2289df429470f97e88d6b13ed3a3ea7d45774e211c, {"isLong":false,"bOracleId":0,"price":"11","amount":"100000000000000000000","interestRate":"49700000000000000000","isAPayingAPR":true,"frontEnd":"0x734A5a550744F16CCe335f5735bf5eeE24412ba2","affiliate":"0x734A5a550744F16CCe335f5735bf5eeE24412ba2","authorized":"0xd0dDF915693f13Cf9B3b69dFF44eE77C901882f8","nonce":"1718328201519"}, 0x1bbc476fff01cfb1abfd95aa50a86b356e187686d742457d0f89613988a2bd54056f798fa53a173bb94b502b1f399a1bdb7956f52131803ff06350991290c3161b, 1100000000000000000)
  sender:    0xd0dDF915693f13Cf9B3b69dFF44eE77C901882f8