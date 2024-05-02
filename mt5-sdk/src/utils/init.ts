/*
// init
    init db with events
    PionerV1.mintTestNet(1e36):
    set MM address
    init MT5 connection
    login to API ?
    config fill 
    max leverage
    */
import {
  networks,
  FakeUSD,
  PionerV1Compliance,
} from '@pionerfriends/blockchain-client';
import { config } from '../config';
import { createClient, RedisClientType } from 'redis';
import { Queue } from 'bullmq';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { defineChain, Address, createPublicClient } from 'viem';
import { avalancheFuji } from 'viem/chains';

const client: RedisClientType = createClient({
  socket: {
    host: config.bullmqRedisHost,
    port: config.bullmqRedisPort,
  },
  password: config.bullmqRedisPassword,
});

const rfqQueue = new Queue('rfq', {
  connection: {
    host: config.bullmqRedisHost,
    port: config.bullmqRedisPort,
    password: config.bullmqRedisPassword,
  },
});

const pino = require('pino');
const pretty = require('pino-pretty');
const stream = pretty({
  colorize: true,
  colorizeObjects: true,
});
const logger = pino(stream);

const fantomSonicTestnet = defineChain({
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

const chains = { 64165: fantomSonicTestnet, 64156: avalancheFuji };
const chainName = { 64165: 'sonic', 64156: 'fuji' };
interface ChainContracts {
  [chainId: number]: string;
}

const fakeUSDContract: ChainContracts = {
  64165: networks.sonic.contracts.FakeUSD,
  64156: networks.fuji.contracts.FakeUSD,
};
const pionerV1Contract: ChainContracts = {
  64165: networks.sonic.contracts.PionerV1,
  64156: networks.fuji.contracts.PionerV1,
};
const pionerV1ComplianceContract: ChainContracts = {
  64165: networks.sonic.contracts.PionerV1Compliance,
  64156: networks.fuji.contracts.PionerV1Compliance,
};
const pionerV1OpenContract: ChainContracts = {
  64165: networks.sonic.contracts.PionerV1Open,
  64156: networks.fuji.contracts.PionerV1Open,
};
const pionerV1CloseContract: ChainContracts = {
  64165: networks.sonic.contracts.PionerV1Close,
  64156: networks.fuji.contracts.PionerV1Close,
};
const pionerV1DefaultContract: ChainContracts = {
  64165: networks.sonic.contracts.PionerV1Default,
  64156: networks.fuji.contracts.PionerV1Default,
};
const pionerV1WrapperContract: ChainContracts = {
  64165: networks.sonic.contracts.PionerV1Wrapper,
  64156: networks.fuji.contracts.PionerV1Wrapper,
};

const account = privateKeyToAccount(
  config.privateKeys?.split(',')[0] as Address,
);
const account0 = privateKeyToAccount(
  config.privateKeys?.split(',')[0] as Address,
);
const account1 = privateKeyToAccount(
  config.privateKeys?.split(',')[1] as Address,
);
const account2 = privateKeyToAccount(
  config.privateKeys?.split(',')[2] as Address,
);
const account3 = privateKeyToAccount(
  config.privateKeys?.split(',')[3] as Address,
);
const web3Client = createPublicClient({
  chain: fantomSonicTestnet,
  transport: http(),
});

const accounts = [account0, account1, account2, account3];

const wallet = createWalletClient({
  account,
  chain: fantomSonicTestnet,
  transport: http(),
});
const wallet0 = createWalletClient({
  account: config.privateKeys?.split(',')[0] as Address,
  chain: fantomSonicTestnet,
  transport: http(),
});
const wallet1 = createWalletClient({
  account: config.privateKeys?.split(',')[1] as Address,
  chain: fantomSonicTestnet,
  transport: http(),
});
const wallet2 = createWalletClient({
  account: config.privateKeys?.split(',')[2] as Address,
  chain: fantomSonicTestnet,
  transport: http(),
});
const wallet3 = createWalletClient({
  account: config.privateKeys?.split(',')[3] as Address,
  chain: fantomSonicTestnet,
  transport: http(),
});

const wallets = [wallet0, wallet1, wallet2, wallet3];

export {
  fakeUSDContract,
  pionerV1ComplianceContract,
  pionerV1Contract,
  pionerV1OpenContract,
  pionerV1CloseContract,
  pionerV1DefaultContract,
  pionerV1WrapperContract,
  chains,
  chainName,
  account,
  accounts,
  wallets,
  web3Client,
  client as redisClient,
  rfqQueue,
  logger,
  fantomSonicTestnet,
  wallet,
};
/*
async function test() {
  const amount = parseUnits('10000', 18);
  let hash;
  let hash1;
  let hash2;

  // Mint FUSD
  hash1 = await mintFUSD(amount, 0, 64165);
  hash2 = await mintFUSD(amount, 2, 64165);
  await web3Client.waitForTransactionReceipt({ hash: hash1 });
  await web3Client.waitForTransactionReceipt({ hash: hash2 });
  const balance = await getMintFUSD(0, 64165);
  console.log('Mint Balance:', balance);

  // Approve allowance
  hash1 = await allowance(amount, 0, 64165);
  hash2 = await allowance(amount, 2, 64165);
  await web3Client.waitForTransactionReceipt({ hash: hash1 });
  await web3Client.waitForTransactionReceipt({ hash: hash2 });
  const allowanceAmount = await getAllowance(0, 64165);
  console.log('Allowance Amount:', allowanceAmount);

  // Deposit
  hash1 = await deposit(amount, 0, 64165);
  hash2 = await deposit(amount, 2, 64165);
  await web3Client.waitForTransactionReceipt({ hash: hash1 });
  await web3Client.waitForTransactionReceipt({ hash: hash2 });
  const balance1 = await getBalance(0, 64165);
  console.log('Deposit Balance:', balance1);

  // Sign Open
  hash = await signOpen('forex.EURUSD/forex.GBPUSD', 0, 1, 64165);
  await web3Client.waitForTransactionReceipt({ hash: hash });
  console.log('Sign Open Hash:', hash);

  return;
}
*/
/*
  const test1 = await recoverTypedDataAddress({
    domain: domainWrapper,
    types: bOracleSignType,
    primaryType: 'bOracleSign',
    message: bOracleSignValue,
    signature: signatureBoracle,
  });
  console.log(test1);
  */
