"use strict";
// 1 fetch each second all events
// Put them in the qeueu
// process each
Object.defineProperty(exports, "__esModule", { value: true });
exports.processEther = void 0;
const processEther = async (job) => {
    try {
        const etherData = job.data;
        console.log(`Processing Ether: ${JSON.stringify(etherData)}`);
        // Simulating Ether processing
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log(`Ether processed successfully: ${JSON.stringify(etherData)}`);
    }
    catch (error) {
        console.error('Error processing Ether:', error);
    }
};
exports.processEther = processEther;
