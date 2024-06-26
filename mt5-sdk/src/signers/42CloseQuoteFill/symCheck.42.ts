import {
  signedCloseQuoteResponse,
  PionerWebsocketClient,
  WebSocketType,
  getSignedCloseQuotes,
} from '@pionerfriends/api-client';
import { Hedger } from '../../broker/inventory';
import { extractSymbolFromAssetHex } from '../../utils/ethersUtils';
import {
  networks,
  NetworkKey,
  BContract,
} from '@pionerfriends/blockchain-client';
import { getTripartyLatestPrice } from '../../broker/tripartyPrice';
import { closeQuoteSignValueType } from '../../blockchain/types';
import { minAmountSymbol } from '../../broker/minAmount';
import { formatUnits, parseUnits } from 'viem';

export async function signCloseCheck(close: signedCloseQuoteResponse) {
  let isCheck = true;
  const hedger = new Hedger();

  const symbol = extractSymbolFromAssetHex(close.assetHex);
  const pair = `${symbol.assetAId}/${symbol.assetBId}`;
  const tripartyLatestPrice = await getTripartyLatestPrice(
    `${symbol.assetAId}/${symbol.assetBId}`,
  );
  /** Test price + spread is profitable for hedger  */
  if (close.isLong) {
    if (Number(tripartyLatestPrice.ask) <= Number(close.price) * (1 + 0.0001)) {
      isCheck = false;
      throw new Error('close price is too low');
    }
  }
  if (!close.isLong) {
    if (Number(tripartyLatestPrice.bid) >= Number(close.price) * (1 - 0.0001)) {
      isCheck = false;
      throw new Error('close price is too high');
    }
  }

  /** Test partial close is bigger than min amount */
  const minAmount = await minAmountSymbol(pair);
  if (Number(close.amount) < Number(minAmount)) {
    isCheck = false;
    throw new Error(
      `Close amount is too low : ${Number(close.amount)} / ${Number(minAmount)}`,
    );
  }

  if (isCheck) {
    isCheck = await hedger.hedge(
      pair,
      Number(close.price),
      close.signatureOpenQuote,
      Number(parseFloat(formatUnits(parseUnits(close.amount, 0), 18))),
      close.isLong,
      false,
      close.issuerAddress,
    );
  }

  if (isCheck === false) {
    //throw new Error('hedger failed');
  }

  return isCheck;
}
