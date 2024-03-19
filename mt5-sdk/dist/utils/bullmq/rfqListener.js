"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRFQListener = void 0;
const bullmq_1 = require("./bullmq");
const startRFQListener = async () => {
    try {
        // Simulating RFQ events with fake data
        setInterval(async () => {
            const rfqData = {
                id: Math.floor(Math.random() * 1000),
                price: Math.random() * 100,
                quantity: Math.floor(Math.random() * 10) + 1,
            };
            await bullmq_1.RFQQueue.add('processRFQ', rfqData);
            console.log(`RFQ job added to the queue: ${JSON.stringify(rfqData)}`);
        }, 5000);
    }
    catch (error) {
        console.error('Error in RFQ listener:', error);
    }
};
exports.startRFQListener = startRFQListener;
