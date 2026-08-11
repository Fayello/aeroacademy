const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, name: true, email: true }
  });
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}

checkUsers();
