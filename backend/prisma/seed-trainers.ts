import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedTrainers() {
  const count = await prisma.trainer.count();
  if (count > 0) {
    console.log(`[seed] ${count} trainers already exist, skipping`);
    return;
  }

  // Find existing users to assign as trainers
  const admin = await prisma.user.findUnique({ where: { email: 'admin@aeroacademy.org' } });
  const users = await prisma.user.findMany({ where: { role: 'STUDENT' }, take: 3 });

  if (!admin && users.length === 0) {
    console.log('[seed] No users found to create trainers, skipping');
    return;
  }

  const trainerIds: string[] = [];

  if (admin) {
    const trainer = await prisma.trainer.create({
      data: {
        userId: admin.id,
        bio: 'Platform administrator and security expert. Specializes in penetration testing and secure architecture.',
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
        bio: `Experienced engineer based in ${user.city}. Passionate about teaching and hands-on learning.`,
        specialties,
        hourlyRate: 3000,
      },
    });
    trainerIds.push(trainer.id);
  }

  // Add weekly availability slots for each trainer
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

  console.log(`[seed] Created ${trainerIds.length} trainers with availability slots`);
}
