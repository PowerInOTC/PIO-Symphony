"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const api_client_1 = require("@pionerfriends/api-client");
const test_1 = require("./utils/bullmq/test");
const bullRFQ_1 = require("./utils/bullmq/bullRFQ");
async function main() {
    const { wallet: wallet, token: token } = await (0, api_client_1.createWalletAndSignIn)();
    if (!wallet || !token) {
        console.log('login failed');
        return;
    }
    await (0, test_1.testSendRfqs)();
    await (0, bullRFQ_1.setupBullMQ)(token);
}
main();
