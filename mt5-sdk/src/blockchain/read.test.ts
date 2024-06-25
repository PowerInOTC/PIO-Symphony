import { getbOracle, getBContract } from './read'; // Replace with the actual path
import { config } from '../config';

describe('getbOracle', () => {
  it('should return a BOracle object', async () => {
    const bOracleId = '0';
    const chainId = config.activeChainId;
    console.log('bOracleId', bOracleId);

    await getbOracle(bOracleId, chainId);
    await getBContract(bOracleId, chainId);

    //expect(result).toBeDefined();
  });
});
