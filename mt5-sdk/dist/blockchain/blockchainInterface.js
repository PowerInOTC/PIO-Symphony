"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainInterfaceLib = void 0;
const blockchain_client_1 = require("@pionerfriends/blockchain-client");
const dotenv = __importStar(require("dotenv"));
const ethers_1 = require("ethers");
const fs = __importStar(require("fs"));
const init_1 = require("../utils/init");
dotenv.config();
class BlockchainInterfaceLib {
    constructor() {
        this.interfaces = {};
        this.initInterfaces();
    }
    initInterfaces() {
        const blockchainConfigs = JSON.parse(fs.readFileSync('blockchain.json', 'utf-8'));
        const privateKeys = process.env.PRIVATE_KEYS?.split(',') || [];
        blockchainConfigs.forEach((config) => {
            const provider = new ethers_1.ethers.JsonRpcProvider(`${config.rpcURL}${config.rpcKey}`);
            const privateKey = privateKeys[config.privateKeyIndex];
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const pionerChainId = blockchain_client_1.networks[config.chainKey]
                .pionerChainId;
            init_1.logger.info(`pionerChainId: ${pionerChainId}`);
            const blockchainInterface = new blockchain_client_1.BlockchainInterface(pionerChainId, wallet);
            this.interfaces[config.chainId] = blockchainInterface;
        });
    }
    getInterfaceByIndex(index) {
        const blockchainConfigs = JSON.parse(fs.readFileSync('blockchain.json', 'utf-8'));
        const chainId = blockchainConfigs[index].chainId;
        return this.interfaces[chainId];
    }
    getInterfaceByChainId(chainId) {
        return this.interfaces[chainId];
    }
    forEachInterface(callback) {
        const blockchainConfigs = JSON.parse(fs.readFileSync('blockchain.json', 'utf-8'));
        blockchainConfigs.forEach((config, index) => {
            const blockchainInterface = this.interfaces[config.chainId];
            callback(blockchainInterface, index);
        });
    }
}
const blockchainInterfaceLib = new BlockchainInterfaceLib();
exports.blockchainInterfaceLib = blockchainInterfaceLib;
/* ex
    blockchainInterfaceLib.forEachInterface((blockchainInterface, index) => {
    blockchainInterface.mint(1);
    console.log(`Blockchain Interface ${index}:`);
    console.log('---');
    });

    const interface1 = blockchainInterfaceLib.getInterfaceByIndex(0);

    const interface2 = blockchainInterfaceLib.getInterfaceByChainId(2);
    */
