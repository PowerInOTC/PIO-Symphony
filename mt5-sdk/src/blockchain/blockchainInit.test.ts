import { PionerV1Wrapper } from '@pionerfriends/blockchain-client';
import { config } from '../config';
import { accounts, wallets, web3Clients } from '../utils/init';
import { parseUnits } from 'viem';
import { mintFUSD, allowance, deposit } from './write';
import { getBalance, getAllowance, getMintFUSD } from './read';

export async function initAccount(id: number) {
  const amount = parseUnits('100000000', 18);
  let hash;

  hash = await mintFUSD(amount.toString(), id, config.activeChainId);
  // Mint FUSD
  const prevBalance: string = (await getMintFUSD(
    id,
    config.activeChainId,
  )) as string;
  if (hash) {
    await web3Clients[Number(config.activeChainId)].waitForTransactionReceipt({
      hash,
    });
  }
  const nextBalance: string = (await getMintFUSD(
    id,
    config.activeChainId,
  )) as string;
  console.log('Mint Balance Account:', id, nextBalance);

  // Approve allowance
  const prevAllowance: string = (await getAllowance(
    id,
    config.activeChainId,
  )) as string;
  await allowance(amount.toString(), id, config.activeChainId);
  const nextAllowance: string = (await getAllowance(
    id,
    config.activeChainId,
  )) as string;
  console.log('Allowance Account:', id, nextAllowance);

  // Deposit
  const prevDepositBalance: string = (await getBalance(
    id,
    config.activeChainId,
  )) as string;
  await deposit(amount.toString(), id, config.activeChainId);
  const nextDepositBalance: string = (await getBalance(
    id,
    config.activeChainId,
  )) as string;
  console.log('Deposit Balance Account:', id, nextDepositBalance);

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
