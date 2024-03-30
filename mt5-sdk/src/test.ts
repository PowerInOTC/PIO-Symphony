import dotenv from 'dotenv';
dotenv.config();

import { config } from './config';
import { Queue, Worker } from 'bullmq';
import { ethers } from 'ethers';
import {
  sendRfq,
  RfqWebsocketClient,
  RfqResponse,
  getPayloadAndLogin,
  QuoteWebsocketClient,
  QuoteResponse,
  RfqRequest,
  getPrices,
} from '@pionerfriends/api-client';
import { sendErrorToTelegram } from './utils/telegram';
import { sendMessage } from './utils/telegram';
import { logger } from './utils/init';
import {
  adjustQuantities,
  getPairConfig,
  // writeProxyTickersToFile,
} from './configBuilder/configRead';
import { calculatePairPrices } from './forSDK';
import { mt5Price, getLatestPrice } from './broker/mt5Price';
import { test } from './blockchain/fake';
//import { test } from './blockchain/open';
//
async function bullExample(): Promise<void> {
  test();
}

bullExample();
