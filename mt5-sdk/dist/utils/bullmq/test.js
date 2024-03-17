"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSendRfqs = void 0;
const api_client_1 = require("@pionerfriends/api-client");
async function testSendRfqs() {
    const { wallet: wallet, token: token } = await (0, api_client_1.createWalletAndSignIn)();
    if (!wallet || !token) {
        console.log('login failed');
        return;
    }
    const rfq = {
        chainId: 80001,
        expiration: 315360000,
        assetAId: 'crypto.BTC',
        assetBId: 'crypto.ETH',
        sPrice: '99.99',
        sQuantity: '99.99',
        sInterestRate: '9.99',
        sIsPayingApr: true,
        sImA: '9.99',
        sImB: '9.99',
        sDfA: '9.99',
        sDfB: '9.99',
        sExpirationA: 3600,
        sExpirationB: 3600,
        sTimelockA: 3600,
        sTimelockB: 3600,
        lPrice: '99.99',
        lQuantity: '99.99',
        lInterestRate: '9.99',
        lIsPayingApr: true,
        lImA: '9.99',
        lImB: '9.99',
        lDfA: '9.99',
        lDfB: '9.99',
        lExpirationA: 3600,
        lExpirationB: 3600,
        lTimelockA: 3600,
        lTimelockB: 3600,
    };
    for (let i = 0; i < 10; i++) {
        await (0, api_client_1.sendRfq)(rfq, token);
    }
}
exports.testSendRfqs = testSendRfqs;
