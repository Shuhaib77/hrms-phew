import pino from 'pino';
import { config } from './index.js';

const transport = config.nodeEnv === 'development'
  ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
  : undefined;

export const logger = pino({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  transport,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
});
