import {
  getPayloadAndLogin,
  getPayload,
  login,
  extendToken,
} from '@pionerfriends/api-client';
import { config } from '../config';
import { createClient, RedisClientType } from 'redis';
import { Queue } from 'bullmq';
import { privateKeyToAccount, PrivateKeyAccount } from 'viem/accounts';
import {
  defineChain,
  Address,
  createPublicClient,
  PublicClient,
  Chain,
  createWalletClient,
  WalletClient,
  http,
} from 'viem';
import { avalancheFuji } from 'viem/chains';

const client: RedisClientType = createClient({
  socket: {
    host: config.bullmqRedisHost,
    port: config.bullmqRedisPort,
  },
  password: config.bullmqRedisPassword,
});

const fantomSonicTestnet: Chain = defineChain({
  id: 64165,
  name: 'Fantom Sonic Testnet',
  network: 'fantom-sonic-testnet',
  nativeCurrency: {
    name: 'Fantom',
    symbol: 'FTM',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.sonic.fantom.network/'] },
    public: { http: ['https://rpc.sonic.fantom.network/'] },
  },
});

const chains: { [key: number]: Chain } = {
  64165: fantomSonicTestnet,
  64156: avalancheFuji,
};
const chainName = { 64165: 'sonic', 64156: 'fuji' };
const chainHex = { 64165: 'sonic', 64156: 'fuji' };

// Initialize the accounts and wallets objects
const accounts: {
  [chainId: number]: { [address: string]: PrivateKeyAccount };
} = {};
const wallets: { [chainId: number]: { [address: string]: WalletClient } } = {};

// Populate the accounts and wallets objects
for (const chainId in chains) {
  const numericChainId = Number(chainId);
  accounts[numericChainId] = {};
  wallets[numericChainId] = {};

  config.privateKeys?.split(',').forEach((key) => {
    const account = privateKeyToAccount(key as Address);
    accounts[numericChainId][account.address] = account;
    wallets[numericChainId][account.address] = createWalletClient({
      account,
      chain: chains[numericChainId],
      transport: http(),
    });
  });
}

const web3Clients: { [chainId: number]: PublicClient } = {};

// Create public clients for each chain
for (const chainId in chains) {
  const numericChainId = Number(chainId);
  web3Clients[numericChainId] = createPublicClient({
    chain: chains[numericChainId],
    transport: http(),
  });
}
let token = '';

async function getToken(maxRetries = 3, retryDelay = 1000): Promise<string> {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const cachedToken = await client.get('token');
      if (cachedToken) {
        return cachedToken;
      }

      const newToken = await fetchNewToken();
      await client.set('token', newToken);
      return newToken;
    } catch (error: unknown) {
      if (error instanceof Error && (error as any).code === 'ECONNRESET') {
        retries++;
        console.error(
          `ECONNRESET error occurred (attempt ${retries}). Retrying...`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Failed to get token after maximum retries');
}

async function fetchNewToken(): Promise<string> {
  const chainId = 64156;
  const address = Object.keys(accounts[chainId])[0];
  const account = accounts[chainId][address];

  const payloadResponse = await getPayload(account.address);
  if (
    !payloadResponse ||
    payloadResponse.status != 200 ||
    !payloadResponse.data.uuid ||
    !payloadResponse.data.message
  ) {
    return '';
  }
  const { uuid, message } = payloadResponse.data;
  const signedMessage = await wallets[chainId][account.address].signMessage({
    account,
    message,
  });
  const loginResponse = await login(uuid, signedMessage);

  if (
    !loginResponse ||
    loginResponse.status != 200 ||
    !loginResponse.data.token
  ) {
    return '';
  }

  const token = loginResponse.data.token;

  return token;
}

async function refreshToken() {
  try {
    const token = await redisClient.get('token');
    if (token) {
      const response = await extendToken(token);
      if (response && response.status === 200 && response.data.token) {
        await redisClient.set('token', response.data.token);
        console.log('Token refreshed successfully');
      } else {
        console.error('Failed to refresh token');
      }
    } else {
      console.error('No token found in Redis');
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
  }
}

// Run the token refresh worker once per day
setInterval(refreshToken, 24 * 60 * 60 * 1000);
export {
  chains,
  chainName,
  accounts,
  wallets,
  web3Clients,
  client as redisClient,
  fantomSonicTestnet,
  getToken,
};
