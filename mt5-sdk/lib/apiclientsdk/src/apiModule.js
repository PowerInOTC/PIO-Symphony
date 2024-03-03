"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWalletAndSignIn = exports.getPayloadAndLogin = exports.login = exports.getPayload = exports.logout = exports.sendQuote = exports.getQuotes = exports.getRfqs = exports.sendRfq = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ethers_1 = require("ethers");
const axios_1 = __importDefault(require("axios"));
const config_1 = require("./config");
const logger_1 = __importDefault(require("./utils/logger"));
logger_1.default.setLogLevel(config_1.config.logLevel);
logger_1.default.info('app', 'Starting script');
const protocol = config_1.config.https ? 'https' : 'http';
const serverAddress = config_1.config.serverAddress;
const serverPort = config_1.config.serverPort;
async function sendRfq(rfq, token, timeout = 3000) {
    try {
        const rfqResponse = await axios_1.default.post(`${protocol}://${serverAddress}:${serverPort}/api/v1/submit_rfq`, rfq, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            timeout: timeout
        });
        return rfqResponse;
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('app', error.message);
        }
    }
}
exports.sendRfq = sendRfq;
async function getRfqs(token, start, end, timeout = 3000) {
    try {
        const rfqResponse = await axios_1.default.get(`${protocol}://${serverAddress}:${serverPort}/api/v1/get_rfqs`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: { start: start, end: end },
            timeout: timeout
        });
        return rfqResponse;
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('app', error.message);
        }
    }
}
exports.getRfqs = getRfqs;
async function getQuotes(rfqId, token, start, end, timeout = 3000) {
    try {
        const rfqResponse = await axios_1.default.get(`${protocol}://${serverAddress}:${serverPort}/api/v1/get_quotes`, {
            params: {
                rfqId: rfqId,
                start: start,
                end: end
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
            timeout: timeout
        });
        return rfqResponse;
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('app', error.message);
        }
    }
}
exports.getQuotes = getQuotes;
async function sendQuote(quote, token, timeout = 3000) {
    try {
        const quoteResponse = await axios_1.default.post(`${protocol}://${serverAddress}:${serverPort}/api/v1/submit_quote`, quote, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            timeout: timeout
        });
        return quoteResponse;
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('app', error.message);
        }
    }
}
exports.sendQuote = sendQuote;
async function logout(token, timeout = 3000) {
    try {
        const logoutResponse = await axios_1.default.post(`${protocol}://${serverAddress}:${serverPort}/api/v1/logout`, null, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            timeout: timeout
        });
        return logoutResponse;
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('app', error.message);
        }
    }
}
exports.logout = logout;
async function getPayload(address, timeout = 3000) {
    try {
        const payloadResponse = await axios_1.default.get(`${protocol}://${serverAddress}:${serverPort}/api/v1/payload`, {
            params: { address: address },
        });
        return payloadResponse;
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('app', error.message);
        }
    }
}
exports.getPayload = getPayload;
async function login(uuid, signedMessage) {
    try {
        const loginResponse = await axios_1.default.post(`${protocol}://${serverAddress}:${serverPort}/api/v1/login`, { uuid: uuid, signedMessage: signedMessage });
        return loginResponse;
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('app', error.message);
        }
    }
}
exports.login = login;
async function getPayloadAndLogin(wallet) {
    const address = wallet.address;
    const payloadResponse = await getPayload(address);
    if (!payloadResponse || payloadResponse.status != 200 || !payloadResponse.data.uuid || !payloadResponse.data.message) {
        return null;
    }
    const { uuid, message } = payloadResponse.data;
    const signedMessage = await wallet.signMessage(message);
    const loginResponse = await login(uuid, signedMessage);
    if (!loginResponse || loginResponse.status != 200 || !loginResponse.data.token) {
        return null;
    }
    const token = loginResponse.data.token;
    return token;
}
exports.getPayloadAndLogin = getPayloadAndLogin;
async function createWalletAndSignIn(privateKey) {
    let wallet;
    if (privateKey) {
        //const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/INFURA_API_KEY')
        //wallet = new Wallet(privateKey, provider);
        wallet = new ethers_1.Wallet(privateKey);
    }
    else {
        wallet = ethers_1.Wallet.createRandom();
    }
    const token = await getPayloadAndLogin(wallet);
    if (!token) {
        return { wallet: null, token: null };
    }
    return { wallet: wallet, token: token };
}
exports.createWalletAndSignIn = createWalletAndSignIn;
