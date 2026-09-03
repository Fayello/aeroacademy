import pino from 'pino';

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const baseLogger = pino({
  level,
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function createLogger(context: string) {
  return {
    info: (message: string, ...args: unknown[]) =>
      baseLogger.info({ context }, message, ...args),
    warn: (message: string, ...args: unknown[]) =>
      baseLogger.warn({ context }, message, ...args),
    error: (message: string, ...args: unknown[]) =>
      baseLogger.error({ context }, message, ...args),
    debug: (message: string, ...args: unknown[]) =>
      baseLogger.debug({ context }, message, ...args),
  };
}

export default createLogger;
