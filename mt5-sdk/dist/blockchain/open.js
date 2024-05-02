"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowance = exports.allowance = exports.getBalance = exports.deposit = exports.getMintFUSD = exports.mintFUSD = void 0;
const init_1 = require("../utils/init");
const config_1 = require("../config");
const blockchain_client_1 = require("@pionerfriends/blockchain-client");
const viem_1 = require("viem");
async function mintFUSD(amount, accountId, chainId) {
    const { request } = await init_1.web3Client.simulateContract({
        address: init_1.fakeUSDContract[chainId],
        abi: blockchain_client_1.FakeUSD.abi,
        functionName: 'mint',
        args: [amount],
        account: init_1.accounts[accountId],
    });
    const hash = await init_1.wallets[accountId].writeContract(request);
    return hash;
}
exports.mintFUSD = mintFUSD;
async function getMintFUSD(accountId, chainId) {
    const balance = await init_1.web3Client.readContract({
        address: init_1.fakeUSDContract[chainId],
        abi: blockchain_client_1.FakeUSD.abi,
        functionName: 'balanceOf',
        args: [config_1.config.publicKeys?.split(',')[accountId]],
    });
    return balance;
}
exports.getMintFUSD = getMintFUSD;
async function deposit(amount, accountId, chainId) {
    const { request } = await init_1.web3Client.simulateContract({
        address: init_1.pionerV1ComplianceContract[chainId],
        abi: blockchain_client_1.PionerV1Compliance.abi,
        functionName: 'deposit',
        args: [
            amount,
            (0, viem_1.parseUnits)('1', 0),
            config_1.config.publicKeys?.split(',')[accountId],
        ],
        account: init_1.accounts[accountId],
    });
    const hash = await init_1.wallets[accountId].writeContract(request);
    return hash;
}
exports.deposit = deposit;
async function getBalance(accountId, chainId) {
    const balance = await init_1.web3Client.readContract({
        address: init_1.pionerV1Contract[chainId],
        abi: blockchain_client_1.PionerV1.abi,
        functionName: 'getBalances',
        args: [config_1.config.publicKeys?.split(',')[accountId]],
    });
    return balance;
}
exports.getBalance = getBalance;
async function allowance(amount, accountId, chainId) {
    init_1.logger.info('address', init_1.pionerV1ComplianceContract[chainId]);
    const contract = await init_1.pionerV1ComplianceContract[chainId];
    const { request } = await init_1.web3Client.simulateContract({
        address: init_1.fakeUSDContract[chainId],
        abi: blockchain_client_1.FakeUSD.abi,
        functionName: 'approve',
        args: [init_1.pionerV1ComplianceContract[chainId], amount],
        account: init_1.accounts[accountId],
    });
    const hash = await init_1.wallets[accountId].writeContract(request);
    return hash;
}
exports.allowance = allowance;
async function getAllowance(accountId, chainId) {
    const allowanceAmount = await init_1.web3Client.readContract({
        address: init_1.fakeUSDContract[chainId],
        abi: blockchain_client_1.FakeUSD.abi,
        functionName: 'allowance',
        args: [
            config_1.config.publicKeys?.split(',')[accountId],
            init_1.pionerV1ComplianceContract[chainId],
        ],
    });
    return allowanceAmount;
}
exports.getAllowance = getAllowance;
