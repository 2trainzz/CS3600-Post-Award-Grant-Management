/**
 * Spending Requests Service
 * 
 * Extracted from your original server.ts
 * Handles spending request operations - SAME LOGIC, just organized
 */

import prisma from '../prisma';
import { logger } from '../utils/logger';
import { checkGrantAccess } from './grants.service';

/**
 * Create a new spending request
 * (Same logic as your original /api/spending-requests POST route)
 */
export async function createSpendingRequest(data: {
  grantId: number;
  amount: number;
  category: string;
  description: string;
  ruleIds?: number[];
  fringeRateIds?: number[];
}, userId: number) {
  logger.info('Creating spending request', { userId, grantId: data.grantId });

  // Check if user has access to this grant (same as before)
  const hasAccess = await checkGrantAccess(data.grantId, userId);
  if (!hasAccess) {
    throw new Error('Access denied to this grant');
  }

  // Create spending request and link user/grant in a transaction (same as before)
  const result = await prisma.$transaction(async (tx) => {
    // Create the spending request
    const spendingRequest = await tx.spendingRequest.create({
      data: {
        amount: data.amount,
        category: data.category,
        description: data.description,
      },
    });

    // Link user, grant, and spending request
    await tx.userGrantRequest.create({
      data: {
        userId,
        grantId: data.grantId,
        spendingRequestId: spendingRequest.id,
        role: 'creator',
      },
    });

    // Link rules and fringe rates if provided (same as before)
    if (data.ruleIds && data.fringeRateIds && data.ruleIds.length > 0 && data.fringeRateIds.length > 0) {
      for (const ruleId of data.ruleIds) {
        for (const fringeRateId of data.fringeRateIds) {
          await tx.requestRuleFringe.create({
            data: {
              spendingRequestId: spendingRequest.id,
              ruleId,
              fringeRateId,
            },
          });
        }
      }
    }

    return spendingRequest;
  });

  logger.info('Spending request created', { requestId: result.id });
  return result;
}

/**
 * Get all spending requests for a user
 * (Same logic as your original /api/spending-requests GET route)
 */
export async function getUserSpendingRequests(userId: number) {
  logger.debug('Fetching spending requests for user', { userId });

  // Find all spending requests where user is involved (same as before)
  const userGrantRequests = await prisma.userGrantRequest.findMany({
    where: { userId },
    include: {
      spendingRequest: {
        include: {
          requestRuleFringes: {
            include: {
              rule: true,
              fringeRate: true,
            },
          },
        },
      },
      grant: true,
      user: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Transform data for easier frontend consumption (same as before)
  const requests = userGrantRequests.map((ugr) => ({
    ...ugr.spendingRequest,
    grant: ugr.grant,
    userRole: ugr.role,
    users: [ugr.user],
  }));

  return requests;
}

/**
 * Get spending requests for a specific grant
 * (Same logic as your original /api/grants/:id/spending-requests route)
 */
export async function getGrantSpendingRequests(grantId: number, userId: number) {
  logger.debug('Fetching spending requests for grant', { grantId, userId });

  // Check if user has access to this grant (same as before)
  const hasAccess = await checkGrantAccess(grantId, userId);
  if (!hasAccess) {
    throw new Error('Access denied');
  }

  // Find all spending requests for this grant (same as before)
  const userGrantRequests = await prisma.userGrantRequest.findMany({
    where: { grantId },
    include: {
      spendingRequest: {
        include: {
          requestRuleFringes: {
            include: {
              rule: true,
              fringeRate: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Group by spending request to show all users involved (same as before)
  const requestMap = new Map();

  for (const ugr of userGrantRequests) {
    const requestId = ugr.spendingRequest.id;
    if (!requestMap.has(requestId)) {
      requestMap.set(requestId, {
        ...ugr.spendingRequest,
        users: [],
      });
    }
    requestMap.get(requestId).users.push({
      ...ugr.user,
      role: ugr.role,
    });
  }

  return Array.from(requestMap.values());
}

/**
 * Get specific spending request details
 * (Same logic as your original /api/spending-requests/:id route)
 */
export async function getSpendingRequestDetails(requestId: number, userId: number) {
  logger.debug('Fetching spending request details', { requestId, userId });

  // Check if user has access to this request (same as before)
  const userGrantRequest = await prisma.userGrantRequest.findFirst({
    where: {
      userId,
      spendingRequestId: requestId,
    },
  });

  if (!userGrantRequest) {
    throw new Error('Access denied to this request');
  }

  // Get full spending request details (same as before)
  const spendingRequest = await prisma.spendingRequest.findUnique({
    where: { id: requestId },
    include: {
      userGrantRequests: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          grant: true,
        },
      },
      requestRuleFringes: {
        include: {
          rule: true,
          fringeRate: true,
        },
      },
    },
  });

  return spendingRequest;
}

/**
 * Add user to an existing spending request
 * (Same logic as your original /api/spending-requests/:id/users route)
 */
export async function addUserToSpendingRequest(
  requestId: number,
  targetUserId: number,
  grantId: number,
  role: string,
  currentUserId: number
) {
  // Check if current user has access to this request (same as before)
  const existingAccess = await prisma.userGrantRequest.findFirst({
    where: {
      userId: currentUserId,
      spendingRequestId: requestId,
    },
  });

  if (!existingAccess) {
    throw new Error('Access denied');
  }

  // Add new user to the spending request (same as before)
  const userGrantRequest = await prisma.userGrantRequest.create({
    data: {
      userId: targetUserId,
      grantId,
      spendingRequestId: requestId,
      role: role || 'reviewer',
    },
  });

  logger.info('User added to spending request', { requestId, userId: targetUserId });
  return userGrantRequest;
}

/**
 * Link rules and fringe rates to a spending request
 * (Same logic as your original /api/spending-requests/:id/rules-fringes route)
 */
export async function addRuleFringeToRequest(
  requestId: number,
  ruleId: number,
  fringeRateId: number,
  appliedAmount: number | undefined,
  notes: string | undefined,
  userId: number
) {
  // Check if user has access to this request (same as before)
  const userGrantRequest = await prisma.userGrantRequest.findFirst({
    where: {
      userId,
      spendingRequestId: requestId,
    },
  });

  if (!userGrantRequest) {
    throw new Error('Access denied');
  }

  const requestRuleFringe = await prisma.requestRuleFringe.create({
    data: {
      spendingRequestId: requestId,
      ruleId,
      fringeRateId,
      appliedAmount,
      notes,
    },
  });

  logger.info('Rule and fringe rate added to request', { requestId, ruleId, fringeRateId });
  return requestRuleFringe;
}