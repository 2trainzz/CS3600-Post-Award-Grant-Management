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

    //find rules based on type
    const applicableRules = await tx.rule.findMany({
        where: {
        OR: [
        { ruleType: data.category },   //rules matching the category (travel/students)
        { ruleType: 'general' }        //and all general rules
        ]
    }
    });

    //get fringe rate for this category
    const fringeRate = await tx.fringeRate.findFirst({
    where: {
        description: data.category === 'travel' ? 'travel' : 'employee cost'
    }
    });

    //link each rule and fringe rate to request
    if (fringeRate) {
    for (const rule of applicableRules) {
        await tx.requestRuleFringe.create({
        data: {
            spendingRequestId: spendingRequest.id,
            ruleId: rule.id,
            fringeRateId: fringeRate.id,
            appliedAmount: data.amount,
            notes: `Auto-linked: ${rule.ruleType} rule applied to ${data.category} request`
        }
        });
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
  // If the user is an admin, return all spending requests across the system
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });

  if (user?.role === 'admin') {
    // Fetch all userGrantRequest rows and group by spending request to include users
    const allUserGrantRequests = await prisma.userGrantRequest.findMany({
      include: {
        spendingRequest: {
          include: {
            requestRuleFringes: {
              include: { rule: true, fringeRate: true },
            },
          },
        },
        grant: true,
        user: {
          select: { id: true, username: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by spendingRequest id
    const map = new Map<number, any>();
    for (const ugr of allUserGrantRequests) {
      const rid = ugr.spendingRequest.id;
      if (!map.has(rid)) {
        map.set(rid, {
          ...ugr.spendingRequest,
          grant: ugr.grant,
          users: [],
        });
      }
      map.get(rid).users.push({ ...ugr.user, role: ugr.role });
    }

    return Array.from(map.values());
  }

  // Non-admin: find all spending requests where user is involved
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

  //create request rule fringe relationship
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

/**
 * Update spending request status (approve/reject)
 * Only admin users with access to the grant can approve
 */
export async function updateRequestStatus(
  requestId: number,
  status: 'approved' | 'rejected',
  reviewNotes: string | undefined,
  reviewerId: number
) {
  logger.info('Updating request status', { requestId, status, reviewerId });

  //get the request to find the grant
  const userGrantRequest = await prisma.userGrantRequest.findFirst({
    where: { spendingRequestId: requestId },
    include: {
      spendingRequest: true,
      grant: true,
    },
  });

  if (!userGrantRequest) {
    throw new Error('Spending request not found');
  }

  //check if reviewer has access to this grant
  const reviewerAccess = await checkGrantAccess(
    userGrantRequest.grantId,
    reviewerId
  );

  //check if reviewer has admin role to review grant
  //check if user has access to this request
  const adminPower = await prisma.user.findUnique({
    where: {
        id: reviewerId,
        role: 'admin',
    },
    select: {
        role: true,
    },
  });

  if (!reviewerAccess || !adminPower) {
    throw new Error('Access denied - you do not have permission to approve this grant');
  }

  // Update the spending request
  const updatedRequest = await prisma.$transaction(async (tx) => {
    // Update request status
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

    // Add reviewer to the request if not already there
    const existingReviewer = await tx.userGrantRequest.findFirst({
      where: {
        userId: reviewerId,
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

  logger.info('Request status updated', { requestId, status });
  return updatedRequest;
}