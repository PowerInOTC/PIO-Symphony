import { RfqRequest } from '@pionerfriends/api-client';
import dotenv from 'dotenv';
import { getMT5LatestPrice } from './broker/mt5Price';
import { getTripartyLatestPrice } from './broker/tripartyPrice';
import { getBrokerMaxNotional } from './broker/brokerMaxNotional';
import { getTotalOpenAmount } from './broker/totalOpenAmountModule';
import { minAmountSymbol } from './broker/minAmount';
import {
  manageSymbolInventory,
  totalOpenAmountInfo,
  verifyTradeOpenable,
} from './broker/dispatcher';
import { hedger } from './broker/inventory';
import {
  adjustQuantities,
  getPairConfig,
  getProxyTicker,
  getBrokerFromAsset,
} from './config/configRead';
import { getToken } from './utils/init';
import { wallets } from './utils/init';
import { config } from './config';
import { getOpenPositions, Position } from './broker/dispatcher';
import { suggestNearestAmount, isAmountOk } from './broker/utils';
import { testWebSocketQuote } from './signers/12rfqFill/sym.12.test';

async function bullExample(): Promise<void> {
  testWebSocketQuote();

  /*
  const token = await getToken(0);

  const chainId = 64165;
  const assetAId = 'forex.EURUSD';
  const assetBId = 'stock.nasdaq.AAPL';
  const Leverage = 100;
  let bid = 0;
  let ask = 0;
  let sQuantity = 100;
  let lQuantity = 101;
  const assetHex = `${assetAId}/${assetBId}`;

  const pairPrices = await getTripartyLatestPrice(assetHex);
  bid = pairPrices.bid;
  ask = pairPrices.ask;

  const adjustedQuantities = await adjustQuantities(
    bid,
    ask,
    sQuantity,
    lQuantity,
    assetAId,
    assetBId,
    Leverage,
  );
  sQuantity = adjustedQuantities.sQuantity;
  lQuantity = adjustedQuantities.lQuantity;

  const lConfig = await getPairConfig(
    assetAId,
    assetBId,
    'long',
    Leverage,
    ask * lQuantity,
  );
  const sConfig = await getPairConfig(
    assetAId,
    assetBId,
    'long',
    Leverage,
    ask * lQuantity,
  );
  let lInterestRate = lConfig.funding;
  let sInterestRate = sConfig.funding;

  const rfq: RfqRequest = {
    chainId: chainId,
    expiration: String(10000),
    assetAId: assetAId,
    assetBId: assetBId,
    sPrice: String(bid),
    sQuantity: String(sQuantity),
    sInterestRate: String(sInterestRate),
    sIsPayingApr: true,
    sImA: String(sConfig.imA),
    sImB: String(sConfig.imA),
    sDfA: String(sConfig.imA),
    sDfB: String(sConfig.imA),
    sExpirationA: String(3600),
    sExpirationB: String(3600),
    sTimelockA: String(3600),
    sTimelockB: String(3600),
    lPrice: String(ask),
    lQuantity: String(lQuantity),
    lInterestRate: String(lInterestRate),
    lIsPayingApr: true,
    lImA: String(lConfig.imA),
    lImB: String(lConfig.imB),
    lDfA: String(lConfig.dfA),
    lDfB: String(lConfig.dfB),
    lExpirationA: String(3600),
    lExpirationB: String(3600),
    lTimelockA: String(3600),
    lTimelockB: String(3600),
  };

  try {
    let counter = 1;
    const amount = 1000;
    const assetAId = 'forex.GBPUSD';
    const assetBId = 'forex.EURUSD';
    const pair = `${assetAId}/${assetBId}`;
    const isLong = true;

    const minAmount = await minAmountSymbol(pair);
    if (!isAmountOk(amount, minAmount)) {
      console.log(suggestNearestAmount(amount, minAmount));
      throw new Error('Amount is not ok');
    }
    console.log(`minAmount ${minAmount}`);

    function getFirst24Characters(hexString: string): string {
      return hexString.slice(0, 24);
    }
    const hexString = `0x81ecwaf5bca8e50573e0183wad582d6b6426bd988c9c7fd40c529bea86232136c8`;

    const isPassed1 = await hedger(
      pair,
      0.5,
      hexString,
      amount, // TODO /1e18
      isLong,
      true,
    );

    console.log(`1 : ${isPassed1}`);
    //await new Promise((resolve) => setTimeout(resolve, 5000));

    const position = await getOpenPositions('mt5.ICMarkets');
    console.log(position);

    const isPassed12 = await hedger(
      pair,
      0.5,
      hexString,
      amount, // TODO /1e18
      isLong,
      false,
    );
    console.log(`1 : ${isPassed12}`);

    const position2 = await getOpenPositions('mt5.ICMarkets');
    console.log(position2);

    /*
    const pair = 'forex.GBPUSD/forex.EURUSD';
    const [pair1, pair2] = pair.split('/');
    const broker1 = getBrokerFromAsset(pair1);
    const broker2 = getBrokerFromAsset(pair2);
    if (broker1 != broker2 && broker1 != 'mt5.ICMarkets') {
      console.error;
    }

    const price = await getTripartyLatestPrice(pair);
    console.log(price);
    const minAmount = await minAmountSymbol(pair);
    const MaxNotional = await getBrokerMaxNotional(pair1);
    const totalOpenAmount1 = await getTotalOpenAmount(pair1);
    const totalOpenAmount2 = await getTotalOpenAmount(pair2);
    console.log(totalOpenAmount1, totalOpenAmount2, MaxNotional, minAmount);

    /*
    /*
 const pair = 'forex.EURUSD/forex.GBPUSD';
    const price = 0.858;
    const bContractId = 0;
    const amount = 1000;
    const isLong = true;
    const isOpen = false;
      const isPassed = await hedger(
        pair,
        price,
        bContractId,
        amount,
        isLong,
        isOpen,
      );

    setInterval(async () => {
      /*
      sendRfq(rfq, token);
      counter++;
    }, 7000);
  } catch (error: any) {
    if (error instanceof Error) {
      console.error(error);
    } else {
      console.error('An unknown error occurred');
    }
  }*/
}

bullExample();
