import { Queue, Worker } from 'bullmq';
import { processRFQ } from './rfqJob';
import { processEther } from './etherJob';

const connection = {
  host: 'localhost',
  port: 6379,
};

export const RFQQueue = new Queue('RFQQueue', { connection });
export const EtherQueue = new Queue('EtherQueue', { connection });

export const RFQWorker = new Worker('RFQQueue', processRFQ, { connection });
export const EtherWorker = new Worker('EtherQueue', processEther, {
  connection,
});

export const gracefulShutdown = async () => {
  await RFQWorker.close();
  await EtherWorker.close();
  console.log('Workers shut down gracefully');
};
