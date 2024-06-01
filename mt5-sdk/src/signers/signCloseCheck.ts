import {
  signedCloseQuoteResponse,
  PionerWebsocketClient,
  WebSocketType,
  getSignedCloseQuotes,
} from '@pionerfriends/api-client';
import { hedger } from '../broker/inventory';
import { extractSymbolFromAssetHex } from '../utils/ethersUtils';
import {
  networks,
  NetworkKey,
  BContract,
} from '@pionerfriends/blockchain-client';
import { getTripartyLatestPrice } from '../broker/tripartyPrice';
import { getbContract } from '../blockchain/read';
import { closeQuoteSignValueType } from '../blockchain/types';

export function signCloseCheck(close: signedCloseQuoteResponse) {
  let isFilled = true;

  const symbol = extractSymbolFromAssetHex(open.assetHex);

  let isCheck = true;
  if (close.isLong) {
    if (tripartyLatestPrice.ask <= Number(close.price) * (1 + 0.0001)) {
      isCheck = false;
    }
  }
  if (!close.isLong) {
    if (tripartyLatestPrice.bid >= Number(close.price) * (1 - 0.0001)) {
      isCheck = false;
    }
  }

  const isPassed = await hedger(
    `${symbol.assetAId}/${symbol.assetAId}`,
    Number(open.price),
    close.signatureOpenQuote,
    close.amount,
    close.isLong,
    false,
  );

  return isFilled;
}
