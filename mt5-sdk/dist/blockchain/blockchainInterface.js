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
class CustomBlockchainInterface extends blockchain_client_1.BlockchainInterface {
    constructor(chainId, wallet) {
        super(chainId, wallet);
        this.chainId = chainId;
    }
}
class BlockchainInterfaceLib {
    constructor(jsonFilePath) {
        this.interfaces = {};
        this.blockchainConfigs = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
        this.initInterfaces();
    }
    initInterfaces() {
        const privateKeys = process.env.PRIVATE_KEYS?.split(',') || [];
        this.blockchainConfigs.forEach((config) => {
            const provider = new ethers_1.ethers.JsonRpcProvider(`${config.rpcURL}${config.rpcKey}`);
            const privateKey = privateKeys[config.privateKeyIndex];
            const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
            const pionerChainId = blockchain_client_1.networks[config.chainKey]
                .pionerChainId;
            init_1.logger.info(`pionerChainId: ${pionerChainId}`);
            const blockchainInterface = new CustomBlockchainInterface(pionerChainId, wallet);
            this.interfaces[config.chainId] = blockchainInterface;
        });
    }
    getInterfaceByIndex(index) {
        const chainId = this.blockchainConfigs[index].chainId;
        return this.interfaces[chainId];
    }
    getInterfaceByChainId(chainId) {
        return this.interfaces[chainId];
    }
    forEachInterface(callback) {
        this.blockchainConfigs.forEach((config, index) => {
            const blockchainInterface = this.interfaces[config.chainId];
            callback(blockchainInterface, index);
        });
    }
}
const blockchainInterfaceLib = new BlockchainInterfaceLib('blockchain.json');
exports.blockchainInterfaceLib = blockchainInterfaceLib;
const interface1 = blockchainInterfaceLib.getInterfaceByIndex(0);
console.log(`Interface 1 Chain ID: ${interface1.chainId}`);
const interface2 = blockchainInterfaceLib.getInterfaceByChainId(2);
console.log(`Interface 2 Chain ID: ${interface2.chainId}`);
