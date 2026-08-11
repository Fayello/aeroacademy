const { PrismaClient } = require('@prisma/client');
const { LabsService } = require('./dist/labs/labs.service');
const { AchievementService } = require('./dist/dashboard/achievement.service');
const { EventsService } = require('./dist/common/events.service');
const { PrismaService } = require('./dist/prisma/prisma.service');

// Mock user ID (need an actual one from DB)
const userId = 'some-real-user-id'; 
const labId = 'c164635b-7bf6-4a08-9a9d-c21d38c95b76';

async function test() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found');
    process.exit(1);
  }

  console.log(`Testing for user: ${user.email} (${user.id})`);
  
  // We can't easily instantiate NestJS services like this due to DI.
  // I'll just use a raw script to try what startLab does.
}
