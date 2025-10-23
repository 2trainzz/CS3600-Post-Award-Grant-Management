//rules.service -simple service to fetch rules and fringe rates
//used by the AI parsing and spending requests

import prisma from '../prisma';
import { logger } from '../utils/logger';

//get all rules
export async function getAllRules() {
  logger.debug('Fetching all rules');

  return prisma.rule.findMany({
    orderBy: {
      ruleType: 'asc',
    },
  });
}

//get all fringe rates
export async function getAllFringeRates() {
  logger.debug('Fetching all fringe rates');

  return prisma.fringeRate.findMany({
    orderBy: {
      description: 'asc',
    },
  });
}