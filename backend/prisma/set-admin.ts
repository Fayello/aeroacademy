import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({ where: { email: 'fayellnouh@gmail.com' }, data: { role: 'ADMIN' } });
  console.log(`Updated: ${user.email} -> role: ${user.role}`);
}

main().then(() => prisma.$disconnect());
