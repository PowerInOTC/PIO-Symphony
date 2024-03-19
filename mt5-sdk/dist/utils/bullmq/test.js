"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_client_1 = require("@pionerfriends/api-client");
const ethers_1 = require("ethers");
async function testSendRfqs() {
    const rpcURL = 'https://rpc.sonic.fantom.network/';
    const rpcKey = '';
    const provider = new ethers_1.ethers.JsonRpcProvider(`${rpcURL}${rpcKey}`);
    const wallet = new ethers_1.ethers.Wallet('YOUR-PRIVATE-KEY', provider);
    const token = await (0, api_client_1.getPayloadAndLogin)(wallet);
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
        await (0, api_client_1.sendRfq)(rfq, token);
    }
}
testSendRfqs();
