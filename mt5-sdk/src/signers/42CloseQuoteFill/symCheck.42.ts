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
  console.log(`signCloseCheck : ${JSON.stringify(close)}`);
  let isCheck = true;
  const hedger = new Hedger();
  const closeTemp = JSON.parse(JSON.stringify(close));

  closeTemp.price = formatUnits(parseUnits(closeTemp.price, 0), 18);
  closeTemp.limitOrStop = formatUnits(parseUnits(closeTemp.limitOrStop, 0), 18);
  closeTemp.amount = formatUnits(parseUnits(closeTemp.amount, 0), 18);
  //check stop price > limitPrice for long
  const isZeroLimitOrStop = Number(closeTemp.limitOrStop) === 0;
  isCheck =
    !isZeroLimitOrStop &&
    closeTemp.price <= closeTemp.limitOrStop &&
    closeTemp.isLong
      ? false
      : true;
  //check stop price < limitPrice for long

  isCheck =
    !isZeroLimitOrStop &&
    closeTemp.price >= closeTemp.limitOrStop &&
    closeTemp.isLong
      ? false
      : true;

  const symbol = extractSymbolFromAssetHex(closeTemp.assetHex);
  const pair = `${symbol.assetAId}/${symbol.assetBId}`;
  const tripartyLatestPrice = await getTripartyLatestPrice(
    `${symbol.assetAId}/${symbol.assetBId}`,
  );
  /** Test price + spread is profitable for hedger  */
  if (closeTemp.isLong) {
    if (
      closeTemp.limitOrStop !== '0' &&
      Number(tripartyLatestPrice.bid) >= Number(closeTemp.limitOrStop)
    ) {
      if (
        Number(tripartyLatestPrice.bid) >=
        Number(closeTemp.price) * (1 - 0.0001)
      ) {
        isCheck = false;
        console.log(
          `close price is too low : ${Number(tripartyLatestPrice.ask)} / ${Number(closeTemp.price)}`,
        );
      }
    } else {
      if (
        Number(tripartyLatestPrice.bid) >=
        Number(closeTemp.price) * (1 - 0.0001)
      ) {
        isCheck = false;
        console.log(
          `close price is too low : ${Number(tripartyLatestPrice.ask)} / ${Number(closeTemp.price)}`,
        );
      }
    }
  } else {
    if (
      closeTemp.limitOrStop !== '0' &&
      Number(tripartyLatestPrice.ask) <= Number(closeTemp.limitOrStop)
    ) {
      if (
        Number(tripartyLatestPrice.ask) <=
        Number(closeTemp.price) * (1 + 0.0001)
      ) {
        isCheck = false;
        console.log(
          `close price is too low : ${Number(tripartyLatestPrice.ask)} / ${Number(closeTemp.price)}`,
        );
      }
    } else {
      if (
        Number(tripartyLatestPrice.ask) <=
        Number(closeTemp.price) * (1 + 0.0001)
      ) {
        isCheck = false;
        console.log(
          `close price is too high : ${Number(tripartyLatestPrice.bid)} / ${Number(closeTemp.price)}`,
        );
      }
    }
  }

  /** Test partial close is bigger than min amount */
  const minAmount = await minAmountSymbol(pair);
  if (Number(closeTemp.amount) < Number(minAmount)) {
    isCheck = false;
    console.log(
      `Close amount is too low : ${Number(closeTemp.amount)} / ${Number(minAmount)}`,
    );
  }
  console.log(`2 ${isCheck}`);

  if (isCheck) {
    hedger.hedge(
      pair,
      Number(closeTemp.price),
      closeTemp.signatureOpenQuote,
      Number(parseFloat(formatUnits(parseUnits(closeTemp.amount, 0), 18))),
      closeTemp.isLong,
      false,
      closeTemp.issuerAddress,
    );
  }

  if (!isCheck) {
    return isCheck;
  }

  const closeQuoteSignValueType: closeQuoteSignValueType = {
    bContractId: close.bcontractId.toString(),
    price: close.amount,
    amount: close.amount,
    limitOrStop: close.amount,
    expiry: close.expiry.toString(),
    authorized: close.authorized,
    nonce: close.nonce,
  };
  console.log(
    `closeQuoteSignValueType : ${JSON.stringify(closeQuoteSignValueType)}`,
  );

  const tx = await settleClose(
    closeQuoteSignValueType,
    close.signatureClose,
    0,
    String(close.chainId),
  );

  console.log(`Close Quote tx : ${tx}`);

  return isCheck;
}
