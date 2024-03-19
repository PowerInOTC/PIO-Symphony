export const config = {
  fastApiHost: process.env.FAST_API_HOST || '127.0.0.1',
  fastApiPort: process.env.FAST_API_PORT || '8000',
  bullmqRedisHost: process.env.BULLMQ_REDIS_HOST || '127.0.0.1',
  bullmqRedisPort: parseInt(process.env.BULLMQ_REDIS_PORT || '6379'),
  bullmqRedisPassword: process.env.BULLMQ_REDIS_PASSWORD || '',
  proxyVars: process.env.PROXY_VARS || '',
};
