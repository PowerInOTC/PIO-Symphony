"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    fastApiHttps: process.env.FAST_API_HTTPS === 'true' || false,
    fastApiHost: process.env.FAST_API_HOST || '127.0.0.1',
    fastApiPort: process.env.FAST_API_PORT || '8000',
    bullmqRedisHost: process.env.BULLMQ_REDIS_HOST || '127.0.0.1',
    bullmqRedisPort: parseInt(process.env.BULLMQ_REDIS_PORT || '6379'),
    bullmqRedisPassword: process.env.BULLMQ_REDIS_PASSWORD || '',
};
