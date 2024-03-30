import { redisClient } from '../utils/init';
import { TransactionResponse, BigNumberish } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';
import {
  BlockchainInterface,
  BOracle,
  BContract,
  BCloseQuote,
  UserRelatedInfo,
} from '@pionerfriends/blockchain-client';
import { logger } from '../utils/init';
import { forEachBlockchainInterface } from './blockchainInterfaces';

async function resetRedisData(): Promise<void> {
  await redisClient.del([
    'user:*',
    'contract:*',
    'closeQuote:*',
    'oracle:*',
    'userRelatedInfo:*',
  ]);
}

async function fetchEvents(start: number, finish: number): Promise<void> {
  await forEachBlockchainInterface(
    async (blockchainInterface: BlockchainInterface) => {
      const compliance = await blockchainInterface.fetchEvent(
        'PionerV1Compliance',
        '*',
        start.toString(),
        finish.toString(),
      );
      const open = await blockchainInterface.fetchEvent(
        'PionerV1Open',
        '*',
        start.toString(),
        finish.toString(),
      );
      const close = await blockchainInterface.fetchEvent(
        'PionerV1Close',
        '*',
        start.toString(),
        finish.toString(),
      );
      const _default = await blockchainInterface.fetchEvent(
        'PionerV1Default',
        '*',
        start.toString(),
        finish.toString(),
      );

      for (const log of compliance) {
        const parsedLog = log as any;
        if (
          parsedLog.name === 'DepositEvent' ||
          parsedLog.name === 'WithdrawEvent' ||
          parsedLog.name === 'CancelWithdrawEvent'
        ) {
          const user = parsedLog.args.user;
          const balance: BigNumber = await blockchainInterface.getBalance(user);
          await redisClient.hSet(`user:${user}`, 'balance', balance.toString());
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
        }
      }

      for (const log of _default) {
        const parsedLog = log as any;
        if (
          parsedLog.name === 'settledEvent' ||
          parsedLog.name === 'liquidatedEvent'
        ) {
          const bContractId: BigNumberish = parsedLog.args.bContractId;
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
        }
      }

      const userRelatedInfo: UserRelatedInfo =
        await blockchainInterface.getUserRelatedInfo(
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
