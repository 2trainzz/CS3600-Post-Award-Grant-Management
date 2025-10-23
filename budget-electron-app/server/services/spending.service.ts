//spending.service - handles spending request operations

import prisma from '../prisma';
import { logger } from '../utils/logger';
import { checkGrantAccess } from './grants.service';

//create new spending request
export async function createSpendingRequest(data: {
  grantId: number;
  amount: number;
  category: string;
  description: string;
  ruleIds?: number[];
  fringeRateIds?: number[];
}, userId: number) {
  logger.info('Creating spending request', { userId, grantId: data.grantId });

  //check if user has access to this grant
  const hasAccess = await checkGrantAccess(data.grantId, userId);
  if (!hasAccess) {
    throw new Error('Access denied to this grant');
  }

  //create spending request and link user/grant in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the spending request
    const spendingRequest = await tx.spendingRequest.create({
      data: {
        amount: data.amount,
        category: data.category,
        description: data.description,
      },
    });

    //link user, grant, and spending request
    await tx.userGrantRequest.create({
      data: {
        userId,
        grantId: data.grantId,
        spendingRequestId: spendingRequest.id,
        role: 'creator',
      },
    });

    //link rules and fringe rates if provided
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

//get all spending requests for a user
export async function getUserSpendingRequests(userId: number) {
  logger.debug('Fetching spending requests for user', { userId });

  //find all spending requests where user is involved
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

  //transform data for frontend
  const requests = userGrantRequests.map((ugr) => ({
    ...ugr.spendingRequest,
    grant: ugr.grant,
    userRole: ugr.role,
    users: [ugr.user],
  }));

  return requests;
}

//get spending requests for a specific grant
export async function getGrantSpendingRequests(grantId: number, userId: number) {
  logger.debug('Fetching spending requests for grant', { grantId, userId });

  //check if user has access to this grant
  const hasAccess = await checkGrantAccess(grantId, userId);
  if (!hasAccess) {
    throw new Error('Access denied');
  }

  //find all spending requests for this grant
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

  //group by spending request to show all users involved
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

//get specific spending request details
export async function getSpendingRequestDetails(requestId: number, userId: number) {
  logger.debug('Fetching spending request details', { requestId, userId });

  //check if user has access to this request
  const userGrantRequest = await prisma.userGrantRequest.findFirst({
    where: {
      userId,
      spendingRequestId: requestId,
    },
  });

  if (!userGrantRequest) {
    throw new Error('Access denied to this request');
  }

  //get full spending request details
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

//add user to an existing spending request
export async function addUserToSpendingRequest(
  requestId: number,
  targetUserId: number,
  grantId: number,
  role: string,
  currentUserId: number
) {
  //check if current user has access to this request
  const existingAccess = await prisma.userGrantRequest.findFirst({
    where: {
      userId: currentUserId,
      spendingRequestId: requestId,
    },
  });

  if (!existingAccess) {
    throw new Error('Access denied');
  }

  //add new user to the spending request
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

//link rules and fringe rates to a spending request
export async function addRuleFringeToRequest(
  requestId: number,
  ruleId: number,
  fringeRateId: number,
  appliedAmount: number | undefined,
  notes: string | undefined,
  userId: number
) {
  //check if user has access to this request
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