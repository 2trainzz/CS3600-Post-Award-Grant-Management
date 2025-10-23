/*
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
*/

/**
 * Prisma Database Client
 * 
 * Creates and exports a singleton Prisma client instance
 * Handles hot reload in development and connection pooling
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';

/**
 * Extend the global namespace to store Prisma client
 * This prevents multiple instances during hot reload in development
 */
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Create Prisma client with logging configuration
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    // Configure logging based on environment
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn']  // Verbose logging in dev
      : ['error'],                   // Only errors in production
    
    // Optional: Configure error formatting
    errorFormat: 'pretty',
  });
};

/**
 * Use global instance in development to prevent multiple connections
 * In production, create a new instance
 */
const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Handle Prisma client lifecycle events
 */

// Log when connection is established
prisma.$connect()
  .then(() => {
    logger.info('Database connected successfully');
  })
  .catch((error) => {
    logger.error('Failed to connect to database', { error: error.message });
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

/**
 * Optional: Middleware for logging slow queries
 * Uncomment to enable
 */
/*
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  const duration = after - before;
  
  // Log queries that take longer than 1 second
  if (duration > 1000) {
    logger.warn('Slow query detected', {
      model: params.model,
      action: params.action,
      duration: `${duration}ms`,
    });
  }
  
  return result;
});
*/

export default prisma;
