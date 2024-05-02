import {
  accounts,
  logger,
  web3Client,
  wallets,
  fakeUSDContract,
  pionerV1ComplianceContract,
  pionerV1Contract,
  pionerV1OpenContract,
  pionerV1WrapperContract,
  pionerV1DefaultContract,
} from './utils/init';
import { config } from './config';
import {
  FakeUSD,
  PionerV1,
  PionerV1Compliance,
  PionerV1Open,
  PionerV1Wrapper,
  PionerV1Default,
} from '@pionerfriends/blockchain-client';

import {
  Address,
  parseUnits,
  toBytes,
  bytesToHex,
  recoverTypedDataAddress,
} from 'viem';
import {
  getAllowance,
  getBalance,
  getMintFUSD,
  allowance,
  deposit,
  mintFUSD,
} from './blockchain/open';

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
  const test1 = await recoverTypedDataAddress({
    domain: domainWrapper,
    types: bOracleSignType,
    primaryType: 'bOracleSign',
    message: bOracleSignValue,
    signature: signatureBoracle,
  });
  console.log(test1);

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

test();
