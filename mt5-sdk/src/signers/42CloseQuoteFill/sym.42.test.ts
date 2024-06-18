// pnpm jest -- openSignWorker.test.ts
import { ethers } from 'ethers';
import { config } from '../../config';
import { getToken } from '../../utils/init';
import {
  sendSignedWrappedOpenQuote,
  signedCloseQuoteResponse,
  sendSignedCloseQuote,
  SignedCloseQuoteRequest,
} from '@pionerfriends/api-client';
import { networks, NetworkKey } from '@pionerfriends/blockchain-client';
import { convertToBytes32 } from '../../utils/ethersUtils';
// cancelAllOpenQuotes.test.ts
import {
  settleClose,
  openCloseQuoteSigned,
  acceptCloseQuote,
} from '../../blockchain/write';

describe('OpenQuoteButton', () => {
  let token: string;
  let user: ethers.Wallet;
  let pionerV1Open: string;
  let pionerV1Close: string;
  let hedger: ethers.Wallet;
  let chainId: string;
  let userId: number;
  let hedgerId: number;

  beforeAll(async () => {
    userId = 1;
    hedgerId = 0;
    chainId = String(64165);
    await getToken(hedgerId);
    token = await getToken(userId);

    pionerV1Close =
      networks[chainId as unknown as NetworkKey].contracts.PionerV1Close;

    hedger = new ethers.Wallet(config.privateKeys?.split(',')[hedgerId]);
    user = new ethers.Wallet(config.privateKeys?.split(',')[userId]);
  });

  it('should send a signed wrapped open quote', async () => {
    // uncomment on first time
    //await initAccount(hedgerId);
    //await initAccount(userId);

    const nonce = Date.now().toString();

    const quote: signedCloseQuoteResponse = {
      issuerAddress: user.address,
      counterpartyAddress: hedger.address,
      version: '1.0',
      chainId: Number(chainId),
      verifyingContract: pionerV1Close,
      bcontractId: 0,
      isLong: true,
      price: String(ethers.utils.parseUnits('10', 17)),
      amount: String(ethers.utils.parseUnits('50', 18)),
      limitOrStop: 0,
      expiry: '60000000000',
      authorized: hedger.address,
      nonce: nonce,
      signatureClose: '',
      emitTime: String(Date.now()),
      messageState: 1,
      assetHex: convertToBytes32('forex.EURUSD/forex.USDCHF'),
      signatureOpenQuote:
        '0x183b89f96bb187e91b8d4a30b26b1ce09db83743329058ad83eab6e2ef3e80f6',
      bid: '',
      ask: '',
      lastUpdate: '',
    };

    const domainWrapper = {
      name: 'PionerV1Close',
      version: '1.0',
      chainId: chainId,
      verifyingContract: pionerV1Close,
    };

    const OpenCloseQuoteType = {
      OpenCloseQuote: [
        { name: 'bContractId', type: 'uint256' },
        { name: 'price', type: 'uint256' },
        { name: 'amount', type: 'uint256' },
        { name: 'limitOrStop', type: 'uint256' },
        { name: 'expiry', type: 'uint256' },
        { name: 'authorized', type: 'address' },
        { name: 'nonce', type: 'uint256' },
      ],
    };

    const openCloseQuoteValue = {
      bContractId: String(quote.bcontractId),
      price: quote.price,
      amount: quote.amount,
      limitOrStop: String(String(ethers.utils.parseUnits('12', 17))),
      expiry: quote.expiry,
      authorized: quote.authorized,
      nonce: quote.nonce,
    };

    const signCloseQuote = await user._signTypedData(
      domainWrapper,
      OpenCloseQuoteType,
      openCloseQuoteValue,
    );
    /*
    const tx = await settleClose(
      openCloseQuoteValue,
      signCloseQuote,
      hedgerId,
      String(quote.chainId),
    );*/

    const close: SignedCloseQuoteRequest = {
      issuerAddress: user.address,
      counterpartyAddress: hedger.address,
      version: '1.0',
      chainId: Number(chainId),
      verifyingContract: pionerV1Close,
      bcontractId: quote.bcontractId,
      isLong: quote.isLong,
      price: quote.price,
      amount: quote.amount,
      limitOrStop: quote.limitOrStop,
      expiry: quote.expiry,
      authorized: hedger.address,
      nonce: nonce,
      signatureClose: signCloseQuote,
      emitTime: String(Date.now()),
      messageState: 1,
    };

    try {
      const tx = await sendSignedCloseQuote(close, token);
      console.log(tx?.data);
      expect(tx).toBeDefined();
    } catch (error: any) {
      console.error('Error:', error);
    }
  });
});
