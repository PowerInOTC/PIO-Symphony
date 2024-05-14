export interface limitOpenStorage {
  counterparty: string;
  asset: string;
  price: string;
  amount: string;
  islong: boolean;
  hash: string;
}

// 1 Loop
// 2 Get price
// 3 islong ? price <= livePrice : price >= livePrice
// 4 CheckRFQ
// inventory
// 5
//const fill: SignedFillOpenQuoteRequest = await signOpenCheck(quote);
//sendSignedFillOpenQuote(fill, token);
