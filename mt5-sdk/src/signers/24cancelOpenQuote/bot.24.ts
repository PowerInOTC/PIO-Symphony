import { config } from '../../config';
import {
  signedCloseQuoteResponse,
  getSignedCloseQuotes,
  SignedCancelOpenQuoteRequest,
  signedCancelOpenQuoteResponse,
  sendSignedCancelOpenQuote,
  getSignedWrappedOpenQuotes,
  signedWrappedOpenQuoteResponse,
} from '@pionerfriends/api-client';
import { ethers } from 'ethers';
import { networks, NetworkKey } from '@pionerfriends/blockchain-client';

export async function cancelAllOpenQuotes(
  token: string,
  pkId: number,
): Promise<void> {
  try {
    const addr1 = new ethers.Wallet(config.privateKeys?.split(',')[pkId]);

    const response = await getSignedWrappedOpenQuotes(
      '1.0',
      Number(config.activeChainId),
      token,
      {
        onlyActive: true,
        issuerAddress: config.publicKeys?.split(',')[pkId],
      },
    );
    console.log(response);
    const quotes: signedWrappedOpenQuoteResponse[] | undefined = response?.data;

    if (quotes) {
      for (const quote of quotes) {
        console.log(quote.signatureOpenQuote);

        const domainOpen = {
          name: 'PionerV1Open',
          version: '1.0',
          chainId: Number(quote.chainId),
          verifyingContract:
            networks[quote.chainId as unknown as NetworkKey].contracts
              .PionerV1Open,
        };

        const cancelSignType = {
          CancelRequestSign: [
            { name: 'orderHash', type: 'bytes' },
            { name: 'nonce', type: 'uint256' },
          ],
        };
        const cancelSignValue = {
          orderHash: quote.signatureOpenQuote,
          nonce: Date.now().toString(),
        };

        const signatureCancel = await addr1._signTypedData(
          domainOpen,
          cancelSignType,
          cancelSignValue,
        );

        const cancel: SignedCancelOpenQuoteRequest = {
          issuerAddress: quote.issuerAddress,
          counterpartyAddress: quote.counterpartyAddress,
          version: quote.version,
          chainId: quote.chainId,
          verifyingContract: quote.verifyingContract,
          targetHash: quote.signatureOpenQuote,
          nonceCancel: cancelSignValue.nonce,
          signatureCancel: signatureCancel,
          emitTime: Date.now().toString(),
          messageState: 0,
        };

        const tx = await sendSignedCancelOpenQuote(cancel, token);
        console.log(tx);
      }
    }
  } catch (error) {
    console.error('Error fetching and enqueueing signed close quotes:', error);
  }
}
