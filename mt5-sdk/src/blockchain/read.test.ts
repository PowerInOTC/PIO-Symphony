import { getbOracle, getBContract } from './read'; // Replace with the actual path
import { settle } from './write'; // Replace with the actual path
import { config } from '../config';

describe('getbOracle', () => {
  it('should return a BOracle object', async () => {
    const bOracleId = '1';
    const accountId = 0;
    const chainId = config.activeChainId;
    console.log('bOracleId', bOracleId);

    await getbOracle(bOracleId, chainId);
    await getBContract(bOracleId, chainId);
    const tx = await settle(bOracleId, accountId, chainId);
    console.log('tx', tx);

    //expect(result).toBeDefined();
  });
});
