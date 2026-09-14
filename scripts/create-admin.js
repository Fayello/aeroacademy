const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = 'Test1234!';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: { passwordHash, emailVerified: new Date(), role: 'ADMIN', name: 'Admin Test' },
    create: {
      email: 'admin@test.com',
      name: 'Admin Test',
      passwordHash,
      emailVerified: new Date(),
      role: 'ADMIN',
      userExperience: 'INDIVIDUAL',
    },
  });

  await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: { onboardingCompleted: true },
    create: { userId: user.id, onboardingCompleted: true },
  });

  console.log(`Created admin: ${user.email} (${user.id})`);
  console.log(`Login: admin@test.com / ${password}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
