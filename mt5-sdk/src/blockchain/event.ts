import { createClient } from 'redis';
import { TransactionResponse, BigNumberish } from 'ethers';
import {
  BlockchainInterface,
  BOracle,
  BContract,
  BCloseQuote,
  UserRelatedInfo,
} from '@pionerfriends/blockchain-client';
import { logger } from '../utils/init';
import { blockchainInterfaceLib } from './blockchainInterface';
import { ethers } from 'ethers';
import { config } from '../config';

let redisClient: ReturnType<typeof createClient>;

async function connectToRedis(): Promise<void> {
  redisClient = createClient({
    socket: {
      host: config.bullmqRedisHost,
      port: config.bullmqRedisPort,
    },
    password: config.bullmqRedisPassword,
  });

  redisClient.on('error', (err: Error) => {
    logger.error('Redis connection error:', err);
    // Handle the error appropriately (e.g., retry, notify, etc.)
  });

  await redisClient.connect();
}

async function resetRedisData(): Promise<void> {
  await connectToRedis();
  await redisClient.del([
    'user:*',
    'contract:*',
    'closeQuote:*',
    'oracle:*',
    'userRelatedInfo:*',
  ]);
}

async function fetchEvents(
  earliest: number | 'earliest' = 'earliest',
  latest: number | 'latest' = 'latest',
  manualStart?: number,
  manualFinish?: number,
): Promise<void> {
  await connectToRedis();
  await blockchainInterfaceLib.forEachInterface(
    async (blockchainInterface: BlockchainInterface) => {
      const start = manualStart ?? earliest;
      const finish = manualFinish ?? latest;

      const [compliance, open, close, _default] = await Promise.all([
        logger.info(`Fetching complianceeee events from ${start} to ${finish}`),
        blockchainInterface.fetchEvent(
          'PionerV1Compliance',
          '*',
          start.toString(),
          finish,
        ),
        blockchainInterface.fetchEvent(
          'PionerV1Open',
          '*',
          start.toString(),
          finish,
        ),
        blockchainInterface.fetchEvent(
          'PionerV1Close',
          '*',
          start.toString(),
          finish,
        ),
        blockchainInterface.fetchEvent(
          'PionerV1Default',
          '*',
          start.toString(),
          finish,
        ),
      ]);

      for (const log of compliance) {
        const parsedLog = log as any;
        if (
          parsedLog.name === 'DepositEvent' ||
          parsedLog.name === 'WithdrawEvent' ||
          parsedLog.name === 'CancelWithdrawEvent'
        ) {
          const user = parsedLog.args.user;
          await updateUserBalance(blockchainInterface, user);
        }
      }

      for (const log of open) {
        const parsedLog = log as any;
        if (
          parsedLog.name === 'openQuoteEvent' ||
          parsedLog.name === 'openQuoteSignedEvent' ||
          parsedLog.name === 'acceptQuoteEvent'
        ) {
          const bContractId: BigNumberish = parsedLog.args.bContractId;
          await updateContractData(blockchainInterface, bContractId);
        }
      }

      for (const log of _default) {
        const parsedLog = log as any;
        if (
          parsedLog.name === 'settledEvent' ||
          parsedLog.name === 'liquidatedEvent'
        ) {
          const bContractId: BigNumberish = parsedLog.args.bContractId;
          await updateContractData(blockchainInterface, bContractId);
        }
      }

      for (const log of close) {
        const parsedLog = log as any;
        if (
          parsedLog.name === 'openCloseQuoteEvent' ||
          parsedLog.name === 'acceptCloseQuoteEvent' ||
          parsedLog.name === 'closeMarketEvent'
        ) {
          const bCloseQuoteId: BigNumberish = parsedLog.args.bCloseQuoteId;
          await updateCloseQuoteData(blockchainInterface, bCloseQuoteId);
        }
      }

      const userRelatedInfo = await blockchainInterface.getUserRelatedInfo(
        'user_address',
        'counterparty_address',
      );
      await redisClient.hSet(
        `userRelatedInfo:user_address:counterparty_address`,
        {
          openPositionNumber: userRelatedInfo.openPositionNumber.toString(),
          owedAmount: userRelatedInfo.owedAmount.toString(),
          totalOwedAmount: userRelatedInfo.totalOwedAmount.toString(),
          totalOwedAmountPaid: userRelatedInfo.totalOwedAmountPaid.toString(),
          gracePeriodLockedWithdrawBalance:
            userRelatedInfo.gracePeriodLockedWithdrawBalance.toString(),
          gracePeriodLockedTime:
            userRelatedInfo.gracePeriodLockedTime.toString(),
          minimumOpenPartialFillNotional:
            userRelatedInfo.minimumOpenPartialFillNotional.toString(),
          sponsorReward: userRelatedInfo.sponsorReward.toString(),
          oracleLength: userRelatedInfo.oracleLength.toString(),
          contractLength: userRelatedInfo.contractLength.toString(),
          closeQuoteLength: userRelatedInfo.closeQuoteLength.toString(),
        },
      );
    },
  );
}

async function updateUserBalance(
  blockchainInterface: BlockchainInterface,
  user: string,
): Promise<void> {
  try {
    const balance: bigint = await blockchainInterface.getBalance(user);
    await redisClient.hSet(`user:${user}`, 'balance', balance.toString());
    logger.info(`Updated balance for user ${user}: ${balance}`);
  } catch (error) {
    logger.error(`Error updating balance for user ${user}:`, error);
    // Handle the error appropriately (e.g., retry, notify, etc.)
  }
}

async function updateContractData(
  blockchainInterface: BlockchainInterface,
  bContractId: BigNumberish,
): Promise<void> {
  try {
    const contract: BContract =
      await blockchainInterface.getContract(bContractId);
    await redisClient.hSet(`contract:${bContractId.toString()}`, {
      pA: contract.pA,
      pB: contract.pB,
      oracleId: contract.oracleId.toString(),
      initiator: contract.initiator,
      price: contract.price.toString(),
      amount: contract.amount.toString(),
      interestRate: contract.interestRate.toString(),
      isAPayingAPR: contract.isAPayingAPR ? '1' : '0',
      openTime: contract.openTime.toString(),
      state: contract.state.toString(),
      frontEnd: contract.frontEnd,
      hedger: contract.hedger,
      affiliate: contract.affiliate,
      cancelTime: contract.cancelTime.toString(),
    });
    logger.info(`Updated contract data for bContractId ${bContractId}`);
  } catch (error) {
    logger.error(
      `Error updating contract data for bContractId ${bContractId}:`,
      error,
    );
    // Handle the error appropriately (e.g., retry, notify, etc.)
  }
}

async function updateCloseQuoteData(
  blockchainInterface: BlockchainInterface,
  bCloseQuoteId: BigNumberish,
): Promise<void> {
  try {
    const closeQuote: BCloseQuote =
      await blockchainInterface.getCloseQuote(bCloseQuoteId);
    await redisClient.hSet(`closeQuote:${bCloseQuoteId.toString()}`, {
      bContractIds: JSON.stringify(closeQuote.bContractIds),
      price: JSON.stringify(closeQuote.price),
      amount: JSON.stringify(closeQuote.amount),
      limitOrStop: JSON.stringify(closeQuote.limitOrStop),
      expiry: JSON.stringify(closeQuote.expiry),
      initiator: closeQuote.initiator,
      cancelTime: closeQuote.cancelTime.toString(),
      openTime: closeQuote.openTime.toString(),
      state: closeQuote.state.toString(),
    });
    logger.info(`Updated close quote data for bCloseQuoteId ${bCloseQuoteId}`);
  } catch (error) {
    logger.error(
      `Error updating close quote data for bCloseQuoteId ${bCloseQuoteId}:`,
      error,
    );
    // Handle the error appropriately (e.g., retry, notify, etc.)
  }
}

async function getBalanceByUser(user: string): Promise<bigint> {
  await connectToRedis();
  const balance = await redisClient.hGet(`user:${user}`, 'balance');
  return balance ? BigInt(balance) : BigInt(0);
}

export { resetRedisData, fetchEvents, getBalanceByUser };
