
//Prisma Database Client (singleton)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple connection test
prisma.$connect()
  .then(() => {
    console.log('[INFO] Database connected successfully');
  })
  .catch((error) => {
    console.error('[ERROR] Failed to connect to database:', error.message);
  });

export default prisma;