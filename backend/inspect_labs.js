const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const labs = await prisma.lab.findMany({
    select: { id: true, title: true }
  });
  console.log(JSON.stringify(labs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
