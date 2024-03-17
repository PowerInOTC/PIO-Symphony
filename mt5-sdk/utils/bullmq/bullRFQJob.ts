import { getPairTradingConfig } from '../config/config';
import { RfqReq, RfqResp, QuoteReq } from '@pionerfriends/api-client';

const input = {
  "id": "669980b0-7443-4733-b47f-c70b2c76cf58",
  "chainId": 80001,
  "createdAt": 1710584305,
  "userId": "11831922-702c-4280-80ed-6cb8f11b2386",
  "expiration": 315360000,
  "AssetAId": "crypto.BTC",
  "AssetBId": "crypto.ETH",
  "sPrice": "99.990000000000000000",
  "sQuantity": "99.990000000000000000",
  "sInterestRate": "9.9900",
  "sIsPayingApr": true,
  "sImA": "9.990000000000000000",
  "sImB": "9.990000000000000000",
  "sDfA": "9.990000000000000000",
  "sDfB": "9.990000000000000000",
  "sExpirationA": 3600,
  "sExpirationB": 3600,
  "sTimelockA": 3600,
  "sTimelockB": 3600,
  "lPrice": "99.990000000000000000",
  "lQuantity": "99.990000000000000000",
  "lInterestRate": "9.9900",
  "lIsPayingApr": true,
  "lImA": "9.990000000000000000",
  "lImB": "9.990000000000000000",
  "lDfA": "9.990000000000000000",
  "lDfB": "9.990000000000000000",
  "lExpirationA": 3600,
  "lExpirationB": 3600,
  "lTimelockA": 3600,
  "lTimelockB": 3600
};

type QuoteRequest = {
    chainId: number;
    rfqId: string;
    expiration: number;
    sMarketPrice: string;
    sPrice: string;
    sQuantity: string;
    lMarketPrice: string;
    lPrice: string;
    lQuantity: string;
  };

interface userAddressPreload {
  address: string;
  chainId: number;
  balance: number;
  lastUpdate: number;
}

interface bidAskPreload {
  assetId: string;
  bid: number;
  ask: number;
  qty: number;
  lastUpdate: number;
  freeHedgerMargin: number;
}

let userAddresses: userAddressPreload[] = [];
let bidAsks: bidAskPreload[] = [];

// Function to update or create userAddress if lastUpdate was < 5 seconds
async function updateUserAddress(userId: string, chainId: number, balance: number) {
  const existingUser = userAddresses.find(user => user.address === userId && user.chainId === chainId);

  if (existingUser) {
    if (Date.now() - existingUser.lastUpdate < 5000) {
      existingUser.balance = balance;
      existingUser.lastUpdate = Date.now();
    }
  } else {
    userAddresses.push({
      address: userId,
      chainId,
      balance,
      lastUpdate: Date.now()
    });
  }
}

// Function to update or create bidAsk if lastUpdate was < 2 seconds
async function updateBidAsk(assetId: string, bid: number, ask: number, qty: number) {
  const existingBidAsk = bidAsks.find(bidAsk => bidAsk.assetId === assetId);

  if (existingBidAsk) {
    if (Date.now() - existingBidAsk.lastUpdate < 2000) {
      existingBidAsk.bid = bid;
      existingBidAsk.ask = ask;
      existingBidAsk.qty = qty;
      existingBidAsk.lastUpdate = Date.now();
    }
  } else {
    bidAsks.push({
      assetId,
      bid,
      ask,
      qty,
      lastUpdate: Date.now()
    });
  }
}

// Function to get bidAsk, and update if time is superior or asset doesn't exist
async function getBidAsk(assetId: string) {
  const existingBidAsk = bidAsks.find(bidAsk => bidAsk.assetId === assetId);

  if (!existingBidAsk || Date.now() - existingBidAsk.lastUpdate > 2000) {
    // Update bidAsk data
    const { bid, ask, qty } = await fetchBidAskData(assetId);
    await updateBidAsk(assetId, bid, ask, qty);
  }

  return bidAsks.find(bidAsk => bidAsk.assetId === assetId);
}

// Function to get userBalance, and update if time is superior or user doesn't exist
async function getBalance(userId: string, chainId: number) {
  const existingUser = userAddresses.find(user => user.address === userId && user.chainId === chainId);

  if (!existingUser || Date.now() - existingUser.lastUpdate > 5000) {
    // Update userAddress data
    const balance = await fetchUserBalance(userId, chainId);
    await updateUserAddress(userId, chainId, balance);
  }

  return userAddresses.find(user => user.address === userId && user.chainId === chainId);
}

// Function to clean elements of both userAddresses and bidAsks that are 30 seconds old
function cleanOldData() {
  const currentTime = Date.now();

  userAddresses = userAddresses.filter(user => currentTime - user.lastUpdate <= 30000);
  bidAsks = bidAsks.filter(bidAsk => currentTime - bidAsk.lastUpdate <= 30000);
}

