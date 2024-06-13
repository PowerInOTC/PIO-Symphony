interface Row extends NotionalKey {
  maxNotional?: number;
  minAmount?: number;
  maxAmount?: number;
  precision?: number;
  maxLeverageDeltaGlobalNotional?: number;
  maxLeverageLongGlobalNotional?: number;
  maxLeverageShortGlobalNotional?: number;
  imA?: number;
  imB?: number;
  dfA?: number;
  dfB?: number;
  ir?: number;
  expiryA?: number;
  expiryB?: number;
  timeLockA?: number;
  timeLockB?: number;
  maxConfidence?: number;
  maxDelay?: number;
  forceCloseType?: number;
  kycType?: number;
  cType?: number;
  kycAddress?: string;
  type?: string;
  brokerMinimalNotional?: number;
  brokerFee?: number;
  funding?: number;
  isAPayingApr?: boolean;
}

interface Asset {
  mt5Ticker: string;
  proxyTicker: string;
  broker: string;
  fmpTicker?: string;
  tiingoTicker?: string;
  alpacaTicker?: string;
  tradingViewId?: string;
  precision?: number;
  notional?: Row[];
}

interface NotionalKey {
  side: string;
  leverage: number;
}

export { Asset, NotionalKey, Row };
