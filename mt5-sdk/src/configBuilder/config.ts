import Notional from './configBuilder';

async function getConfig(
  assetAId: string,
  assetBId: string,
  quantity: number,
  side: boolean,
  leverage: number,
): Promise<Notional> {
  const config: Notional = {
    side: 'long',
    leverage: 100,
    maxNotional: 0,
    minAmount: 0,
    maxAmount: 0,
    maxLeverageDeltaGlobalNotional: 0,
    maxLeverageLongGlobalNotional: 0,
    maxLeverageShortGlobalNotional: 0,
    imA: 0,
    imB: 0,
    dfA: 0,
    dfB: 0,
    ir: 0,
    expiryA: 0,
    expiryB: 0,
    timeLockA: 0,
    timeLockB: 0,
    maxConfidence: 0,
    maxDelay: 0,
    forceCloseType: 0,
    kycType: 0,
    cType: 0,
    kycAddress: '',
    type: 'string',
    brokerMinimalNotional: 0,
    brokerFee: 0,
  };
  return config;
}

export default getConfig;