interface configParameters {
  quantity: number;
  price: number;
  interestRate: number;
  isPayingApr: boolean;
  imA: number;
  imB: number;
  dfA: number;
  dfB: number;
  expirationA: number;
  expirationB: number;
  timelock: number;
}

async function answerRFQ(rfqReq: RfqReq): Promise<RfqResp> {
  // Verify that the RFQ is not older than 10 seconds
  if (Date.now() - rfqReq.createdAt > 10000) {
    throw new Error('RFQ is too old');
  }

  // Verify and update userAddress balance if needed
  await getBalance(rfqReq.userId, rfqReq.chainId);

  // Verify and update bidAsk prices if needed
  await getBidAsk(rfqReq.AssetAId);
  await getBidAsk(rfqReq.AssetBId);

  // Get the user balance
  const userAddress = userAddresses.find(user => user.address === rfqReq.userId && user.chainId === rfqReq.chainId);
  if (!userAddress) {
    throw new Error('User address not found');
  }

  // Get the bid and ask prices
  const bidAskA = bidAsks.find(bidAsk => bidAsk.assetId === rfqReq.AssetAId);
  const bidAskB = bidAsks.find(bidAsk => bidAsk.assetId === rfqReq.AssetBId);
  if (!bidAskA || !bidAskB) {
    throw new Error('Bid/Ask prices not found');
  }

  const configParametersLong = await getPairTradingConfig(
    rfqReq.AssetAId,
    rfqReq.AssetBId,
    parseFloat(rfqReq.lQuantity),
    true,
    parseFloat(rfqReq.lPrice) * parseFloat(rfqReq.lQuantity) / (parseFloat(rfqReq.lImB || '0') + parseFloat(rfqReq.lDfB || '0'))
  );

  const configParametersShort = await getPairTradingConfig(
    rfqReq.AssetAId,
    rfqReq.AssetBId,
    parseFloat(rfqReq.sQuantity),
    false,
    parseFloat(rfqReq.sPrice) * parseFloat(rfqReq.sQuantity) / (parseFloat(rfqReq.sImA || '0') + parseFloat(rfqReq.sDfA || '0'))
  );

  // Verify that the user has enough balance
  if ((userAddress.balance || 0) < ((configParametersLong.imB || 0) + (configParametersLong.dfB || 0))) {
    throw new Error('Insufficient user balance');
  }

  const rfqResp: RfqResp = {
    id: rfqReq.id,
    chainId: rfqReq.chainId,
    createdAt: Date.now(),
    userId: rfqReq.userId,
    expiration: 10000,
    AssetAId: rfqReq.AssetAId,
    AssetBId: rfqReq.AssetBId,
    sPrice: (bidAskA.bid / bidAskB.ask).toString(),
    sQuantity: configParametersShort.quantity.toString(),
    sInterestRate: configParametersShort.interestRate.toString(),
    sIsPayingApr: configParametersShort.isPayingApr,
    sImA: configParametersShort.imA.toString(),
    sImB: configParametersShort.imB.toString(),
    sDfA: configParametersShort.dfA.toString(),
    sDfB: configParametersShort.dfB.toString(),
    sExpirationA: configParametersShort.expirationA,
    sExpirationB: configParametersShort.expirationB,
    sTimelockA: configParametersShort.timelock,
    sTimelockB: configParametersShort.timelock,
    lPrice: (bidAskA.ask / bidAskB.bid).toString(),
    lQuantity: configParametersLong.quantity.toString(),
    lInterestRate: configParametersLong.interestRate.toString(),
    lIsPayingApr: configParametersLong.isPayingApr,
    lImA: configParametersLong.imA.toString(),
    lImB: configParametersLong.imB.toString(),
    lDfA: configParametersLong.dfA.toString(),
    lDfB: configParametersLong.dfB.toString(),
    lExpirationA: configParametersLong.expirationA,
    lExpirationB: configParametersLong.expirationB,
    lTimelockA: configParametersLong.timelock,
    lTimelockB: configParametersLong.timelock,
  };


const quoteRequest: QuoteRequest = {
    chainId: rfqReq.chainId,
    rfqId: rfqReq.id,
    expiration: 10000,
    sMarketPrice: (bidAskA.bid / bidAskB.ask).toString(),
    sPrice: (bidAskA.bid / bidAskB.ask).toString(),
    sQuantity: rfqReq.sQuantity,
    lMarketPrice: (bidAskA.ask / bidAskB.bid).toString(),
    lPrice: (bidAskA.ask / bidAskB.bid).toString(),
    lQuantity: rfqReq.lQuantity
}   



  return quoteRequest;
}

// Helper functions (replace with actual implementations)
async function fetchBidAskData(assetId: string): Promise<{ bid: number; ask: number; qty: number }> {
  // Placeholder implementation
  return { bid: 100, ask: 101, qty: 1000, freeHedgerMargin: 1000 };
}

async function fetchUserBalance(userId: string, chainId: number): Promise<number> {
  // Placeholder implementation
  return 1000;
}

export { answerRFQ };