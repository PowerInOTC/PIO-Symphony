"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEtherListener = void 0;
const bullmq_1 = require("./bullmq");
const startEtherListener = async () => {
    try {
        // Simulating Ether events with fake data
        setInterval(async () => {
            const etherData = {
                id: Math.floor(Math.random() * 1000),
                amount: Math.random() * 10,
                from: `0x${Math.random().toString(16).slice(2, 10)}`,
                to: `0x${Math.random().toString(16).slice(2, 10)}`,
            };
            await bullmq_1.EtherQueue.add('processEther', etherData);
            console.log(`Ether job added to the queue: ${JSON.stringify(etherData)}`);
        }, 3000);
    }
    catch (error) {
        console.error('Error in Ether listener:', error);
    }
};
exports.startEtherListener = startEtherListener;
