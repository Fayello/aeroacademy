type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatMessage(level: LogLevel, context: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
}

function createLogger(context: string) {
  return {
    info: (message: string, ...args: any[]) => console.log(formatMessage('info', context, message), ...args),
    warn: (message: string, ...args: any[]) => console.warn(formatMessage('warn', context, message), ...args),
    error: (message: string, ...args: any[]) => console.error(formatMessage('error', context, message), ...args),
    debug: (message: string, ...args: any[]) => {
      if (process.env.LOG_LEVEL === 'debug') {
        console.log(formatMessage('debug', context, message), ...args);
      }
    },
  };
}

export default createLogger;
