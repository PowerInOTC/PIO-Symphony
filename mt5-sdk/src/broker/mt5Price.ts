import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { config } from '../config';
import { retrieveLatestTick } from './dispatcher';

interface WorkerData {
  symbol: string;
  updateSpeed: number;
  updateLength: number;
  userAddress: string;
}

interface Mt5PriceConfig {
  bullmqRedisHost: string;
  bullmqRedisPort: number;
  bullmqRedisPassword: string;
}

const workers: { [key: string]: Worker } = {};

async function mt5Price(
  symbol: string,
  updateSpeedMs: number,
  updateLengthMin: number,
  userAddress: string,
): Promise<void> {
  try {
    const updateSpeed = updateSpeedMs;
    const updateLength = updateLengthMin;

    const queueName = `mt5Price_${userAddress}_${symbol}`;

    if (workers[userAddress]) {
      const workerOpts = workers[userAddress].opts;
      if (
        workers[userAddress].name !== queueName ||
        (workerOpts &&
          workerOpts.limiter &&
          workerOpts.limiter.duration !== updateSpeed)
      ) {
        await workers[userAddress].close();
        delete workers[userAddress];
      } else {
        return;
      }
    }

    const queue = new Queue<WorkerData>(queueName, {
      connection: {
        host: config.bullmqRedisHost,
        port: config.bullmqRedisPort,
        password: config.bullmqRedisPassword,
      },
    });

    const queueEvents = new QueueEvents(queueName, {
      connection: {
        host: config.bullmqRedisHost,
        port: config.bullmqRedisPort,
        password: config.bullmqRedisPassword,
      },
    });

    const workerData: WorkerData = {
      symbol,
      updateSpeed,
      updateLength,
      userAddress,
    };

    const worker = new Worker<WorkerData>(
      queueName,
      async (job: Job<WorkerData>) => {
        try {
          const { symbol } = job.data;
          const { bid, ask } = await retrieveLatestTick(
            symbol,
            'mt5.ICMarkets',
          );
          console.log(`Price for ${symbol}: Bid=${bid}, Ask=${ask}`);
        } catch (error) {
          console.error(
            `Error processing job for symbol ${job.data.symbol}:`,
            error,
          );
        }
      },
      {
        connection: {
          host: config.bullmqRedisHost,
          port: config.bullmqRedisPort,
          password: config.bullmqRedisPassword,
        },
        limiter: {
          max: 1,
          duration: updateSpeed,
        },
      },
    );

    await queue.add(`mt5PriceJob_${userAddress}_${symbol}`, workerData, {
      repeat: {
        every: updateSpeed,
      },
    });

    setTimeout(() => {
      worker.close();
      queueEvents.close();
    }, updateLength);

    workers[userAddress] = worker;
  } catch (error) {
    console.error(
      `Error in mt5Price for symbol ${symbol} and user ${userAddress}:`,
      error,
    );
  }
}

export { mt5Price };
