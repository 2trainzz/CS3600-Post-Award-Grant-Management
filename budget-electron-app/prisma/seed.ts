import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function readJsonFile(filename: string) {
  const filePath = path.join(__dirname, 'seed', filename);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

const usersData = readJsonFile('User.json');
const rulesData = readJsonFile('Rule.json');
const fringeRatesData = readJsonFile('FringeRate.json');
const grantsData = readJsonFile('Grant.json');
const userGrantsData = readJsonFile('UserGrant.json');
const spendingRequestsData = readJsonFile('SpendingRequest.json');
const userGrantRequestsData = readJsonFile('UserGrantRequest.json')
const requestRuleFringesData = readJsonFile('RequestRuleFringe.json')

async function main() {

  await prisma.requestRuleFringe.deleteMany({}); 
    await prisma.userGrantRequest.deleteMany({});
    await prisma.userGrant.deleteMany({}); 
    await prisma.spendingRequest.deleteMany({}); 
    await prisma.grant.deleteMany({});
    await prisma.user.deleteMany({}); 
    await prisma.rule.deleteMany({});
    await prisma.fringeRate.deleteMany({});

    console.log('Old data wiped. Resetting auto-increment...');

    // B. RESET AUTO-INCREMENT (Ensures new IDs start at 1)
    // IMPORTANT: Use raw query to reset the ID counter for parent tables
    await prisma.$executeRaw`ALTER TABLE users AUTO_INCREMENT = 1;`;
    await prisma.$executeRaw`ALTER TABLE grants AUTO_INCREMENT = 1;`;
    await prisma.$executeRaw`ALTER TABLE rules AUTO_INCREMENT = 1;`;
    await prisma.$executeRaw`ALTER TABLE fringe_rates AUTO_INCREMENT = 1;`;
    await prisma.$executeRaw`ALTER TABLE spending_requests AUTO_INCREMENT = 1;`;


  console.log('Starting database seed...');

  // Seed rules
  console.log('Seeding rules...');
  for (const ruleData of rulesData) {
    await prisma.rule.create({
      data: {
        ruleType: ruleData.ruleType,
        policyHolder: ruleData.policyHolder,
        description: ruleData.description
      }
    });
  }
  console.log(`Created ${rulesData.length} rules`);

  // Seed fringe rates
  console.log('Seeding fringe rates...');
  for (const rateData of fringeRatesData) {
    await prisma.fringeRate.create({
      data: {
        description: rateData.description,
        rate: rateData.rate
      }
    });
  }
  console.log(`Created ${fringeRatesData.length} fringe rates`);

  console.log('Seeding users...');
  for (const userData of usersData) {
    // Hash password if it exists
    const hashedPassword = userData.password 
      ? await bcrypt.hash(userData.password, 10)
      : await bcrypt.hash('password123', 10);

    await prisma.user.create({
      data: {
        username: userData.username,
        password: hashedPassword,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'user',
        department: userData.department || 'computer science'
      }
    });
  }
  console.log(`Created ${usersData.length} users`);

  // Seed grants
  console.log('Seeding grants...');
  for (const grantData of grantsData) {
    await prisma.grant.create({
      data: {
        grantNumber: grantData.grantNumber,
        grantName: grantData.grantName,
        totalAmount: grantData.totalAmount,
        remainingAmount: grantData.remainingAmount || grantData.totalAmount,
        studentBalance: grantData.studentBalance,
        travelBalance: grantData.travelBalance,
        startDate: new Date(grantData.startDate),
        endDate: new Date(grantData.endDate),
        status: grantData.status || 'active',
        description: grantData.description
      }
    });
  }
  console.log(`Created ${grantsData.length} grants`);

  //now do dependencies

  for (const userGrantData of userGrantsData) {
    await prisma.userGrant.create({
      data: {
        userId: userGrantData.userId,
        grantId: userGrantData.grantId,
        role: userGrantData.role,
        createdAt: new Date (userGrantData.createdAt)
      }
    });
  }
  console.log(`Created ${userGrantsData.length} usergrants`);
  
  for (const spendingRequestData of spendingRequestsData) {
    await prisma.spendingRequest.create({ 
      data: {
        amount: spendingRequestData.amount,
        category: spendingRequestData.category,
        description: spendingRequestData.description,
        status: spendingRequestData.status,
        requestDate: new Date (spendingRequestData.requestDate),
        reviewDate: new Date (spendingRequestData.reviewDate),
        reviewedBy: spendingRequestData.reviewedBy,
        reviewNotes: spendingRequestData.reviewNotes,
        createdAt: new Date(spendingRequestData.createdAt),
        updatedAt: new Date (spendingRequestData.updatedAt)
      }
    });
  }
  console.log(`Seeded ${spendingRequestsData.length} SpendingRequests.`);

  for (const userGrantRequestData of userGrantRequestsData) {
    await prisma.userGrantRequest.create({
      data: {
        userId: userGrantRequestData.userId,
        grantId: userGrantRequestData.grantId,
        spendingRequestId: userGrantRequestData.spendingRequestId,
        role: userGrantRequestData.role,
        createdAt: new Date (userGrantRequestData.createdAt)
      }
    })
  }
  console.log(`seeded ${spendingRequestsData.length} spendingrequests`);

  for (const requestRuleFringeData of requestRuleFringesData) {
    await prisma.requestRuleFringe.create({
      data: {
        spendingRequestId: requestRuleFringeData.spendingRequestId,
        ruleId: requestRuleFringeData.ruleId,
        fringeRateId: requestRuleFringeData.fringeRateId,
        appliedAmount: requestRuleFringeData.appliedAmount,
        notes: requestRuleFringeData.notes,
        createdAt: new Date (requestRuleFringeData.createdAt)
      }
    })
  }
  console.log(`seeded ${requestRuleFringesData.length} requestrulefringes`);

  console.log('Database seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });