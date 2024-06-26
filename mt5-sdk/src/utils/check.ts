import { config } from '../config';
import { getToken } from '../utils/init';
import { getMarketStatus } from '../broker/marketStatus';
import noHedgeList from '../broker/noHedgeList.json';

export function isValidInterestRate(
  config: any,
  rate: string,
  isPayingApr: boolean,
  isLong: boolean,
): boolean {
  if (isLong) {
    if (isPayingApr && config.isBPayingApr) {
      return (config.funding ?? 0) <= Number(rate);
    } else if (!isPayingApr && config.isAPayingApr) {
      return false;
    } else if (isPayingApr && !config.isAPayingApr) {
      return true;
    } else if (!isPayingApr && !config.isAPayingApr) {
      return (config.funding ?? 0) >= Number(rate);
    }
  } else {
    if (isPayingApr && config.isBPayingApr) {
      return (config.funding ?? 0) >= Number(rate);
    } else if (!isPayingApr && config.isAPayingApr) {
      return true;
    } else if (isPayingApr && !config.isAPayingApr) {
      return false;
    } else if (!isPayingApr && !config.isAPayingApr) {
      return (config.funding ?? 0) <= Number(rate);
    }
  }
  return false;
}

export async function isMarketOpen(pair: string) {
  const token = await getToken(config.hedgerId);
  if (!token) {
    return false;
  }

  if (config.isDevMode) {
    return true;
  }

  return await getMarketStatus(token, pair);
}

export async function isNoHedgeAddress(address: string): Promise<boolean> {
  return noHedgeList.includes(address);
}
