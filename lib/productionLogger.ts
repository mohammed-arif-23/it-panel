// Production-Safe Logging System
interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class ProductionLogger {
  private currentLevel: number;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.currentLevel = this.isProduction ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
  }

  private shouldLog(level: number): boolean {
    return level <= this.currentLevel;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` ${this.safeStringifyArgs(args)}` : '';
    return `[${timestamp}] ${level}: ${message}${formattedArgs}`;
  }

  // Safely stringify log arguments to avoid circular refs and huge payloads
  private safeStringifyArgs(args: any[]): string {
    const seen = new WeakSet();
    const replacer = (_key: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
      if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
      return value;
    };

    try {
      const parts = args.map((arg) => {
        if (typeof arg === 'string') return arg;
        try {
          const str = JSON.stringify(arg, replacer);
          // Cap very long strings
          return str && str.length > 2000 ? str.slice(0, 2000) + '…(truncated)' : str;
        } catch {
          return '[Unserializable]';
        }
      });
      return parts.join(' ');
    } catch {
      return '[Log arguments unavailable]';
    }
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(this.formatMessage('ERROR', message, ...args));
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(this.formatMessage('WARN', message, ...args));
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.info(this.formatMessage('INFO', message, ...args));
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, ...args));
    }
  }

  // Safe logging for sensitive operations
  secureLog(message: string, sensitiveData?: any) {
    if (this.isProduction) {
      // In production, only log the message without sensitive data
      this.info(message);
    } else {
      // In development, log everything
      this.debug(message, sensitiveData);
    }
  }
}

export const logger = new ProductionLogger();

// Note: Do NOT override global console methods to avoid recursion.
// If you need stricter logging in production, configure logger.currentLevel
// via environment or expose helper functions instead of monkey-patching.
