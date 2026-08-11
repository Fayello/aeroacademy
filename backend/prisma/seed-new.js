const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding master classes...');
  const mcCount = await prisma.masterClass.count();
  if (mcCount > 0) {
    console.log(`  ${mcCount} master classes already exist, skipping`);
  } else {
    const now = new Date();
    const classes = [
      {
        title: 'Introduction to Penetration Testing',
        description: 'Learn the fundamentals of penetration testing methodology, tools, and ethical frameworks.',
        instructorName: 'Dr. Moussa C.',
        instructorBio: 'CS Faculty at University of Maroua with 10+ years in security research.',
        category: 'SECURITY',
        scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        duration: 90,
        maxParticipants: 50,
        isLive: true,
        status: 'UPCOMING',
      },
      {
        title: 'Docker & Kubernetes Deep Dive',
        description: 'Master container orchestration from Docker basics to Kubernetes deployments.',
        instructorName: 'Amadou T.',
        instructorBio: 'Security Engineer specializing in cloud infrastructure.',
        category: 'DEVOPS',
        scheduledAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        duration: 120,
        maxParticipants: 40,
        isLive: true,
        status: 'UPCOMING',
      },
      {
        title: 'Linux Kernel Internals Workshop',
        description: 'Deep dive into Linux kernel architecture, system calls, and memory management.',
        instructorName: 'Fabiola S.',
        instructorBio: 'DevOps Engineer with deep expertise in Linux internals.',
        category: 'LINUX',
        scheduledAt: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
        duration: 120,
        maxParticipants: 30,
        isLive: true,
        status: 'UPCOMING',
      },
      {
        title: 'OWASP Top 10 Hands-On',
        description: 'Walk through each OWASP Top 10 vulnerability with live exploitation demos.',
        instructorName: 'Dr. Moussa C.',
        instructorBio: 'CS Faculty at University of Maroua with 10+ years in security research.',
        category: 'SECURITY',
        scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        duration: 90,
        maxParticipants: 60,
        isLive: true,
        status: 'UPCOMING',
      },
      {
        title: 'Building CI/CD Pipelines',
        description: 'From zero to production-ready CI/CD with GitHub Actions and Docker.',
        instructorName: 'Amadou T.',
        instructorBio: 'Security Engineer specializing in cloud infrastructure.',
        category: 'DEVOPS',
        scheduledAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        duration: 75,
        maxParticipants: 50,
        isLive: false,
        recordingUrl: 'https://example.com/recordings/cicd-pipelines',
        status: 'COMPLETED',
      },
    ];
    const created = await prisma.masterClass.createMany({ data: classes });
    console.log(`  Created ${created.count} master classes`);
  }

  console.log('Seeding trainers...');
  const tCount = await prisma.trainer.count();
  if (tCount > 0) {
    console.log(`  ${tCount} trainers already exist, skipping`);
  } else {
    const admin = await prisma.user.findUnique({ where: { email: 'admin@aeroacademy.org' } });
    const users = await prisma.user.findMany({ where: { role: 'STUDENT' }, take: 3 });
    const trainerIds = [];

    if (admin) {
      const trainer = await prisma.trainer.create({
        data: {
          userId: admin.id,
          bio: 'Platform administrator and security expert.',
          specialties: ['Security', 'Penetration Testing', 'Architecture'],
          hourlyRate: 5000,
        },
      });
      trainerIds.push(trainer.id);
    }

    for (const user of users.slice(0, 2)) {
      const specialties = user.city === 'Yaoundé'
        ? ['Linux', 'System Administration']
        : ['DevOps', 'Cloud Infrastructure'];
      const trainer = await prisma.trainer.create({
        data: {
          userId: user.id,
          bio: `Experienced engineer based in ${user.city}.`,
          specialties,
          hourlyRate: 3000,
        },
      });
      trainerIds.push(trainer.id);
    }

    for (const trainerId of trainerIds) {
      const slots = [
        { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 1, startTime: '14:00', endTime: '15:00' },
        { dayOfWeek: 3, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 3, startTime: '15:00', endTime: '16:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 5, startTime: '13:00', endTime: '14:00' },
      ];
      await prisma.trainingSlot.createMany({
        data: slots.map((s) => ({ ...s, trainerId })),
      });
    }
    console.log(`  Created ${trainerIds.length} trainers with availability slots`);
  }

  console.log('Done!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
