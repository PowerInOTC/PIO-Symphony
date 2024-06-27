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
import { Hedger } from '../../broker/inventory';
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

export async function signOpenCheck(
  open: signedWrappedOpenQuoteResponse,
  token: string,
) {
  const addr1 = new ethers.Wallet(
    config.privateKeys?.split(',')[config.hedgerId],
  );
  const hedger = new Hedger();

  let isCheck = true;
  const openPrice = formatUnits(parseUnits(open.price, 0), 18);
  const openAmount: string = formatUnits(parseUnits(open.amount, 0), 18);
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
    if (tripartyLatestPrice.ask > Number(openPrice) * (1 + 0.0001)) {
      isCheck = false;
      throw new Error(
        `open check failed : ask : ${tripartyLatestPrice.ask} > price ${Number(openPrice) * (1 + 0.0001)}`,
      );
    } else {
      acceptPrice = openPrice;
    }
  }
  if (!open.isLong) {
    if (tripartyLatestPrice.bid < Number(openPrice) * (1 - 0.0001)) {
      isCheck = false;
      throw new Error(
        `open check failed : bid : ${tripartyLatestPrice.bid} < price ${Number(openPrice) * (1 - 0.0001)}`,
      );
    } else {
      acceptPrice = openPrice;
    }
  }

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
    chainId: config.activeChainId,
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
      messageState: 1,
    };

    console.log('fill', fill);

    const isPassed = await hedger.hedge(
      `${symbol.assetAId}/${symbol.assetBId}`,
      Number(openPrice),
      open.signatureOpenQuote,
      Number(parseFloat(formatUnits(parseUnits(open.amount, 0), 18))),
      open.isLong,
      true,
      open.issuerAddress,
    );
    /*
    if (!isPassed) {
      isCheck = false;
      throw new Error('open check failed for : hedger failed');
    }*/

    const bOracleSignValue = {
      x: open.x,
      parity: open.parity,
      maxConfidence: open.maxConfidence,
      assetHex: open.assetHex,
      maxDelay: open.maxDelay,
      precision: String(open.precision),
      imA: open.imA,
      imB: open.imB,
      dfA: open.dfA,
      dfB: open.dfB,
      expiryA: open.expiryA,
      expiryB: open.expiryB,
      timeLock: open.timeLock,
      signatureHashOpenQuote: open.signatureOpenQuote,
      nonce: open.nonceOpenQuote,
    };

    const openQuoteSignValue = {
      isLong: open.isLong,
      bOracleId: '0',
      price: open.price,
      amount: open.amount,
      interestRate: open.interestRate,
      isAPayingAPR: open.isAPayingApr,
      frontEnd: open.frontEnd,
      affiliate: open.affiliate,
      authorized: open.authorized,
      nonce: open.nonceOpenQuote,
    };
    try {
      console.log('[settleOpen');

      const isFilled = await settleOpen(
        bOracleSignValue,
        open.signatureBoracle,
        openQuoteSignValue,
        open.signatureOpenQuote,
        open.price,
        config.hedgerId,
        String(open.chainId),
      );

      console.log('isFilled', isFilled);
    } catch (e) {
      console.log(
        'settleOpen error',
        e,
        bOracleSignValue,
        open.signatureBoracle,
        openQuoteSignValue,
        open.signatureOpenQuote,
        open.price,
        config.hedgerId,
        String(open.chainId),
      );
    }

    return fill;
  } else throw new Error('open check failed for : unknown');
}
