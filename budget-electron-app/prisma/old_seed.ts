import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      department: 'computer science'
    }
  });
  console.log('Created admin user:', admin.username);

  const researcher = await prisma.user.create({
    data: {
      username: 'researcher',
      password: hashedPassword,
      email: 'researcher@example.com',
      firstName: 'Jane',
      lastName: 'Researcher',
      role: 'user',
      department: 'computer science'
    }
  });
  console.log('Created researcher user:', researcher.username);

  // Create test grants
  const grant1 = await prisma.grant.create({
    data: {
      grantNumber: 'NSF-2024-001',
      grantName: 'AI Research Grant',
      totalAmount: 500000,
      remainingAmount: 500000,
      studentBalance: 100000,
      travelBalance: 50000,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'active',
      description: 'Research grant for artificial intelligence projects'
    }
  });
  console.log('Created grant:', grant1.grantNumber);

  const grant2 = await prisma.grant.create({
    data: {
      grantNumber: 'DOE-2024-002',
      grantName: 'Data Science Initiative',
      totalAmount: 300000,
      remainingAmount: 300000,
      studentBalance: 75000,
      travelBalance: 25000,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2027-05-31'),
      status: 'active',
      description: 'Data science research and development'
    }
  });
  console.log('Created grant:', grant2.grantNumber);

  // Link users to grants
  await prisma.userGrant.create({
    data: {
      userId: admin.id,
      grantId: grant1.id,
      role: 'owner'
    }
  });

  await prisma.userGrant.create({
    data: {
      userId: researcher.id,
      grantId: grant1.id,
      role: 'member'
    }
  });

  await prisma.userGrant.create({
    data: {
      userId: admin.id,
      grantId: grant2.id,
      role: 'owner'
    }
  });
  console.log('Linked users to grants');

  // Create rules
  const spendingLimitRule = await prisma.rule.create({
    data: {
      ruleType: 'general',
      policyHolder: 'federal',
      description: 'Single purchase limit of $5,000 without additional approval'
    }
  });

  const travelRule = await prisma.rule.create({
    data: {
      ruleType: 'travel',
      policyHolder: 'university',
      description: 'International travel requires 30-day advance notice'
    }
  });

  const studentRule = await prisma.rule.create({
    data: {
      ruleType: 'student',
      policyHolder: 'federal',
      description: 'Student wages must not exceed 20 hours per week during academic year'
    }
  });
  console.log('Created rules');

  // Create fringe rates
  const travelRate = await prisma.fringeRate.create({
    data: {
      description: 'travel',
      rate: 0.00 // 0% fringe on travel
    }
  });

  const studentRate = await prisma.fringeRate.create({
    data: {
      description: 'employee cost',
      rate: 32.50 // 32.5% fringe on employee costs
    }
  });
  console.log('Created fringe rates');

  // Create sample spending requests
  const travelRequest = await prisma.spendingRequest.create({
    data: {
      amount: 2500.00,
      category: 'travel',
      description: 'Conference attendance - ACM Computing Conference',
      status: 'pending'
    }
  });

  // Link the travel request to user, grant, rules, and rates
  await prisma.userGrantRequest.create({
    data: {
      userId: researcher.id,
      grantId: grant1.id,
      spendingRequestId: travelRequest.id,
      role: 'creator'
    }
  });

  await prisma.requestRuleFringe.create({
    data: {
      spendingRequestId: travelRequest.id,
      ruleId: travelRule.id,
      fringeRateId: travelRate.id,
      appliedAmount: 2500.00,
      notes: 'Travel expenses with no fringe rate applied'
    }
  });
  console.log('Created travel spending request');

  const studentRequest = await prisma.spendingRequest.create({
    data: {
      amount: 5000.00,
      category: 'students',
      description: 'Graduate research assistant salary - Spring 2024',
      status: 'approved',
      reviewDate: new Date(),
      reviewedBy: admin.id,
      reviewNotes: 'Approved for spring semester'
    }
  });

  await prisma.userGrantRequest.create({
    data: {
      userId: researcher.id,
      grantId: grant1.id,
      spendingRequestId: studentRequest.id,
      role: 'creator'
    }
  });

  await prisma.userGrantRequest.create({
    data: {
      userId: admin.id,
      grantId: grant1.id,
      spendingRequestId: studentRequest.id,
      role: 'approver'
    }
  });

  await prisma.requestRuleFringe.create({
    data: {
      spendingRequestId: studentRequest.id,
      ruleId: studentRule.id,
      fringeRateId: studentRate.id,
      appliedAmount: 5000.00,
      notes: 'Student wages with 32.5% fringe rate'
    }
  });
  console.log('Created student spending request');

  console.log('Seed completed successfully!');
  console.log('\nTest credentials:');
  console.log('Username: admin | Password: password123');
  console.log('Username: researcher | Password: password123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });