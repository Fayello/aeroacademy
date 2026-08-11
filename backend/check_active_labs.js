const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLabs() {
  const instances = await prisma.labInstance.findMany({
    where: { status: 'RUNNING' },
    select: { id: true, port: true, status: true, labId: true }
  });
  console.log('Active Instances in DB:', JSON.stringify(instances, null, 2));
  process.exit(0);
}

checkLabs();
