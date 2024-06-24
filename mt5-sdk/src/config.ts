const dotenv = require('dotenv');
dotenv.config();

export const config = {
  fastApiHost: process.env.FAST_API_HOST || '127.0.0.1',
  fastApiPort: process.env.FAST_API_PORT || '8000',
  bullmqRedisHost: process.env.BULLMQ_REDIS_HOST || '127.0.0.1',
  bullmqRedisPort: parseInt(process.env.BULLMQ_REDIS_PORT || '6379'),
  bullmqRedisPassword: process.env.BULLMQ_REDIS_PASSWORD || '',
  proxyVars: process.env.PROXY_VARS || '',
  hedgerFee: parseFloat(process.env.HEDGER_FEE || '0.0001'),
  hedgerFundingFee: parseFloat(process.env.HEDGER_FUNDING_FEE || '0.02'),
  maxLeverage: parseInt(process.env.MAX_LEVERAGE || '450'),
  pionX:
    process.env.PION_X ||
    '0x20568a84796e6ade0446adfd2d8c4bba2c798c2af0e8375cc3b734f71b17f5fd',
  pionParity: parseInt(process.env.PION_PARITY || '0'),
  pionPublicOracleAddress: parseInt(
    process.env.PION_PUBLIC_ORACLE_ADDRESS || '0',
  ),
  pionAppId: parseInt(process.env.PION_APP_ID || '0'),
  privateKeys: process.env.PRIVATE_KEYS || '0',
  publicKeys: process.env.PUBLIC_KEYS || '0',

  botToken: process.env.BOT_TOKEN || '0',
  chatId: process.env.CHAT_ID || 'abc',
  activeChainId: process.env.ACTIVE_CHAIN_ID || '4002',
  apiBaseUrl: process.env.API_BASE_URL || '',
  azureMt5AuthToken: process.env.AZURE_MT5_IDENTIFICATION_TOKEN || '',

  hedgerId: Number(process.env.HEDGER_ID) || 0,
  isDevMode: process.env.DEV_MODE || false,
  isPionLive: process.env.IS_PION_LIVE || false,
  verifyHedgerOpenRefreshRate: 20000,
  verifyHedgerCloseRefreshRate: 20000,
  '22RefreshRate': 20000,
  '31RefreshRate': 20000,
  '42RefreshRate': 20000,
};
