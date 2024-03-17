"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBullMQ = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bullmq_1 = require("bullmq");
const config_1 = require("../../config");
const api_client_1 = require("@pionerfriends/api-client");
const rfqQueue = new bullmq_1.Queue('rfq', {
    connection: {
        host: config_1.config.bullmqRedisHost,
        port: config_1.config.bullmqRedisPort,
        password: config_1.config.bullmqRedisPassword,
    },
});
async function setupBullMQ(token) {
    const websocketClient = new api_client_1.RfqWebsocketClient((message) => {
        rfqQueue.add('rfq', message);
    }, (error) => {
        console.error('WebSocket error:', error);
    });
    await websocketClient.startWebSocket(token);
    new bullmq_1.Worker('rfq', async (job) => {
        const data = job.data;
        console.log(`Processing job ${job.id}: ${JSON.stringify(data)}`);
    }, {
        connection: {
            host: config_1.config.bullmqRedisHost,
            port: config_1.config.bullmqRedisPort,
            password: config_1.config.bullmqRedisPassword,
        },
        removeOnComplete: { count: 0 },
        removeOnFail: { count: 0 }
    });
}
exports.setupBullMQ = setupBullMQ;
