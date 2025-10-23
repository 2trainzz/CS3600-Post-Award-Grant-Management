/**
 * Rules and Fringe Rates Service
 * 
 * Simple service to fetch rules and fringe rates
 * (These are used by the AI parsing and spending requests)
 */

import prisma from '../prisma';
import { logger } from '../utils/logger';

/**
 * Get all rules
 */
export async function getAllRules() {
  logger.debug('Fetching all rules');

  return prisma.rule.findMany({
    orderBy: {
      ruleType: 'asc',
    },
  });
}

/**
 * Get all fringe rates
 */
export async function getAllFringeRates() {
  logger.debug('Fetching all fringe rates');

  return prisma.fringeRate.findMany({
    orderBy: {
      description: 'asc',
    },
  });
}