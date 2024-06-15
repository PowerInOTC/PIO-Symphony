// pnpm jest -- openSignWorker.test.ts
import { ethers } from 'ethers';
import { config } from '../../config';
import { getToken } from '../../utils/init';
import {
  sendSignedWrappedOpenQuote,
  SignedWrappedOpenQuoteRequest,
} from '@pionerfriends/api-client';
import { networks, NetworkKey } from '@pionerfriends/blockchain-client';
import { convertToBytes32 } from '../../utils/ethersUtils';
import { initAccount } from '../../blockchain/blockchainInit.test';
// cancelAllOpenQuotes.test.ts
import { cancelAllOpenQuotes } from '../24cancelOpenQuote/bot.24';
import { settleOpen } from '../../blockchain/write';

describe('OpenQuoteButton', () => {
  let token: string;
  let user: ethers.Wallet;
  let pionerV1Open: string;
  let pionerV1Wrapper: string;
  let hedger: ethers.Wallet;
  let chainId: string;

  beforeAll(async () => {
    const userId = 1;
    const hedgerId = 0;
    chainId = String(64165);
    await getToken(hedgerId);
    token = await getToken(userId);
    await cancelAllOpenQuotes(token, userId);

    pionerV1Open =
      networks[chainId as unknown as NetworkKey].contracts.PionerV1Open;
    pionerV1Wrapper =
      networks[chainId as unknown as NetworkKey].contracts.PionerV1Open;
    hedger = new ethers.Wallet(config.privateKeys?.split(',')[hedgerId]);
    user = new ethers.Wallet(config.privateKeys?.split(',')[userId]);
  });

  it('should send a signed wrapped open quote', async () => {
    // uncomment on first time
    //await initAccount(0);
    //await initAccount(1);

    const nonce = Date.now().toString();

    const quote: SignedWrappedOpenQuoteRequest = {
      issuerAddress: user.address,
      counterpartyAddress: hedger.address,
      version: '1.0',
      chainId: Number(chainId),
      verifyingContract: pionerV1Open,
      x: '0x20568a84796e6ade0446adfd2d8c4bba2c798c2af0e8375cc3b734f71b17f5fd',
      parity: String(0),
      maxConfidence: String(ethers.utils.parseUnits('1', 18)),
      assetHex: convertToBytes32('forex.EURUSD/forex.USDCHF'),
      maxDelay: '600',
      precision: 5,
      imA: String(ethers.utils.parseUnits('10', 16)),
      imB: String(ethers.utils.parseUnits('10', 16)),
      dfA: String(ethers.utils.parseUnits('25', 15)),
      dfB: String(ethers.utils.parseUnits('25', 15)),
      expiryA: '129600',
      expiryB: '129600',
      timeLock: '129600',
      nonceBoracle: nonce,
      signatureBoracle: '',
      isLong: false,
      price: String(ethers.utils.parseUnits('11', 17)),
      amount: String(ethers.utils.parseUnits('100', 18)),
      interestRate: String(ethers.utils.parseUnits('4970', 16)),
      isAPayingApr: true,
      frontEnd: user.address,
      affiliate: user.address,
      authorized: '0x0000000000000000000000000000000000000000', //hedger.address,
      nonceOpenQuote: nonce,
      signatureOpenQuote: '',
      emitTime: String(Date.now()),
      messageState: 1,
    };

    const domainOpen = {
      name: 'PionerV1Open',
      version: '1.0',
      chainId: chainId,
      verifyingContract: pionerV1Open,
    };

    const openQuoteSignType = {
      Quote: [
        { name: 'isLong', type: 'bool' },
        { name: 'bOracleId', type: 'uint256' },
        { name: 'price', type: 'uint256' },
        { name: 'amount', type: 'uint256' },
        { name: 'interestRate', type: 'uint256' },
        { name: 'isAPayingAPR', type: 'bool' },
        { name: 'frontEnd', type: 'address' },
        { name: 'affiliate', type: 'address' },
        { name: 'authorized', type: 'address' },
        { name: 'nonce', type: 'uint256' },
      ],
    };

    const openQuoteSignValue = {
      isLong: quote.isLong,
      bOracleId: '0',
      price: quote.price,
      amount: quote.amount,
      interestRate: quote.interestRate,
      isAPayingAPR: quote.isAPayingApr,
      frontEnd: quote.frontEnd,
      affiliate: quote.affiliate,
      authorized: hedger.address,
      nonce: quote.nonceOpenQuote,
    };

    const signatureOpenQuote = await user._signTypedData(
      domainOpen,
      openQuoteSignType,
      openQuoteSignValue,
    );

    const domainWrapper = {
      name: 'PionerV1Wrapper',
      version: '1.0',
      chainId: chainId,
      verifyingContract: pionerV1Wrapper,
    };

    const bOracleSignType = {
      bOracleSign: [
        { name: 'x', type: 'uint256' },
        { name: 'parity', type: 'uint8' },
        { name: 'maxConfidence', type: 'uint256' },
        { name: 'assetHex', type: 'bytes32' },
        { name: 'maxDelay', type: 'uint256' },
        { name: 'precision', type: 'uint256' },
        { name: 'imA', type: 'uint256' },
        { name: 'imB', type: 'uint256' },
        { name: 'dfA', type: 'uint256' },
        { name: 'dfB', type: 'uint256' },
        { name: 'expiryA', type: 'uint256' },
        { name: 'expiryB', type: 'uint256' },
        { name: 'timeLock', type: 'uint256' },
        { name: 'signatureHashOpenQuote', type: 'bytes' },
        { name: 'nonce', type: 'uint256' },
      ],
    };

    const bOracleSignValue = {
      x: quote.x,
      parity: quote.parity,
      maxConfidence: quote.maxConfidence,
      assetHex: quote.assetHex,
      maxDelay: quote.maxDelay,
      precision: String(quote.precision),
      imA: quote.imA,
      imB: quote.imB,
      dfA: quote.dfA,
      dfB: quote.dfB,
      expiryA: quote.expiryA,
      expiryB: quote.expiryB,
      timeLock: quote.timeLock,
      signatureHashOpenQuote: signatureOpenQuote,
      nonce: quote.nonceBoracle,
    };

    const signaturebOracleSign = await user._signTypedData(
      domainWrapper,
      bOracleSignType,
      bOracleSignValue,
    );

    quote.signatureBoracle = signaturebOracleSign;
    quote.signatureOpenQuote = signatureOpenQuote;

    const isFilled = settleOpen(
      bOracleSignValue,
      quote.signatureBoracle,
      openQuoteSignValue,
      quote.signatureOpenQuote,
      quote.price,
      0,
      String(quote.chainId),
    );
    console.log(isFilled);
    /*
    try {
      const tx = await sendSignedWrappedOpenQuote(quote, token);
      console.log(tx?.data);
      expect(tx).toBeDefined();
    } catch (error: any) {
      console.error('Error:', error);
    }*/
  });
});
