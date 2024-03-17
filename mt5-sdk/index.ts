

import dotenv from 'dotenv';
import { ethers } from 'ethers';
dotenv.config();

import {RfqReq, RfqResp} from '@pionerfriends/api-client';

import { getPayloadAndLogin } from '@pionerfriends/api-client';
import { testSendRfqs } from './utils/bullmq/test';
import { setupBullMQ } from './utils/bullmq/bullRFQ';

async function main() {
  const rpcURL = 'https://rpc.sonic.fantom.network/';
  const rpcKey = '';
  const provider: ethers.Provider = new ethers.JsonRpcProvider(
    `${rpcURL}${rpcKey}`,
  );
  const wallet = new ethers.Wallet(
    'YOUR-PRIVATE-KEY',
    provider,
  );

  const token = await getPayloadAndLogin(wallet);

  if (!wallet || !token) {
    console.log('login failed');
    return;
  }

  await setupBullMQ(token);
  await testSendRfqs();

}

main()
