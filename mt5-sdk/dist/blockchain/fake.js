"use strict";
/*import { ethers } from 'ethers';
import {
  networks,
  BlockchainInterface,
  contracts,
} from '@pionerfriends/blockchain-client';
import { logger } from '../utils/init';
import { Queue, Worker, QueueEvents } from 'bullmq';
import { config } from '../config';
import { blockchainInterfaceLib } from './blockchainInterface';

const rpcURL = 'https://rpc.sonic.fantom.network/';
const rpcKey = '';

const queueEvents = new QueueEvents('retryQueue', {
  connection: {
    host: config.bullmqRedisHost,
    port: config.bullmqRedisPort,
    password: config.bullmqRedisPassword,
  },
});

const retryQueue = new Queue('retryQueue', {
  connection: {
    host: config.bullmqRedisHost,
    port: config.bullmqRedisPort,
    password: config.bullmqRedisPassword,
  },
});

const retryWorker = new Worker(
  'retryQueue',
  async (job) => {
    const { blockchainInterfaceIndex, functionName, args } = job.data;
    const blockchainInterface = blockchainInterfaceLib.getInterfaceByIndex(
      blockchainInterfaceIndex,
    );

    try {
      let result;
      if (functionName === 'mint') {
        result = await blockchainInterface.mint(
          ...(args as [ethers.BigNumberish]),
        );
      } else if (functionName === 'approve') {
        result = await blockchainInterface.approve(
          ...(args as [string, ethers.BigNumberish]),
        );
      } else if (functionName === 'deposit') {
        result = await blockchainInterface.deposit(
          ...(args as [ethers.BigNumberish, number, string]),
        );
      }
      logger.info(` ${functionName} succeeded: ${JSON.stringify(result)}`);
    } catch (error) {
      logger.error(
        `Transaction failed in ${functionName} function: ${error as Error}`,
      );
      if (job.attemptsMade >= 5) {
        // Log the full error details when the maximum number of attempts is reached
        logger.error(
          `Transaction failed in ${functionName} function after 5 attempts: ${error}`,
        );
        throw new Error(
          `Transaction failed in ${functionName} function after 5 attempts: ${error}`,
        );
      }
      throw error;
    }
  },
  {
    connection: {
      host: config.bullmqRedisHost,
      port: config.bullmqRedisPort,
      password: config.bullmqRedisPassword,
    },
    concurrency: 1,
  },
);

async function mint(
  blockchainInterfaceIndex: number,
  amount: ethers.BigNumberish,
) {
  const jobData = {
    blockchainInterfaceIndex,
    functionName: 'mint',
    args: [amount.toString()],
  };
  try {
    const job = await retryQueue.add('retryJob', jobData, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: true,
      jobId: `interface${blockchainInterfaceIndex}_mint`,
    });
    await job.waitUntilFinished(queueEvents);
  } catch (error) {
    logger.error(`Error in mint function: ${(error as Error).message}`);
    throw error;
  }
}

async function approve(
  blockchainInterfaceIndex: number,
  spender: string,
  amount: ethers.BigNumberish,
) {
  const jobData = {
    blockchainInterfaceIndex,
    functionName: 'approve',
    args: [spender, amount.toString()],
  };
  try {
    const job = await retryQueue.add('retryJob', jobData, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: true,
      jobId: `interface${blockchainInterfaceIndex}_approve`,
    });
    await job.waitUntilFinished(queueEvents);
  } catch (error) {
    logger.error(`Error in approve function: ${(error as Error).message}`);
    throw error;
  }
}

async function deposit(
  blockchainInterfaceIndex: number,
  amount: ethers.BigNumberish,
  depositType: number,
  recipient: string,
) {
  const jobData = {
    blockchainInterfaceIndex,
    functionName: 'deposit',
    args: [amount.toString(), depositType, recipient],
  };
  try {
    const job = await retryQueue.add('retryJob', jobData, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: true,
      jobId: `interface${blockchainInterfaceIndex}_deposit`,
    });
    await job.waitUntilFinished(queueEvents);
  } catch (error) {
    logger.error(`Error in deposit function: ${(error as Error).message}`);
    throw error;
  }
}

async function test() {
  try {
    await mint(0, ethers.parseUnits('10000', 18));
    await approve(
      0,
      networks.sonic.contracts.PionerV1Compliance,
      ethers.parseUnits('10000', 18),
    );
    const interface1 = blockchainInterfaceLib.getInterfaceByIndex(0);
    await deposit(
      0,
      ethers.parseUnits('10000', 18),
      1,
      '0xd0dDF915693f13Cf9B3b69dFF44eE77C901882f8',
    );

    await mint(1, ethers.parseUnits('5000', 18));
    await approve(
      1,
      networks.sonic.contracts.PionerV1Compliance,
      ethers.parseUnits('5000', 18),
    );
    await deposit(
      1,
      ethers.parseUnits('5000', 18),
      1,
      '0xd0dDF915693f13Cf9B3b69dFF44eE77C901882f8',
    );
  } catch (error) {
    logger.error(`Error in test function: ${(error as Error).message}`);
    throw error;
  }
}

export { test };
*/ 
