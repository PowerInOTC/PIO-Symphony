import dotenv from 'dotenv';
dotenv.config();

import {bullExample} from "./utils/bullmq/bullRFQ";
import { configTest } from './utils/config/config';



async function main(): Promise<void> {
  configTest();

  //bullExample();

}
main();

