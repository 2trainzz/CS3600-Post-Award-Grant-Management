/**
 * Logger Utility
 * 
 * Simple structured logging utility for the server
 * In production, you might want to use Winston or Pino for more features
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private minLevel: LogLevel;
  private isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV === 'development';
    // In development, log everything. In production, only info and above
    this.minLevel = this.isDev ? LogLevel.DEBUG : LogLevel.INFO;
  }

  /**
   * Format a log message with timestamp and level
   */
  private format(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  /**
   * Log debug messages (development only)
   * Usage: logger.debug('User query executed', { userId: 123 });
   */
  debug(message: string, meta?: any): void {
    if (this.minLevel <= LogLevel.DEBUG) {
      console.log(this.format('DEBUG', message, meta));
    }
  }

  /**
   * Log informational messages
   * Usage: logger.info('Server started', { port: 3001 });
   */
  info(message: string, meta?: any): void {
    if (this.minLevel <= LogLevel.INFO) {
      console.log(this.format('INFO', message, meta));
    }
  }

  /**
   * Log warning messages
   * Usage: logger.warn('Rate limit approaching', { userId: 123 });
   */
  warn(message: string, meta?: any): void {
    if (this.minLevel <= LogLevel.WARN) {
      console.warn(this.format('WARN', message, meta));
    }
  }

  /**
   * Log error messages
   * Usage: logger.error('Database query failed', { error: err.message });
   */
  error(message: string, meta?: any): void {
    if (this.minLevel <= LogLevel.ERROR) {
      console.error(this.format('ERROR', message, meta));
    }
  }

  /**
   * Log HTTP requests
   * Usage: logger.http('GET /api/grants', { userId: 123, duration: 45 });
   */
  http(message: string, meta?: any): void {
    if (this.isDev) {
      console.log(this.format('HTTP', message, meta));
    }
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Express middleware for request logging
 * Usage: app.use(requestLogger);
 */
export function requestLogger(req: any, res: any, next: any): void {
  const start = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl}`;
    
    logger.http(message, {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId || null,
      ip: req.ip,
    });
  });
  
  next();
}