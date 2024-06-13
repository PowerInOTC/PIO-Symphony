import { config } from '../../config';
import {
  signedCloseQuoteResponse,
  getSignedCloseQuotes,
  SignedCancelOpenQuoteRequest,
  signedCancelOpenQuoteResponse,
  sendSignedCancelOpenQuote,
} from '@pionerfriends/api-client';
import { ethers } from 'ethers';
import { networks, NetworkKey } from '@pionerfriends/blockchain-client';

const addr1 = new ethers.Wallet(config.privateKeys?.split(',')[0]);

export async function cancelAllOpenQuotes(token: string): Promise<void> {
  try {
    const response = await getSignedCloseQuotes('1.0', 64165, token, {
      onlyActive: true,
      targetAddress: config.publicKeys?.split(',')[0],
    });
    const quotes: signedCloseQuoteResponse[] | undefined = response?.data;

    if (quotes) {
      for (const quote of quotes) {
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
          nonce: 0,
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
          nonceCancel: Date.now().toString(),
          signatureCancel: signatureCancel,
          emitTime: Date.now().toString(),
          messageState: quote.messageState,
        };

        const tx = await sendSignedCancelOpenQuote(cancel, token);
      }
    }
  } catch (error) {
    console.error('Error fetching and enqueueing signed close quotes:', error);
  }
}
