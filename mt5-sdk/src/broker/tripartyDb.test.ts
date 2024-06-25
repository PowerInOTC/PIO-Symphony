import {
  getPositions,
  PositionResponse,
  getSignedCloseQuotes,
  getSignedWrappedOpenQuotes,
} from '@pionerfriends/api-client';
import { config } from '../config';
import { getToken } from '../utils/init';

describe('fetchPositions', () => {
  it('should fetch positions and print the function', async () => {
    const token = await getToken(config.hedgerId); // Replace with a real token

    const activeOpenQuotes = await getSignedWrappedOpenQuotes(
      '1.0',
      Number(config.activeChainId),
      token,
      {
        onlyActive: true,
        targetAddress: config.publicKeys?.split(',')[0],
      },
    );

    const openQuotes = await getSignedWrappedOpenQuotes(
      '1.0',
      Number(config.activeChainId),
      token,
      {},
    );

    const activeCloseQuotes = await getSignedCloseQuotes(
      '1.0',
      Number(config.activeChainId),
      token,
      {
        onlyActive: true,
        targetAddress: config.publicKeys?.split(',')[0],
      },
    );

    const closeQuotes = await getSignedCloseQuotes(
      '1.0',
      Number(config.activeChainId),
      token,
      {},
    );

    const activePositions = await getPositions(
      Number(config.activeChainId),
      token,
      {
        onlyActive: true,
        address: config.publicKeys?.split(',')[config.hedgerId],
      },
    );

    const positions = await getPositions(
      Number(config.activeChainId),
      token,
      {},
    );

    console.log('activeOpenQuotes', activeOpenQuotes?.data);
    console.log('activeCloseQuotes', activeCloseQuotes?.data);
    console.log('activePositions', activePositions?.data);

    console.log('openQuotes', openQuotes?.data);
    console.log('closeQuotes', closeQuotes?.data);
    console.log('positions', positions?.data);
  }, 30000); // Increased timeout to allow for the API call
});
