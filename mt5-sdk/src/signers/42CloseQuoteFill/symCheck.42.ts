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
import { settleClose } from '../../blockchain/write';

export async function signCloseCheck(close: signedCloseQuoteResponse) {
  let isCheck = true;
  const hedger = new Hedger();
  close.price = formatUnits(parseUnits(close.price, 0), 18);
  close.limitOrStop = formatUnits(parseUnits(close.limitOrStop, 0), 18);
  close.amount = formatUnits(parseUnits(close.amount, 0), 18);
  //check stop price > limitPrice for long
  isCheck =
    close.limitOrStop !== '0' &&
    close.price <= close.limitOrStop &&
    close.isLong
      ? true
      : false;
  //check stop price < limitPrice for long
  isCheck =
    close.limitOrStop !== '0' &&
    close.price >= close.limitOrStop &&
    close.isLong
      ? true
      : false;

  const symbol = extractSymbolFromAssetHex(close.assetHex);
  console.log(`symbol : ${symbol.assetAId}/${symbol.assetBId}`);
  const pair = `${symbol.assetAId}/${symbol.assetBId}`;
  const tripartyLatestPrice = await getTripartyLatestPrice(
    `${symbol.assetAId}/${symbol.assetBId}`,
  );
  /** Test price + spread is profitable for hedger  */
  console.log(
    `tripartyLatestPrice : ${tripartyLatestPrice.bid} / ${tripartyLatestPrice.ask}`,
    `close price : ${close.price}`,
    `close isLong : ${close.isLong}`,
    `close amount : ${close.amount}`,
    `close amount : ${close.limitOrStop}`,
    `close signatureOpenQuote : ${close.signatureOpenQuote}`,
    `close signatureOpenQuoteHash : ${close.signatureOpenQuoteHash}`,
    `close close.assetHex : ${close.assetHex}`,
  );

  if (close.isLong) {
    if (
      close.limitOrStop !== '0' &&
      Number(tripartyLatestPrice.bid) >= Number(close.limitOrStop)
    ) {
      if (
        Number(tripartyLatestPrice.bid) >=
        Number(close.price) * (1 - 0.0001)
      ) {
        isCheck = false;
        console.log(
          `close price is too low : ${Number(tripartyLatestPrice.ask)} / ${Number(close.price)}`,
        );
      }
    } else {
      if (
        Number(tripartyLatestPrice.bid) >=
        Number(close.price) * (1 - 0.0001)
      ) {
        isCheck = false;
        console.log(
          `close price is too low : ${Number(tripartyLatestPrice.ask)} / ${Number(close.price)}`,
        );
      }
    }
  } else {
    if (
      close.limitOrStop !== '0' &&
      Number(tripartyLatestPrice.ask) <= Number(close.limitOrStop)
    ) {
      if (
        Number(tripartyLatestPrice.ask) <=
        Number(close.price) * (1 + 0.0001)
      ) {
        isCheck = false;
        console.log(
          `close price is too low : ${Number(tripartyLatestPrice.ask)} / ${Number(close.price)}`,
        );
      }
    } else {
      if (
        Number(tripartyLatestPrice.ask) <=
        Number(close.price) * (1 + 0.0001)
      ) {
        isCheck = false;
        console.log(
          `close price is too high : ${Number(tripartyLatestPrice.bid)} / ${Number(close.price)}`,
        );
      }
    }
  }

  /** Test partial close is bigger than min amount */
  const minAmount = await minAmountSymbol(pair);
  if (Number(close.amount) < Number(minAmount)) {
    isCheck = false;
    console.log(
      `Close amount is too low : ${Number(close.amount)} / ${Number(minAmount)}`,
    );
  }

  if (isCheck) {
    hedger.hedge(
      pair,
      Number(close.price),
      close.signatureOpenQuote,
      Number(parseFloat(formatUnits(parseUnits(close.amount, 0), 18))),
      close.isLong,
      false,
      close.issuerAddress,
    );
  }

  if (!isCheck) {
    return isCheck;
  }

  const closeQuoteSignValueType: closeQuoteSignValueType = {
    bContractId: close.chainId.toString(),
    price: close.price,
    amount: close.amount,
    limitOrStop: close.limitOrStop.toString(),
    expiry: close.expiry.toString(),
    authorized: close.authorized,
    nonce: close.nonce,
  };

  const tx = await settleClose(
    closeQuoteSignValueType,
    close.signatureClose,
    0,
    String(close.chainId),
  );

  console.log(`Close Quote tx : ${tx}`);

  return isCheck;
}
