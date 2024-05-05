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
  hash1 = await mintFUSD(amount, 1, 64165);
  hash2 = await mintFUSD(amount, 2, 64165);
  await web3Client.waitForTransactionReceipt({ hash: hash1 });
  await web3Client.waitForTransactionReceipt({ hash: hash2 });
  const balance = await getMintFUSD(0, 64165);
  console.log('Mint Balance:', balance);

  // Approve allowance
  hash1 = await allowance(amount, 1, 64165);
  hash2 = await allowance(amount, 2, 64165);
  await web3Client.waitForTransactionReceipt({ hash: hash1 });
  await web3Client.waitForTransactionReceipt({ hash: hash2 });
  const allowanceAmount = await getAllowance(0, 64165);
  console.log('Allowance Amount:', allowanceAmount);

  // Deposit
  hash1 = await deposit(amount, 1, 64165);
  hash2 = await deposit(amount, 2, 64165);
  await web3Client.waitForTransactionReceipt({ hash: hash1 });
  await web3Client.waitForTransactionReceipt({ hash: hash2 });
  const balance1 = await getBalance(1, 64165);
  console.log('Deposit Balance:', balance1);

  // Sign Open
  hash = await signOpen('forex.EURUSD/forex.GBPUSD', 1, 2, 64165);
  await web3Client.waitForTransactionReceipt({ hash: hash });
  console.log('Sign Open Hash:', hash);

  return;
}
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
/*
export async function signOpen(
  symbol: string,
  accountId: number,
  accountId2: number,
  chainId: number,
) {
  const domainOpen = {
    name: 'PionerV1Open',
    version: '1.0',
    chainId: 64165,
    verifyingContract: pionerV1OpenContract[accountId] as `0x${string}`,
  };

  const openQuoteSignType = {
    Quote: [
      { name: 'isLong', type: 'bool' },
      { name: 'bOracleId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'interestRate', type: 'uint256' },
      { name: 'isAPayingAPR', type: 'bool' },
      { name: 'frontEnd', type: 'address' },
      { name: 'affiliate', type: 'address' },
      { name: 'authorized', type: 'address' },
      { name: 'nonce', type: 'uint256' },
    ],
  };

  const openQuoteSignValue = {
    isLong: true,
    bOracleId: 0,
    price: parseUnits('50', 18),
    amount: parseUnits('10', 18),
    interestRate: parseUnits('1', 17),
    isAPayingAPR: true,
    frontEnd: '0xd0dDF915693f13Cf9B3b69dFF44eE77C901882f8',
    affiliate: '0xd0dDF915693f13Cf9B3b69dFF44eE77C901882f8',
    authorized: '0x0000000000000000000000000000000000000000', //config.publicKeys?.split(',')[accountId2],
    nonce: 0,
  };

  const signatureOpenQuote = await wallets[accountId].signTypedData({
    account: accounts[accountId],
    domain: domainOpen,
    types: openQuoteSignType,
    primaryType: 'Quote',
    message: openQuoteSignValue,
  });

  const domainWrapper = {
    name: 'PionerV1Wrapper',
    version: '1.0',
    chainId: 64165,
    verifyingContract: pionerV1WrapperContract[chainId] as `0x${string}`,
  };

  const bOracleSignType = {
    bOracleSign: [
      { name: 'x', type: 'uint256' },
      { name: 'parity', type: 'uint8' },
      { name: 'maxConfidence', type: 'uint256' },
      { name: 'assetHex', type: 'bytes32' },
      { name: 'maxDelay', type: 'uint256' },
      { name: 'precision', type: 'uint256' },
      { name: 'imA', type: 'uint256' },
      { name: 'imB', type: 'uint256' },
      { name: 'dfA', type: 'uint256' },
      { name: 'dfB', type: 'uint256' },
      { name: 'expiryA', type: 'uint256' },
      { name: 'expiryB', type: 'uint256' },
      { name: 'timeLock', type: 'uint256' },
      { name: 'signatureHashOpenQuote', type: 'bytes' },
      { name: 'nonce', type: 'uint256' },
    ],
  };

  const paddedSymbol = symbol.padEnd(32, '\0');
  const assetHex = bytesToHex(toBytes(paddedSymbol));
  const bOracleSignValue = {
    x: '0x20568a84796e6ade0446adfd2d8c4bba2c798c2af0e8375cc3b734f71b17f5fd',
    parity: 0,
    maxConfidence: parseUnits('1', 18),
    assetHex: assetHex,
    maxDelay: 600,
    precision: 5,
    imA: parseUnits('10', 16),
    imB: parseUnits('10', 16),
    dfA: parseUnits('10', 15),
    dfB: parseUnits('10', 15),
    expiryA: 60,
    expiryB: 60,
    timeLock: 1440 * 30 * 3,
    signatureHashOpenQuote: signatureOpenQuote,
    nonce: 0,
  };

  const signatureBoracle = await wallets[accountId].signTypedData({
    account: accounts[accountId],
    domain: domainWrapper,
    types: bOracleSignType,
    primaryType: 'bOracleSign',
    message: bOracleSignValue,
  });

  console.log('signatureOpenQuote', signatureOpenQuote);
  console.log('signatureBoracle', signatureBoracle);
  console.log('addr1', config.publicKeys?.split(',')[accountId]);
  console.log('addr2', config.publicKeys?.split(',')[accountId2]);

  const { request } = await web3Client.simulateContract({
    address: pionerV1WrapperContract[chainId] as Address,
    abi: PionerV1Wrapper.abi,
    functionName: 'wrapperOpenQuoteMM',
    args: [
      bOracleSignValue,
      signatureBoracle,
      openQuoteSignValue,
      signatureOpenQuote,
      parseUnits('50', 18),
    ],
    account: accounts[accountId2],
  });

  const hash = await wallets[accountId2].writeContract(request);
  return hash;
}

async function test() {
  const amount = parseUnits('10000', 18);
  let hash;

  // Sign Open
  hash = await signOpen('forex.EURUSD/forex.GBPUSD', 1, 2, 64165);
  await web3Client.waitForTransactionReceipt({ hash: hash });
  console.log('Sign Open Hash:', hash);

  return;
}
*/
