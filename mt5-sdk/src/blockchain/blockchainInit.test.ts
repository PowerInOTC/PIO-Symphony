import { PionerV1Wrapper } from '@pionerfriends/blockchain-client';
import { config } from '../config';
import { accounts, wallets, web3Clients } from '../utils/init';
import { parseUnits } from 'viem';
import { mintFUSD, allowance, deposit } from './write';
import { getBalance, getAllowance, getMintFUSD } from './read';

export async function initAccount(id: number) {
  const amount = parseUnits('10000', 18);
  let hash;

  // Mint FUSD
  const prevBalance: string = (await getMintFUSD(id, '64165')) as string;
  hash = await mintFUSD(amount.toString(), id, '64165');
  await web3Clients[64165].waitForTransactionReceipt({ hash });
  const nextBalance: string = (await getMintFUSD(id, '64165')) as string;
  console.log('Mint Balance Account:', nextBalance);

  // Approve allowance
  const prevAllowance: string = (await getAllowance(id, '64165')) as string;
  await allowance(amount.toString(), id, '64165');
  const nextAllowance: string = (await getAllowance(id, '64165')) as string;
  console.log('Allowance Account:', nextAllowance);

  // Deposit
  const prevDepositBalance: string = (await getBalance(id, '64165')) as string;
  await deposit(amount.toString(), id, '64165');
  const nextDepositBalance: string = (await getBalance(id, '64165')) as string;
  console.log('Deposit Balance Account:', nextDepositBalance);

  return {
    prevBalance,
    nextBalance,
    prevAllowance,
    nextAllowance,
    prevDepositBalance,
    nextDepositBalance,
  };
}

describe('initAccount', () => {
  test('should initialize account correctly', async () => {
    const {
      prevBalance,
      nextBalance,
      prevAllowance,
      nextAllowance,
      prevDepositBalance,
      nextDepositBalance,
    } = await initAccount(0);

    // Verify mint balance
    expect(BigInt(nextBalance)).toBeGreaterThan(BigInt(prevBalance));

    // Verify allowance
    expect(BigInt(nextAllowance)).toBeGreaterThanOrEqual(BigInt(prevAllowance));

    // Verify deposit balance
    expect(BigInt(nextDepositBalance)).toBeGreaterThanOrEqual(
      BigInt(prevDepositBalance),
    );
  }, 100000); // Increase the timeout to 10000 ms
});