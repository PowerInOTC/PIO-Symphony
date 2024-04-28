import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { config } from '../config';
import axios from 'axios';

interface WorkerData {
  symbolPair: string;
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

async function retrieveLatestTick(
  symbol: string,
): Promise<{ bid: number; ask: number }> {
  try {
    const response = await axios.get(
      `${config.apiBaseUrl}/retrieve_latest_tick/${symbol}`,
    );
    return response.data as { bid: number; ask: number };
  } catch (error) {
    console.error(`Error retrieving latest tick for ${symbol}:`, error);
    return { bid: 0, ask: 0 };
  }
}

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
        const { symbolPair, userAddress } = job.data;

        if (symbolPair) {
          const [symbol1, symbol2] = symbolPair.split('/');

          if (symbol1 && symbol2) {
            const tick1 = await retrieveLatestTick(symbol1);
            const tick2 = await retrieveLatestTick(symbol2);

            if (tick1.bid && tick1.ask && tick2.bid && tick2.ask) {
              const bidRatio = tick1.bid / tick2.bid;
              const askRatio = tick1.ask / tick2.ask;

              latestPriceData[`${userAddress}_${symbolPair}`] = {
                bid: bidRatio,
                ask: askRatio,
              };
            }
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

  console.log(`Mt5Price worker started`);
}

async function mt5Price(
  symbolPair: string,
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

  const jobKey = `mt5PriceJob_${userAddress}_${symbolPair}`;

  if (jobKeys[jobKey]) {
    const existingJobId = jobKeys[jobKey];
    if (existingJobId) {
      const existingJob = await queue.getJob(existingJobId);
      if (existingJob) {
        try {
          await existingJob.remove();
        } catch (error) {
          console.error(`Error removing existing job ${existingJobId}:`, error);
        }
      }
    }
  }

  const workerData: WorkerData = {
    symbolPair,
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
  symbolPair: string,
): { bid: number; ask: number } | null {
  const key = `${userAddress}_${symbolPair}`;
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
