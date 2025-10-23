/**
 * Grants Service
 * 
 * Extracted from your original server.ts
 * Handles grant operations - SAME LOGIC, just organized
 */

import prisma from '../prisma';
import { logger } from '../utils/logger';

/**
 * Get all grants for a user
 * (Same logic as your original /api/grants route)
 */
export async function getUserGrants(userId: number) {
  logger.debug('Fetching grants for user', { userId });

  const userGrants = await prisma.userGrant.findMany({
    where: { userId },
    include: {
      grant: true,
    },
  });

  // Return just the grants (same as before)
  return userGrants.map((ug) => ug.grant);
}

/**
 * Get detailed information about a specific grant
 * (Same logic as your original /api/grants/:id route)
 */
export async function getGrantDetails(grantId: number, userId: number) {
  logger.debug('Fetching grant details', { grantId, userId });

  // Check if user has access to this grant (same as before)
  const userGrant = await prisma.userGrant.findFirst({
    where: {
      userId,
      grantId,
    },
  });

  if (!userGrant) {
    throw new Error('Access denied');
  }

  // Fetch grant (same as before)
  const grant = await prisma.grant.findUnique({
    where: { id: grantId },
  });

  if (!grant) {
    throw new Error('Grant not found');
  }

  return grant;
}

/**
 * Check if user has access to a grant
 * Helper function used by other services
 */
export async function checkGrantAccess(grantId: number, userId: number): Promise<boolean> {
  const userGrant = await prisma.userGrant.findFirst({
    where: {
      userId,
      grantId,
    },
  });

  return !!userGrant;
}