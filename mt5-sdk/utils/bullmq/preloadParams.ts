interface userAddress{
    address: string;
    chainId: number;
    balance: number;
    lastUpdate: number;
  
  }
  
  interface bidAsk {
    assetId: string;
    bid: number;
    ask: number;
    time: number;
  }
  
  const userAddresses: userAddress[] = []
  const bidAsks: bidAsk[] = [];
  
  // make function to update on function call userAddress if lastUpdate was < 5 second
  // make function to update on function call userAddress if bid ask was < 2 second
  // make function that clean elements of both that are 30 seconds old on call.