import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { config } from '../config';
import { retrieveLatestTicks } from './dispatcher';

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

const latestPriceData: { [key: string]: { bid: number; ask: number } } = {};
const jobKeys: { [key: string]: string | undefined } = {};

async function startMt5PriceWorker(config: Mt5PriceConfig): Promise<void> {
  const queueName = 'mt5PriceQueue';

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

  const worker = new Worker<WorkerData>(
    queueName,
    async (job: Job<WorkerData>) => {
      try {
        const symbols = Object.keys(jobKeys);
        const ticks = await retrieveLatestTicks(symbols, 'mt5.ICMarkets');

        for (const [symbol, prices] of Object.entries(ticks)) {
          const userAddress = jobKeys[symbol]?.split('_')[2] || '';
          if (prices.bid && prices.ask) {
            latestPriceData[`${userAddress}_${symbol}`] = {
              bid: prices.bid,
              ask: prices.ask,
            };
            console.log(
              `Price for ${symbol} (${userAddress}): Bid=${prices.bid}, Ask=${prices.ask}`,
            );
          }
        }
      } catch (error) {
        console.error('Error processing job:', error);
      }
    },
    {
      connection: {
        host: config.bullmqRedisHost,
        port: config.bullmqRedisPort,
        password: config.bullmqRedisPassword,
      },
      concurrency: 1, // Process one job at a time
    },
  );

  console.log('Mt5Price worker started');
}

async function mt5Price(
  symbol: string,
  updateSpeedMs: number,
  updateLengthMin: number,
  userAddress: string,
): Promise<void> {
  const updateSpeed = updateSpeedMs;
  const updateLength = updateLengthMin;

  const queue = new Queue<WorkerData>('mt5PriceQueue', {
    connection: {
      host: config.bullmqRedisHost,
      port: config.bullmqRedisPort,
      password: config.bullmqRedisPassword,
    },
  });

  const jobKey = `mt5PriceJob_${userAddress}_${symbol}`;

  if (jobKeys[jobKey]) {
    const existingJobId = jobKeys[jobKey];
    if (existingJobId) {
      const existingJob = await queue.getJob(existingJobId);
      if (existingJob) {
        try {
          const failedError = new Error('Job updated');
          await existingJob.moveToFailed(failedError, 'Job updated');
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes('Lock mismatch')) {
              console.warn(
                `Lock mismatch for job ${existingJobId}. Skipping move to failed state.`,
              );
            } else if (error.message.includes('Missing lock')) {
              console.warn(
                `Missing lock for job ${existingJobId}. Skipping move to failed state.`,
              );
            } else {
              console.error(
                `Error moving job ${existingJobId} to failed state:`,
                error,
              );
            }
          } else {
            console.error(
              `Unknown error moving job ${existingJobId} to failed state:`,
              error,
            );
          }
        }
      }
    }
  }

  const workerData: WorkerData = {
    symbol,
    updateSpeed,
    updateLength,
    userAddress,
  };

  const job = await queue.add(jobKey, workerData, {
    repeat: {
      every: updateSpeed,
    },
  });

  jobKeys[jobKey] = job.id;
}

function getLatestPrice(
  userAddress: string,
  symbol: string,
): { bid: number; ask: number } | null {
  const key = `${userAddress}_${symbol}`;
  return latestPriceData[key] || null;
}

// Start the Mt5Price worker automatically
startMt5PriceWorker(config)
  .then(() => {
    console.log('Mt5Price worker started successfully');
  })
  .catch((error) => {
    console.error('Error starting Mt5Price worker:', error);
  });

export { mt5Price, getLatestPrice };
