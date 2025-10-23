//grants.service - handles grant operations

import prisma from '../prisma';
import { logger } from '../utils/logger';

//get all grants for a user
export async function getUserGrants(userId: number) {
  logger.debug('Fetching grants for user', { userId });

  const userGrants = await prisma.userGrant.findMany({
    where: { userId },
    include: {
      grant: true,
    },
  });

  //return just the grants
  return userGrants.map((ug) => ug.grant);
}

//get detailed information about a specific grant
export async function getGrantDetails(grantId: number, userId: number) {
  logger.debug('Fetching grant details', { grantId, userId });

  //check if user has access to grant
  const userGrant = await prisma.userGrant.findFirst({
    where: {
      userId,
      grantId,
    },
  });

  if (!userGrant) {
    throw new Error('Access denied');
  }

  //get grant
  const grant = await prisma.grant.findUnique({
    where: { id: grantId },
  });

  if (!grant) {
    throw new Error('Grant not found');
  }

  return grant;
}

//check if user has access to a grant -helper function used by other services
export async function checkGrantAccess(grantId: number, userId: number): Promise<boolean> {
  const userGrant = await prisma.userGrant.findFirst({
    where: {
      userId,
      grantId,
    },
  });

  return !!userGrant;
}