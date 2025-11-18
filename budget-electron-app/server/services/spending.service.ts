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
  // AI pre-approval data 
  aiPreApprovalRecommendation?: string;
  aiPreApprovalReasoning?: string;
  aiConfidence?: number;
  aiWarnings?: string[];
}, userId: number) {
  console.log('Backend received data:', data); 
  logger.info('Creating spending request', { userId, grantId: data.grantId });

  //check if user has access to this grant
  const hasAccess = await checkGrantAccess(data.grantId, userId);
  if (!hasAccess) {
    throw new Error('Access denied to this grant');
  }

  //create spending request and link user/grant in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the spending request with AI data
    const spendingRequest = await tx.spendingRequest.create({
      data: {
        amount: data.amount,
        category: data.category,
        description: data.description,
        // Save AI pre-approval data if provided
        aiPreApprovalRecommendation: data.aiPreApprovalRecommendation || null,
        aiPreApprovalReasoning: data.aiPreApprovalReasoning || null,
        aiConfidence: data.aiConfidence || null,
        aiWarnings: data.aiWarnings ? JSON.stringify(data.aiWarnings) : null,
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

//get all spending requests for a user - admin/faculty will get all for their grants, students will only get their own requests
export async function getUserSpendingRequests(userId: number) {
  logger.debug('Fetching spending requests for user', { userId });
  //get role to know which requests to return
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });

  if (user?.role === 'admin' || user?.role === 'faculty') {
    // Find all grants the user has access to
    const userGrants = await prisma.userGrant.findMany({
      where: { userId },
      select: { grantId: true },
    });

    if (userGrants.length === 0) {
      return [];
    }

    // Fetch requests from each grant using the existing function
    const allRequests = [];
    for (const userGrant of userGrants) {
      try {
        const grantRequests = await getGrantSpendingRequests(userGrant.grantId, userId);
        allRequests.push(...grantRequests);
      } catch (error) {
        // Skip grants where access check fails (shouldn't happen, but just in case)
        logger.error('Error fetching grant requests', { 
          grantId: userGrant.grantId, 
          error 
        });
      }
    }

    // Remove duplicate requests (in case same request appears multiple times)
    const uniqueRequests = Array.from(
      new Map(allRequests.map(req => [req.id, req])).values()
    );

    return uniqueRequests;
  }

  // student: find all spending requests where user is involved
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
  const requests = userGrantRequests.map((ugr) => {
    const sr = ugr.spendingRequest;
    return {
      ...sr,
      grant: ugr.grant,
      userRole: ugr.role,
      users: [ugr.user],
      // Parse AI data for frontend
      preApprovalStatus: sr.aiPreApprovalRecommendation ? {
        recommendation: sr.aiPreApprovalRecommendation,
        reasoning: sr.aiPreApprovalReasoning,
        requiresHumanReview: true,
      } : null,
      warnings: sr.aiWarnings ? JSON.parse(sr.aiWarnings) : [],
      confidence: sr.aiConfidence ? parseFloat(sr.aiConfidence.toString()) : null,
    };
  });

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

  //group by spending request to show all users involved
  const requestMap = new Map();

  for (const ugr of userGrantRequests) {
    const requestId = ugr.spendingRequest.id;
    if (!requestMap.has(requestId)) {
      const sr = ugr.spendingRequest;
      requestMap.set(requestId, {
        ...sr,
        grant: ugr.grant,
        users: [],
        // Parse AI data for frontend
        preApprovalStatus: sr.aiPreApprovalRecommendation ? {
          recommendation: sr.aiPreApprovalRecommendation,
          reasoning: sr.aiPreApprovalReasoning,
          requiresHumanReview: true,
        } : null,
        warnings: sr.aiWarnings ? JSON.parse(sr.aiWarnings) : [],
        confidence: sr.aiConfidence ? parseFloat(sr.aiConfidence.toString()) : null,
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

  if (!spendingRequest) {
    throw new Error('Spending request not found');
  }

  // Parse AI data for frontend
  return {
    ...spendingRequest,
    preApprovalStatus: spendingRequest.aiPreApprovalRecommendation ? {
      recommendation: spendingRequest.aiPreApprovalRecommendation,
      reasoning: spendingRequest.aiPreApprovalReasoning,
      requiresHumanReview: true,
    } : null,
    warnings: spendingRequest.aiWarnings ? JSON.parse(spendingRequest.aiWarnings) : [],
    confidence: spendingRequest.aiConfidence ? parseFloat(spendingRequest.aiConfidence.toString()) : null,
  };
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

  // Get reviewer info
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerId },
    select: { firstName: true, lastName: true, role: true }
  });

  if (!reviewer) {
    throw new Error('Reviewer not found');
  }

  // Check if reviewer is admin
  if (reviewer.role !== 'admin') {
    throw new Error('Only admins can approve or reject requests');
  }

  // Get current request to access existing notes
  const currentRequest = await prisma.spendingRequest.findUnique({
    where: { id: requestId }
  });

  // Format the new note with timestamp and user info
  const timestamp = new Date().toLocaleString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
  }); 
  const statusAction = status === 'approved' ? 'APPROVED' : 'REJECTED';
  const newNote = reviewNotes 
    ? `${reviewer.firstName} ${reviewer.lastName} (${reviewer.role}) - ${timestamp}: ${statusAction} - ${reviewNotes}`
    : `${reviewer.firstName} ${reviewer.lastName} (${reviewer.role}) - ${timestamp}: ${statusAction} the request.`;
  
  // Append to existing review notes (don't replace!)
  const updatedNotes = currentRequest?.reviewNotes 
    ? `${currentRequest.reviewNotes}\n\n${newNote}`
    : newNote;

  // Update the spending request
  const updatedRequest = await prisma.$transaction(async (tx) => {
    // Update request status
    const updated = await tx.spendingRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewDate: new Date(),
        reviewedBy: reviewerId,
        reviewNotes: updatedNotes,
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

/**
 * Add a comment/review to a spending request (faculty)
 * Doesn't change status, just adds notes for admin to see
 */
export async function addRequestComment(
  requestId: number,
  comment: string,
  userId: number
) {
  logger.info('Adding comment to request', { requestId, userId });

  //get the request to find the grant
  const userGrantRequest = await prisma.userGrantRequest.findFirst({
    where: { spendingRequestId: requestId },
  });

  if (!userGrantRequest) {
    throw new Error('Spending request not found');
  }

  //check user has access to the grant
  const hasAccess = await checkGrantAccess(userGrantRequest.grantId, userId);
  if (!hasAccess) {
    throw new Error('Access denied - you do not have access to this grant');
  }

  //get user info for the comment
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, role: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  //get current request
  const request = await prisma.spendingRequest.findUnique({
    where: { id: requestId }
  });

  //format the new comment with timestamp and user info
  const timestamp = new Date().toLocaleString('en-US',{
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const newComment = `💬 ${user.firstName} ${user.lastName} (${user.role}) - ${timestamp}:\n   ${comment}`;
  
  //append to existing review notes
  const updatedNotes = request?.reviewNotes 
    ? `${request.reviewNotes}\n${newComment}`
    : newComment;

  //update the request
  const updatedRequest = await prisma.spendingRequest.update({
    where: { id: requestId },
    data: { reviewNotes: updatedNotes }
  });

  //add user as reviewer if not already linked
  const existingLink = await prisma.userGrantRequest.findFirst({
    where: {
      userId,
      spendingRequestId: requestId
    }
  });

  if (!existingLink) {
    await prisma.userGrantRequest.create({
      data: {
        userId,
        grantId: userGrantRequest.grantId,
        spendingRequestId: requestId,
        role: 'reviewer'
      }
    });
  }

  logger.info('Comment added to request', { requestId });
  return updatedRequest;
}