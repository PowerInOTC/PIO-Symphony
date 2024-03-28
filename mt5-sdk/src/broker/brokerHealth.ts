import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { config } from '../config';
import { retrieveMaxNotional } from './dispatcher';

interface WorkerData {
  broker: string;
  updateSpeed: number;
  updateLength: number;
}

interface BrokerHealthConfig {
  bullmqRedisHost: string;
  bullmqRedisPort: number;
  bullmqRedisPassword: string;
}

const latestMaxNotionalData: { [key: string]: number } = {};
const jobKeys: { [key: string]: string | undefined } = {};

async function startBrokerHealthWorker(
  config: BrokerHealthConfig,
): Promise<void> {
  const queueName = 'brokerHealthQueue';

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
        const { broker } = job.data;
        const maxNotional = await retrieveMaxNotional(broker);
        latestMaxNotionalData[broker] = maxNotional;
        console.log(`Max notional for ${broker}: ${maxNotional}`);
      } catch (error) {
        console.error(
          `Error processing job for broker ${job.data.broker}:`,
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
      concurrency: 1, // Process one job at a time
    },
  );

  console.log('BrokerHealth worker started');
}

async function brokerHealth(
  broker: string,
  updateSpeedMs: number,
  updateLengthMin: number,
): Promise<void> {
  const updateSpeed = updateSpeedMs;
  const updateLength = updateLengthMin;

  const queue = new Queue<WorkerData>('brokerHealthQueue', {
    connection: {
      host: config.bullmqRedisHost,
      port: config.bullmqRedisPort,
      password: config.bullmqRedisPassword,
    },
  });

  const jobKey = `brokerHealthJob_${broker}`;

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
    broker,
    updateSpeed,
    updateLength,
  };

  const job = await queue.add(jobKey, workerData, {
    repeat: {
      every: updateSpeed,
    },
  });

  jobKeys[jobKey] = job.id;
}

function getLatestMaxNotional(broker: string): number | null {
  return latestMaxNotionalData[broker] || null;
}

// Start the BrokerHealth worker automatically
startBrokerHealthWorker(config)
  .then(() => {
    console.log('BrokerHealth worker started successfully');
  })
  .catch((error) => {
    console.error('Error starting BrokerHealth worker:', error);
  });

export { brokerHealth, getLatestMaxNotional };
