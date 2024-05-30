import { PionerV1Wrapper } from '@pionerfriends/blockchain-client';
import { config } from './config';
import { accounts, wallets, web3Clients } from './utils/init';
import { parseUnits } from 'viem';
import { mintFUSD, allowance, deposit } from './blockchain/write';
import { getBalance, getAllowance, getMintFUSD } from './blockchain/read';

async function test() {
  const amount = parseUnits('10000', 18);
  let hash;
  let hash1;
  let hash2;

  // Mint FUSD
  hash1 = await mintFUSD(amount, 1, '64165');
  hash2 = await mintFUSD(amount, 2, '64165');
  await web3Clients[64165].waitForTransactionReceipt({ hash: hash1 });
  await web3Clients[64165].waitForTransactionReceipt({ hash: hash2 });
  const balance = await getMintFUSD(0, '64165');
  console.log('Mint Balance:', balance);

  // Approve allowance
  hash1 = await allowance(amount, 1, '64165');
  hash2 = await allowance(amount, 2, '64165');
  await web3Clients[64165].waitForTransactionReceipt({ hash: hash1 });
  await web3Clients[64165].waitForTransactionReceipt({ hash: hash2 });
  const allowanceAmount = await getAllowance(0, '64165');
  console.log('Allowance Amount:', allowanceAmount);

  // Deposit
  hash1 = await deposit(amount, 1, '64165');
  hash2 = await deposit(amount, 2, '64165');
  await web3Clients[64165].waitForTransactionReceipt({ hash: hash1 });
  await web3Clients[64165].waitForTransactionReceipt({ hash: hash2 });
  const balance1 = await getBalance(1, '64165');
  console.log('Deposit Balance:', balance1);

  // Sign Open
  /*
  hash = await signOpen('forex.EURUSD/forex.GBPUSD', 1, 2, '64165');
  await web3Clients[64165].waitForTransactionReceipt({ hash: hash });
  console.log('Sign Open Hash:', hash);
*/
  return;
}

test();
