import {
  PionerV1Wrapper,
  PionerV1Close,
  PionerV1Open,
  NetworkKey,
  networks,
} from '@pionerfriends/blockchain-client';
import { config } from '../config';
import { accounts, wallets, web3Clients } from '../utils/init';
import { convertToBytes32 } from '../utils/ethersUtils';
import { Address, bytesToHex, parseUnits, toBytes } from 'viem';
import { ethers, Wallet } from 'ethers';
import { settleOpen, settleClose } from './write';
import {
  BOracleSignValueType,
  openQuoteSignValueType,
  closeQuoteSignValueType,
} from './types';

async function testSignCloseQuote() {
  const chainId = '64165';
  const bContractId = 0;
  const price = ethers.utils.parseUnits('55', 18);
  const amount = ethers.utils.parseUnits('10', 18);
  const limitOrStop = 0;
  const expiry = 60000000000;
  const authorized = config.publicKeys?.split(',')[0];
  const nonce = Date.now().toString();

  const provider = new ethers.providers.JsonRpcProvider(
    'https://rpc.sonic.fantom.network/',
  );

  const addr1 = new ethers.Wallet(config.privateKeys?.split(',')[0], provider);

  const domainClose = {
    name: 'PionerV1Close',
    version: '1.0',
    chainId: chainId,
    verifyingContract: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1Close as Address,
  };

  const OpenCloseQuoteType = {
    OpenCloseQuote: [
      { name: 'bContractId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'limitOrStop', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
      { name: 'authorized', type: 'address' },
      { name: 'nonce', type: 'uint256' },
    ],
  };

  const closeQuoteValue: closeQuoteSignValueType = {
    bContractId: String(bContractId),
    price: String(price),
    amount: String(amount),
    limitOrStop: String(ethers.BigNumber.from(limitOrStop)),
    expiry: String(expiry),
    authorized: authorized,
    nonce: nonce,
  };

  const signCloseQuote = await addr1._signTypedData(
    domainClose,
    OpenCloseQuoteType,
    closeQuoteValue,
  );

  settleClose(closeQuoteValue, signCloseQuote, 2, chainId);
}

async function testSignOpenQuote() {
  const provider = new ethers.providers.JsonRpcProvider(
    'https://rpc.sonic.fantom.network/',
  );
  const chainId = '64165';

  const addr1 = new ethers.Wallet(config.privateKeys?.split(',')[0], provider);
  const addr2 = new ethers.Wallet(config.privateKeys?.split(',')[1], provider);
  const addr3 = new ethers.Wallet(config.privateKeys?.split(',')[2], provider);
  const addr4 = new ethers.Wallet(config.privateKeys?.split(',')[3], provider);
  const etherWallet = [addr1, addr2, addr3, addr4];

  const PionerV1OpenAddress = '0xF9d4DeD362a9C2728be18eE62A7E3076054b3279';

  const PionerV1WrapperAddress = ethers.utils.getAddress(
    '0x271990c7a1BDD612EC4c60492b24Dc693af67198',
  );
  console.log('PionerV1WrapperAddress', PionerV1WrapperAddress);

  const domainOpen = {
    name: 'PionerV1Open',
    version: '1.0',
    chainId: 64165,
    verifyingContract: PionerV1OpenAddress,
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
    price: ethers.utils.parseUnits('50', 18),
    amount: ethers.utils.parseUnits('10', 18),
    interestRate: ethers.utils.parseUnits('1', 17),
    isAPayingAPR: true,
    frontEnd: config.publicKeys?.split(',')[0],
    affiliate: config.publicKeys?.split(',')[0],
    authorized: config.publicKeys?.split(',')[2],
    nonce: 0,
  };

  const signatureOpenQuote = await addr1._signTypedData(
    domainOpen,
    openQuoteSignType,
    openQuoteSignValue,
  );
  const domainWrapper = {
    name: 'PionerV1Wrapper',
    version: '1.0',
    chainId: 64165,
    verifyingContract: PionerV1WrapperAddress,
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

  const bOracleSignValue = {
    x: '0x20568a84796e6ade0446adfd2d8c4bba2c798c2af0e8375cc3b734f71b17f5fd',
    parity: 0,
    maxConfidence: ethers.utils.parseUnits('1', 18),
    assetHex: convertToBytes32('forex.EURUSD/forex.GBPUSD'),
    maxDelay: 600,
    precision: 5,
    imA: ethers.utils.parseUnits('10', 16),
    imB: ethers.utils.parseUnits('10', 16),
    dfA: ethers.utils.parseUnits('25', 15),
    dfB: ethers.utils.parseUnits('25', 15),
    expiryA: 60,
    expiryB: 60,
    timeLock: 1440 * 30 * 3,
    signatureHashOpenQuote: signatureOpenQuote,
    nonce: 0,
  };

  const signatureBoracle = await addr1._signTypedData(
    domainWrapper,
    bOracleSignType,
    bOracleSignValue,
  );

  console.log('signatureOpenQuote', ethers.utils.hexlify(signatureOpenQuote));
  console.log('signatureBoracle', ethers.utils.hexlify(signatureBoracle));
  console.log('addr1', addr1.address);
  console.log('addr2', addr2.address);
  const { request } = await web3Clients[Number(chainId)].simulateContract({
    address: networks[chainId as unknown as NetworkKey].contracts
      .PionerV1Wrapper as Address,
    abi: PionerV1Wrapper.abi,
    functionName: 'wrapperOpenQuoteMM',
    args: [
      bOracleSignValue,
      signatureBoracle,
      openQuoteSignValue,
      signatureOpenQuote,
      ethers.utils.parseUnits('50', 18),
    ],
    account: accounts[Number(chainId)][2],
  });

  const hash = await wallets[Number(chainId)][2].writeContract(request);
  return hash;
}
