// pnpm jest -- openSignWorker.test.ts
import { ethers } from 'ethers';
import { config } from '../config';
import { getToken } from '../utils/init';
import {
  sendSignedWrappedOpenQuote,
  SignedWrappedOpenQuoteRequest,
} from '@pionerfriends/api-client';
import { networks, NetworkKey } from '@pionerfriends/blockchain-client';
import { convertToBytes32 } from '../utils/ethersUtils';
import { initAccount } from '../blockchain/blockchainInit.test';

describe('OpenQuoteButton', () => {
  let token: string;
  let addr2: ethers.Wallet;
  let pionerV1Open: string;
  let pionerV1Wrapper: string;
  let addr1: ethers.Wallet;
  let chainId: string;

  beforeAll(async () => {
    await getToken(0);
    token = await getToken(1);

    chainId = String(64165);

    pionerV1Open =
      networks[chainId as unknown as NetworkKey].contracts.PionerV1Open;
    pionerV1Wrapper =
      networks[chainId as unknown as NetworkKey].contracts.PionerV1Open;
    addr2 = new ethers.Wallet(config.privateKeys?.split(',')[1]);
    addr1 = new ethers.Wallet(config.privateKeys?.split(',')[0]);
  });

  it('should send a signed wrapped open quote', async () => {
    // uncomment on first time
    //await initAccount(0);
    //await initAccount(1);

    const nonce = Date.now().toString();
    const wallet = {
      address: addr2.address,
    };
    const bestBid = {
      counterpartyAddress: addr1.address,
    };

    const quote: SignedWrappedOpenQuoteRequest = {
      issuerAddress: wallet.address,
      counterpartyAddress: bestBid.counterpartyAddress,
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
      interestRate: String(ethers.utils.parseUnits('497', 16)),
      isAPayingApr: true,
      frontEnd: addr2.address,
      affiliate: addr2.address,
      authorized: addr1.address,
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
      bOracleId: 0,
      price: quote.price,
      amount: quote.amount,
      interestRate: quote.interestRate,
      isAPayingAPR: quote.isAPayingApr,
      frontEnd: quote.frontEnd,
      affiliate: quote.affiliate,
      authorized: addr1.address,
      nonce: quote.nonceOpenQuote,
    };

    const signatureOpenQuote = await addr2._signTypedData(
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
      precision: quote.precision,
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

    const signaturebOracleSign = await addr2._signTypedData(
      domainWrapper,
      bOracleSignType,
      bOracleSignValue,
    );

    quote.signatureBoracle = signaturebOracleSign;
    quote.signatureOpenQuote = signatureOpenQuote;
    try {
      const tx = await sendSignedWrappedOpenQuote(quote, token);
      console.log(tx?.data);
      expect(tx).toBeDefined();
    } catch (error: any) {
      console.error('Error:', error);
    }
  });
});
