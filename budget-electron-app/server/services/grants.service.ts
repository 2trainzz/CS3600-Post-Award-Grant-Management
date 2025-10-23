/**
 * Grants Service
 * 
 * Handles grant management business logic:
 * - Fetching user's grants
 * - Getting grant details
 * - Checking user access to grants
 * - Grant CRUD operations (for admins)
 */

import prisma from '../prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Get all grants for a user
 * Returns grants the user has access to via UserGrant relationship
 * 
 * @param userId - User ID
 * @returns Array of grants with user's role on each grant
 */
export async function getUserGrants(userId: number) {
  logger.debug('Fetching grants for user', { userId });

  const userGrants = await prisma.userGrant.findMany({
    where: { userId },
    include: {
      grant: true,
    },
    orderBy: {
      grant: {
        startDate: 'desc',
      },
    },
  });

  // Return grants with user's role
  return userGrants.map((ug) => ({
    ...ug.grant,
    userRole: ug.role, // Include user's role on this grant
  }));
}

/**
 * Get detailed information about a specific grant
 * Verifies user has access to the grant
 * 
 * @param grantId - Grant ID
 * @param userId - User ID
 * @returns Grant details with relationships
 * @throws ForbiddenError if user doesn't have access
 * @throws NotFoundError if grant doesn't exist
 */
export async function getGrantDetails(grantId: number, userId: number) {
  logger.debug('Fetching grant details', { grantId, userId });

  // Check if user has access to this grant
  const userGrant = await prisma.userGrant.findFirst({
    where: {
      userId,
      grantId,
    },
  });

  if (!userGrant) {
    throw new ForbiddenError('You do not have access to this grant');
  }

  // Fetch grant with detailed information
  const grant = await prisma.grant.findUnique({
    where: { id: grantId },
    include: {
      // Include all users with access to this grant
      userGrants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!grant) {
    throw new NotFoundError('Grant not found');
  }

  return {
    ...grant,
    userRole: userGrant.role, // Current user's role on this grant
  };
}

/**
 * Check if user has access to a grant
 * Utility function used by other services
 * 
 * @param grantId - Grant ID
 * @param userId - User ID
 * @returns true if user has access
 * @throws ForbiddenError if user doesn't have access
 */
export async function verifyGrantAccess(
  grantId: number,
  userId: number
): Promise<void> {
  const userGrant = await prisma.userGrant.findFirst({
    where: {
      userId,
      grantId,
    },
  });

  if (!userGrant) {
    throw new ForbiddenError('Access denied to this grant');
  }
}

/**
 * Get user's role on a specific grant
 * 
 * @param grantId - Grant ID
 * @param userId - User ID
 * @returns User's role ('owner', 'admin', 'member', 'viewer')
 * @throws ForbiddenError if user doesn't have access
 */
export async function getUserGrantRole(
  grantId: number,
  userId: number
): Promise<string> {
  const userGrant = await prisma.userGrant.findFirst({
    where: {
      userId,
      grantId,
    },
    select: {
      role: true,
    },
  });

  if (!userGrant) {
    throw new ForbiddenError('Access denied to this grant');
  }

  return userGrant.role;
}

/**
 * Get all rules (global and grant-specific)
 * 
 * @returns All active rules
 */
export async function getAllRules() {
  return prisma.rule.findMany({
    orderBy: {
      ruleType: 'asc',
    },
  });
}

/**
 * Get all fringe rates
 * 
 * @returns All fringe rates
 */
export async function getAllFringeRates() {
  return prisma.fringeRate.findMany({
    orderBy: {
      description: 'asc',
    },
  });
}

/**
 * Create a new grant (admin only)
 * 
 * @param data - Grant creation data
 * @param creatorUserId - ID of user creating the grant
 * @returns Created grant
 */
export async function createGrant(data: any, creatorUserId: number) {
  logger.info('Creating new grant', { 
    grantNumber: data.grantNumber, 
    creatorUserId 
  });

  // Create grant and link creator as owner in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the grant
    const grant = await tx.grant.create({
      data: {
        grantNumber: data.grantNumber,
        grantName: data.grantName,
        totalAmount: data.totalAmount,
        remainingAmount: data.totalAmount, // Initially equals total
        studentBalance: data.studentBalance,
        travelBalance: data.travelBalance,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: 'active',
        description: data.description,
      },
    });

    // Link creator as owner
    await tx.userGrant.create({
      data: {
        userId: creatorUserId,
        grantId: grant.id,
        role: 'owner',
      },
    });

    return grant;
  });

  logger.info('Grant created successfully', { grantId: result.id });
  return result;
}

/**
 * Add a user to a grant
 * 
 * @param grantId - Grant ID
 * @param targetUserId - ID of user to add
 * @param role - Role to assign ('owner', 'admin', 'member', 'viewer')
 * @param requestorUserId - ID of user making the request
 * @throws ForbiddenError if requestor doesn't have owner/admin role
 */
export async function addUserToGrant(
  grantId: number,
  targetUserId: number,
  role: string,
  requestorUserId: number
) {
  // Verify requestor has owner or admin role
  const requestorGrant = await prisma.userGrant.findFirst({
    where: {
      userId: requestorUserId,
      grantId,
    },
  });

  if (!requestorGrant || !['owner', 'admin'].includes(requestorGrant.role)) {
    throw new ForbiddenError('Only grant owners and admins can add users');
  }

  // Add the user
  const userGrant = await prisma.userGrant.create({
    data: {
      userId: targetUserId,
      grantId,
      role,
    },
  });

  logger.info('User added to grant', { 
    grantId, 
    userId: targetUserId, 
    role 
  });

  return userGrant;
}