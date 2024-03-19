"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulShutdown = exports.EtherWorker = exports.RFQWorker = exports.EtherQueue = exports.RFQQueue = void 0;
const bullmq_1 = require("bullmq");
const rfqJob_1 = require("./rfqJob");
const etherJob_1 = require("./etherJob");
const connection = {
    host: 'localhost',
    port: 6379,
};
exports.RFQQueue = new bullmq_1.Queue('RFQQueue', { connection });
exports.EtherQueue = new bullmq_1.Queue('EtherQueue', { connection });
exports.RFQWorker = new bullmq_1.Worker('RFQQueue', rfqJob_1.processRFQ, { connection });
exports.EtherWorker = new bullmq_1.Worker('EtherQueue', etherJob_1.processEther, {
    connection,
});
const gracefulShutdown = async () => {
    await exports.RFQWorker.close();
    await exports.EtherWorker.close();
    console.log('Workers shut down gracefully');
};
exports.gracefulShutdown = gracefulShutdown;
