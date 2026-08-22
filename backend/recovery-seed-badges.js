const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const badges = [
  { name: 'First Steps', description: 'Complete your first lesson', icon: 'Footprints', category: 'SKILL', tier: 'BRONZE', xpReward: 50, requirement: 'complete_1_lesson' },
  { name: 'Knowledge Seeker', description: 'Complete 5 lessons', icon: 'BookOpen', category: 'SKILL', tier: 'BRONZE', xpReward: 100, requirement: 'complete_5_lessons' },
  { name: 'Dedicated Learner', description: 'Complete 10 lessons', icon: 'GraduationCap', category: 'SKILL', tier: 'SILVER', xpReward: 200, requirement: 'complete_10_lessons' },
  { name: 'Course Master', description: 'Complete 25 lessons', icon: 'Award', category: 'SKILL', tier: 'GOLD', xpReward: 500, requirement: 'complete_25_lessons' },
  { name: 'Scholar', description: 'Complete 50 lessons', icon: 'Crown', category: 'SKILL', tier: 'PLATINUM', xpReward: 1000, requirement: 'complete_50_lessons' },
  { name: 'First Blood', description: 'Capture your first flag', icon: 'Flag', category: 'SKILL', tier: 'BRONZE', xpReward: 100, requirement: 'capture_1_flag' },
  { name: 'Flag Hunter', description: 'Capture 5 flags', icon: 'Target', category: 'SKILL', tier: 'BRONZE', xpReward: 200, requirement: 'capture_5_flags' },
  { name: 'Capture Specialist', description: 'Capture 10 flags', icon: 'Crosshair', category: 'SKILL', tier: 'SILVER', xpReward: 400, requirement: 'capture_10_flags' },
  { name: 'Flag Collector', description: 'Capture 25 flags', icon: 'Trophy', category: 'SKILL', tier: 'GOLD', xpReward: 800, requirement: 'capture_25_flags' },
  { name: 'Explorer', description: 'Enroll in 3 courses', icon: 'Compass', category: 'SKILL', tier: 'BRONZE', xpReward: 75, requirement: 'enroll_3_courses' },
  { name: 'Course Collector', description: 'Enroll in 5 courses', icon: 'Library', category: 'SKILL', tier: 'SILVER', xpReward: 150, requirement: 'enroll_5_courses' },
  { name: 'Consistent', description: 'Maintain a 7-day streak', icon: 'Flame', category: 'MILESTONE', tier: 'BRONZE', xpReward: 200, requirement: 'streak_7_days' },
  { name: 'Unstoppable', description: 'Maintain a 30-day streak', icon: 'Zap', category: 'MILESTONE', tier: 'GOLD', xpReward: 1000, requirement: 'streak_30_days' },
  { name: 'Rising Star', description: 'Reach Level 5', icon: 'Star', category: 'MILESTONE', tier: 'SILVER', xpReward: 300, requirement: 'level_5' },
  { name: 'Elite Operative', description: 'Reach Level 10', icon: 'Shield', category: 'MILESTONE', tier: 'PLATINUM', xpReward: 1000, requirement: 'level_10' },
];

async function main() {
  console.log('Seeding badges...');
  for (const badge of badges) {
    await prisma.badge.upsert({ where: { name: badge.name }, update: badge, create: badge });
  }
  console.log('Badges seeded: ' + badges.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
