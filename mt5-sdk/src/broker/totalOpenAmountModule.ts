import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { config } from '../config';
import { totalOpenAmountInfo } from './dispatcher';
import { getBrokerFromAsset } from '../configBuilder/configRead';
interface WorkerData {
  symbol: string;
  broker: string;
}

interface TotalOpenAmountConfig {
  bullmqRedisHost: string;
  bullmqRedisPort: number;
  bullmqRedisPassword: string;
}

const totalOpenAmountData: { [key: string]: number } = {};
const jobKeys: { [key: string]: string | undefined } = {};

async function startTotalOpenAmountWorker(
  config: TotalOpenAmountConfig,
): Promise<void> {
  const queueName = 'totalOpenAmountQueue';

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
        const { symbol, broker } = job.data;
        const totalOpenAmount = await totalOpenAmountInfo(symbol);
        totalOpenAmountData[`${broker}_${symbol}`] = totalOpenAmount;
        console.log(
          `Total open amount for ${symbol} (${broker}): ${totalOpenAmount}`,
        );
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

  console.log('TotalOpenAmount worker started');
}

async function startTotalOpenAmountInfo(
  symbol: string,
  broker: string,
): Promise<void> {
  const queue = new Queue<WorkerData>('totalOpenAmountQueue', {
    connection: {
      host: config.bullmqRedisHost,
      port: config.bullmqRedisPort,
      password: config.bullmqRedisPassword,
    },
  });

  const jobKey = `totalOpenAmountJob_${broker}_${symbol}`;

  if (jobKeys[jobKey]) {
    const existingJobId = jobKeys[jobKey];
    if (existingJobId) {
      const existingJob = await queue.getJob(existingJobId);
      if (existingJob) {
        try {
          const failedError = new Error('Job updated');
          await existingJob.moveToFailed(failedError, 'Job updated');
        } catch (error) {
          console.error('Error moving job to failed state:', error);
        }
      }
    }
  }

  const workerData: WorkerData = {
    symbol,
    broker,
  };

  const job = await queue.add(jobKey, workerData);
  jobKeys[jobKey] = job.id;
}

function getTotalOpenAmount(symbol: string): number | null {
  const broker = getBrokerFromAsset(symbol);
  const key = `${broker}_${symbol}`;
  return totalOpenAmountData[key] || null;
}

// Start the TotalOpenAmount worker automatically
startTotalOpenAmountWorker(config)
  .then(() => {
    console.log('TotalOpenAmount worker started successfully');
  })
  .catch((error) => {
    console.error('Error starting TotalOpenAmount worker:', error);
  });

export { startTotalOpenAmountInfo, getTotalOpenAmount };

/*
make a the same function for but for that async function totalOpenAmountInfo( symbol: string, broker: string, ): Promise { switch (broker) { case 'mt5.ICMarkets': try { return ( await axios.get(\`${apiBaseUrl}/get\_total\_open\_amount/${symbol}\`) ).data; } catch (error) { console.error('Error retrieving total open amount info:', error); return 0; } default: console.error('Unsupported broker for totalOpenAmountInfo'); return 0; } } using this example export startTotalOpenAmountInfo and getTotalOpenAmount*/
