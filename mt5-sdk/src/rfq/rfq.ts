import { RfqResponse, QuoteRequest } from '@pionerfriends/api-client';
import RfqChecker, { ErrorObject } from './RfqChecker';
import { getTripartyLatestPrice } from '../broker/tripartyPrice';
import { minAmountSymbol } from '../broker/minAmount';

const rfqToQuote = async (rfq: RfqResponse): Promise<QuoteRequest> => {
  //console.log(rfq);
  const checker = new RfqChecker(rfq);
  checker
    .check()
    .then((errors: ErrorObject[]) => {
      if (errors.length === 0) {
      } else {
        console.log('RFQ failed the following checks:');
        errors.forEach((error) => {
          console.log(`Field: ${error.field}, Value: ${error.value}`);
        });
      }
    })
    .catch((error) => {
      console.error('An error occurred during RFQ checking:', error);
    });

  const tripartyLatestPrice = await getTripartyLatestPrice(
    `${rfq.assetAId}/${rfq.assetBId}`,
  );
  //console.log(`${checkRFQ.assetAId}/${checkRFQ.assetBId}`, tripartyLatestPrice);

  const minAmount = await minAmountSymbol(`${rfq.assetAId}/${rfq.assetBId}`);

  return {
    chainId: rfq.chainId,
    rfqId: rfq.id,
    expiration: rfq.expiration,
    sMarketPrice: (Number(tripartyLatestPrice.bid) * 1.001).toString(),
    sPrice: rfq.sPrice,
    sQuantity: String(rfq.sQuantity),
    lMarketPrice: (Number(tripartyLatestPrice.ask) * 0.999).toString(),
    lPrice: rfq.lPrice,
    lQuantity: String(rfq.lQuantity),
    minAmount: Math.floor(
      minAmount / Math.min(Number(rfq.sPrice), Number(rfq.lPrice)),
    ).toString(),
    maxAmount: Math.floor(
      10000 / Math.min(Number(rfq.sPrice), Number(rfq.lPrice)),
    ).toString(),
  };
};

export { rfqToQuote };
