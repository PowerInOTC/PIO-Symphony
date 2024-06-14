// cancelAllOpenQuotes.test.ts
import { cancelAllOpenQuotes } from './bot.24';
import { getToken } from '../../utils/init';

describe('cancelAllOpenQuotes', () => {
  let token = 'valid-token';
  let userId = 1;

  beforeEach(async () => {
    token = await getToken(userId);
  });

  it('should call cancelAllOpenQuotes function', async () => {
    await cancelAllOpenQuotes(token, userId);
  });
});
