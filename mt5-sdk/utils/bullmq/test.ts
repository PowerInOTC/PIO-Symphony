import { getPayloadAndLogin, sendRfq } from '@pionerfriends/api-client';
import { ethers } from 'ethers';

async function testSendRfqs(){
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

  const rfq = {
    chainId: 64165,
    expiration: 100,
    assetAId: 'forex.EURUSD',
    assetBId: 'forex.GBPUSD',
    sPrice: '100',
    sQuantity: '10',
    sInterestRate: '20',
    sIsPayingApr: true,
    sImA: '0.2',
    sImB: '0.2',
    sDfA: '9.99',
    sDfB: '9.99',
    sExpirationA: 3600,
    sExpirationB: 60,
    sTimelockA: 3600,
    sTimelockB: 3600,
    lPrice: '100',
    lQuantity: '10',
    lInterestRate: '20',
    lIsPayingApr: true,
    lImA: '0.29',
    lImB: '0.2',
    lDfA: '0.05',
    lDfB: '0.059',
    lExpirationA: 60,
    lExpirationB: 3600,
    lTimelockA: 3600,
    lTimelockB: 3600,
  };


  for (let i = 0; i < 10; i++) {
    await sendRfq(rfq, token);
  }
}

testSendRfqs();
