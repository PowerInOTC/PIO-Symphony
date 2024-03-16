import dotenv from 'dotenv';
dotenv.config();

import { Queue, Worker } from 'bullmq';
import { config } from './config';
import {
  createWalletAndSignIn,
  sendRfq,
  RfqWebsocketClient,
} from '@pionerfriends/api-client';

import {bullExample} from "./utils/bullmq/bullRFQ";
import { configTest } from './utils/config/config';



async function main(): Promise<void> {
  //configTest();

  bullExample();

}
main();

