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
import {
  resetRedisData,
  fetchEvents,
  getBalanceByUser,
} from './blockchain/event';
//import { test } from './blockchain/open';
//
async function bullExample(): Promise<void> {
  sendMessage('Tu es le meilleur des devs. Je suis fier de toi');

  resetRedisData();
  fetchEvents();
  getBalanceByUser('0xd0dDF915693f13Cf9B3b69dFF44eE77C901882f8');
}

bullExample();
