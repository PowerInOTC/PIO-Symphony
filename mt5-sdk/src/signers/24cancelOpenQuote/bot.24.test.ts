// cancelAllOpenQuotes.test.ts
import {
  getSignedCloseQuotes,
  sendSignedCancelOpenQuote,
} from '@pionerfriends/api-client';
import { cancelAllOpenQuotes } from './bot.24';
import { getToken } from '../../utils/init';

jest.mock('@pionerfriends/api-client');

describe('cancelAllOpenQuotes', () => {
  let token = 'valid-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch signed close quotes successfully', async () => {
    token = await getToken(1);

    (getSignedCloseQuotes as jest.Mock).mockResolvedValue({ data: [] });

    await cancelAllOpenQuotes(token);

    expect(getSignedCloseQuotes).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Number),
      token,
      expect.any(Object),
    );
  });
});
