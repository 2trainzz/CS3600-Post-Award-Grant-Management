/**
 * Spending Service
 * 
 * Handles spending request business logic:
 * - Creating spending requests
 * - Fetching user's requests
 * - Fetching grant requests
 * - Updating request status
 * - Linking rules and fringe rates
 */

import prisma from '../prisma';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import { verifyGrantAccess } from './grants.service';

/**
 * Data for creating a spending request
 */
interface CreateSpendingRequestData {
  grantId: number;
  amount: number;
  category: string;
  description: string;
  ruleIds?: number[];
  fringeRateIds?: number[];
}

/**
 * Create a new spending request
 * Links user, grant, and spending request together
 * Optionally links rules and fringe rates
 * 
 * @param data - Spending request data
 * @param userId - ID of user creating the request
 * @returns Created spending request
 */
export async function createSpendingRequest(
  data: CreateSpendingRequestData,
  userId: number
) {
  logger.info('Creating spending request', { 
    userId, 
    grantId: data.grantId,
    amount: data.amount 
  });

  // Verify user has access to the grant
  await verifyGrantAccess(data.grantId, userId);

  // Verify grant has sufficient funds
  const grant = await prisma.grant.findUnique({
    where: { id: data.grantId },
  });

  if (!grant) {
    throw new NotFoundError('Grant not found');
  }

  // Check if requested amount exceeds available balance
  if (Number(grant.remainingAmount) < data.amount) {
    throw new BadRequestError(
      `Insufficient grant balance. Available: $${grant.remainingAmount}, Requested: $${data.amount}`
    );
  }

  // Check category-specific balances
  if (data.category === 'students' && Number(grant.studentBalance) < data.amount) {
    throw new BadRequestError(
      `Insufficient student balance. Available: $${grant.studentBalance}, Requested: $${data.amount}`
    );
  }

  if (data.category === 'travel' && Number(grant.travelBalance) < data.amount) {
    throw new BadRequestError(
      `Insufficient travel balance. Available: $${grant.travelBalance}, Requested: $${data.amount}`
    );
  }

  // Create spending request and relationships in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the spending request
    const spendingRequest = await tx.spendingRequest.create({
      data: {
        amount: data.amount,
        category: data.category,
        description: data.description,
        status: 'pending',
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

    // Link rules and fringe rates if provided
    if (data.ruleIds && data.fringeRateIds) {
      for (const ruleId of data.ruleIds) {
        for (const fringeRateId of data.fringeRateIds) {
          await tx.requestRuleFringe.create({
            data: {
              spendingRequestId: spendingRequest.id,
              ruleId,
              fringeRateId,
              appliedAmount: data.amount,
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
 * Returns requests the user created or is involved with
 * 
 * @param userId - User ID
 * @returns Array of spending requests with grant info
 */
export async function getUserSpendingRequests(userId: number) {
  logger.debug('Fetching spending requests for user', { userId });

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

  // Group by spending request to show all users involved
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
 * Get detailed information about a specific spending request
 * Verifies user has access to the request
 * 
 * @param requestId - Spending request ID
 * @param userId - User ID
 * @returns Spending request with full details
 */
export async function getSpendingRequestDetails(requestId: number, userId: number) {
  logger.debug('Fetching spending request details', { requestId, userId });

  // Check if user has access to this request
  const userGrantRequest = await prisma.userGrantRequest.findFirst({
    where: {
      userId,
      spendingRequestId: requestId,
    },
  });

  if (!userGrantRequest) {
    throw new ForbiddenError('Access denied to this spending request');
  }

  // Fetch full request details
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
              role: true,
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

  if (!spendingRequest) {
    throw new NotFoundError('Spending request not found');
  }

  return spendingRequest;
}

/**
 * Update spending request status (approve/reject)
 * Only grant owners or admins can update status
 * 
 * @param requestId - Spending request ID
 * @param status - New status ('approved', 'rejected', 'completed')
 * @param reviewNotes - Optional review notes
 * @param reviewerId - ID of user performing the review
 */
export async function updateSpendingRequestStatus(
  requestId: number,
  status: string,
  reviewNotes: string | undefined,
  reviewerId: number
) {
  logger.info('Updating spending request status', { 
    requestId, 
    status, 
    reviewerId 
  });

  // Get the spending request to find associated grant
  const userGrantRequest = await prisma.userGrantRequest.findFirst({
    where: { spendingRequestId: requestId },
    include: {
      grant: true,
      spendingRequest: true,
    },
  });

  if (!userGrantRequest) {
    throw new NotFoundError('Spending request not found');
  }

  // Verify reviewer has owner/admin role on the grant
  const reviewerGrant = await prisma.userGrant.findFirst({
    where: {
      userId: reviewerId,
      grantId: userGrantRequest.grantId,
    },
  });

  if (!reviewerGrant || !['owner', 'admin'].includes(reviewerGrant.role)) {
    throw new ForbiddenError('Only grant owners and admins can review requests');
  }

  // Update the spending request in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.spendingRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewDate: new Date(),
        reviewedBy: reviewerId,
        reviewNotes,
      },
    });

    // If approved, deduct from grant balances
    if (status === 'approved') {
      const amount = Number(userGrantRequest.spendingRequest.amount);
      const category = userGrantRequest.spendingRequest.category;

      await tx.grant.update({
        where: { id: userGrantRequest.grantId },
        data: {
          remainingAmount: {
            decrement: amount,
          },
          ...(category === 'students' && {
            studentBalance: {
              decrement: amount,
            },
          }),
          ...(category === 'travel' && {
            travelBalance: {
              decrement: amount,
            },
          }),
        },
      });
    }

    // Add reviewer to the spending request relationships
    const existingReviewer = await tx.userGrantRequest.findFirst({
      where: {
        userId: reviewerId,
        grantId: userGrantRequest.grantId,
        spendingRequestId: requestId,
      },
    });

    if (!existingReviewer) {
      await tx.userGrantRequest.create({
        data: {
          userId: reviewerId,
          grantId: userGrantRequest.grantId,
          spendingRequestId: requestId,
          role: 'approver',
        },
      });
    }

    return updated;
  });

  logger.info('Spending request status updated', { 
    requestId, 
    status 
  });

  return result;
}

/**
 * Add rules and fringe rates to an existing spending request
 * 
 * @param requestId - Spending request ID
 * @param ruleId - Rule ID
 * @param fringeRateId - Fringe rate ID
 * @param appliedAmount - Amount this rule/rate applies to
 * @param notes - Optional notes
 * @param userId - User performing the action
 */
export async function addRuleFringeToRequest(
  requestId: number,
  ruleId: number,
  fringeRateId: number,
  appliedAmount: number | undefined,
  notes: string | undefined,
  userId: number
) {
  // Verify user has access to this request
  const userGrantRequest = await prisma.userGrantRequest.findFirst({
    where: {
      userId,
      spendingRequestId: requestId,
    },
  });

  if (!userGrantRequest) {
    throw new ForbiddenError('Access denied to this spending request');
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

  logger.info('Rule and fringe rate added to request', { 
    requestId, 
    ruleId, 
    fringeRateId 
  });

  return requestRuleFringe;
} 

/**
 * Get all spending requests for a specific grant
 * Verifies user has access to the grant
 * 
 * @param grantId - Grant ID
 * @param userId - User ID
 * @returns Array of spending requests for the grant
 */
export async function getGrantSpendingRequests(grantId: number, userId: number) {
  logger.debug('Fetching spending requests for grant', { grantId, userId });

  // Verify user has access to this grant
  await verifyGrantAccess(grantId, userId);

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
          username: true
        }
    }
}
  })
}