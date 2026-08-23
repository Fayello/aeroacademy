const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defs = [
  { title: 'FIRST_BLOOD', description: 'Capture your first flag', icon: 'Target', category: 'MILESTONE', rarity: 'COMMON', requirementType: 'FLAGS_CAPTURED', requirementTarget: 1, xpReward: 50 },
  { title: 'FLAG_HUNTER', description: 'Capture 10 flags', icon: 'Crosshair', category: 'MILESTONE', rarity: 'UNCOMMON', requirementType: 'FLAGS_CAPTURED', requirementTarget: 10, xpReward: 150 },
  { title: 'FLAG_VETERAN', description: 'Capture 50 flags', icon: 'Crosshair', category: 'MILESTONE', rarity: 'RARE', requirementType: 'FLAGS_CAPTURED', requirementTarget: 50, xpReward: 500 },
  { title: 'FLAG_LEGEND', description: 'Capture 100 flags', icon: 'Crosshair', category: 'MILESTONE', rarity: 'EPIC', requirementType: 'FLAGS_CAPTURED', requirementTarget: 100, xpReward: 1000 },
  { title: 'FLAG_GOD', description: 'Capture 500 flags', icon: 'Crosshair', category: 'MILESTONE', rarity: 'LEGENDARY', requirementType: 'FLAGS_CAPTURED', requirementTarget: 500, xpReward: 5000 },
  { title: 'FIRST_STRIKE', description: 'Complete your first lab', icon: 'Zap', category: 'MILESTONE', rarity: 'COMMON', requirementType: 'LABS_COMPLETED', requirementTarget: 1, xpReward: 100 },
  { title: 'PENTEST_APPRENTICE', description: 'Complete 5 labs', icon: 'Shield', category: 'MILESTONE', rarity: 'UNCOMMON', requirementType: 'LABS_COMPLETED', requirementTarget: 5, xpReward: 250 },
  { title: 'PENTEST_OPERATIVE', description: 'Complete 15 labs', icon: 'Shield', category: 'MILESTONE', rarity: 'RARE', requirementType: 'LABS_COMPLETED', requirementTarget: 15, xpReward: 750 },
  { title: 'PENTEST_COMMANDER', description: 'Complete 30 labs', icon: 'Shield', category: 'MILESTONE', rarity: 'EPIC', requirementType: 'LABS_COMPLETED', requirementTarget: 30, xpReward: 2000 },
  { title: 'INITIATE_OPERATIVE', description: 'Complete your first lesson', icon: 'BookOpen', category: 'MILESTONE', rarity: 'COMMON', requirementType: 'LESSONS_COMPLETED', requirementTarget: 1, xpReward: 25 },
  { title: 'DEDICATED_LEARNER', description: 'Complete 25 lessons', icon: 'GraduationCap', category: 'MILESTONE', rarity: 'UNCOMMON', requirementType: 'LESSONS_COMPLETED', requirementTarget: 25, xpReward: 300 },
  { title: 'KNOWLEDGE_SEEKER', description: 'Complete 100 lessons', icon: 'GraduationCap', category: 'MILESTONE', rarity: 'RARE', requirementType: 'LESSONS_COMPLETED', requirementTarget: 100, xpReward: 1500 },
  { title: 'QUIZ_INITIATE', description: 'Pass your first quiz', icon: 'CheckCircle', category: 'MILESTONE', rarity: 'COMMON', requirementType: 'QUIZZES_PASSED', requirementTarget: 1, xpReward: 50 },
  { title: 'QUIZ_MASTER', description: 'Pass 10 quizzes', icon: 'CheckCircle', category: 'MASTERY', rarity: 'UNCOMMON', requirementType: 'QUIZZES_PASSED', requirementTarget: 10, xpReward: 300 },
  { title: 'LEVEL_5', description: 'Reach Level 5', icon: 'TrendingUp', category: 'MASTERY', rarity: 'COMMON', requirementType: 'LEVEL_REACHED', requirementTarget: 5, xpReward: 100 },
  { title: 'LEVEL_10', description: 'Reach Level 10', icon: 'TrendingUp', category: 'MASTERY', rarity: 'UNCOMMON', requirementType: 'LEVEL_REACHED', requirementTarget: 10, xpReward: 300 },
  { title: 'LEVEL_25', description: 'Reach Level 25', icon: 'TrendingUp', category: 'MASTERY', rarity: 'RARE', requirementType: 'LEVEL_REACHED', requirementTarget: 25, xpReward: 1000 },
  { title: 'LEVEL_50', description: 'Reach Level 50', icon: 'TrendingUp', category: 'MASTERY', rarity: 'EPIC', requirementType: 'LEVEL_REACHED', requirementTarget: 50, xpReward: 3000 },
  { title: 'LEVEL_100', description: 'Reach Level 100', icon: 'Crown', category: 'MASTERY', rarity: 'LEGENDARY', requirementType: 'LEVEL_REACHED', requirementTarget: 100, xpReward: 10000 },
  { title: 'STREAK_3', description: 'Maintain a 3-day streak', icon: 'Flame', category: 'STREAK', rarity: 'COMMON', requirementType: 'STREAK_DAYS', requirementTarget: 3, xpReward: 50 },
  { title: 'STREAK_7', description: 'Maintain a 7-day streak', icon: 'Flame', category: 'STREAK', rarity: 'UNCOMMON', requirementType: 'STREAK_DAYS', requirementTarget: 7, xpReward: 200 },
  { title: 'STREAK_30', description: 'Maintain a 30-day streak', icon: 'Flame', category: 'STREAK', rarity: 'RARE', requirementType: 'STREAK_DAYS', requirementTarget: 30, xpReward: 1000 },
  { title: 'STREAK_90', description: 'Maintain a 90-day streak', icon: 'Flame', category: 'STREAK', rarity: 'EPIC', requirementType: 'STREAK_DAYS', requirementTarget: 90, xpReward: 3000 },
  { title: 'MISSION_COMPLETE', description: 'Complete your first mission', icon: 'Target', category: 'CHALLENGE', rarity: 'COMMON', requirementType: 'MISSIONS_COMPLETED', requirementTarget: 1, xpReward: 50 },
  { title: 'MISSION_VETERAN', description: 'Complete 10 missions', icon: 'Target', category: 'CHALLENGE', rarity: 'UNCOMMON', requirementType: 'MISSIONS_COMPLETED', requirementTarget: 10, xpReward: 300 },
  { title: 'WEEKLY_WARRIOR', description: 'Complete 5 weekly challenges', icon: 'Calendar', category: 'CHALLENGE', rarity: 'UNCOMMON', requirementType: 'WEEKLY_CHALLENGES', requirementTarget: 5, xpReward: 500 },
  { title: 'SEASONAL_CONQUEROR', description: 'Complete a seasonal event', icon: 'Zap', category: 'CHALLENGE', rarity: 'RARE', requirementType: 'SEASONAL_COMPLETED', requirementTarget: 1, xpReward: 1000 },
  { title: 'FIRST_REFERRAL', description: 'Refer your first friend', icon: 'Users', category: 'SOCIAL', rarity: 'COMMON', requirementType: 'REFERRALS', requirementTarget: 1, xpReward: 100 },
  { title: 'TEAM_PLAYER', description: 'Join a team', icon: 'Users', category: 'SOCIAL', rarity: 'COMMON', requirementType: 'TEAM_JOINED', requirementTarget: 1, xpReward: 50 },
  { title: 'DISCUSSION_STARTER', description: 'Post in a discussion', icon: 'MessageSquare', category: 'SOCIAL', rarity: 'COMMON', requirementType: 'DISCUSSION_POSTS', requirementTarget: 1, xpReward: 25 },
  { title: 'HELPFUL_OPERATIVE', description: 'Comment on 10 discussions', icon: 'MessageSquare', category: 'SOCIAL', rarity: 'UNCOMMON', requirementType: 'DISCUSSION_COMMENTS', requirementTarget: 10, xpReward: 200 },
  { title: 'COURSE_ENROLLEE', description: 'Enroll in 3 courses', icon: 'BookOpen', category: 'MILESTONE', rarity: 'COMMON', requirementType: 'COURSES_ENROLLED', requirementTarget: 3, xpReward: 50 },
  { title: 'COURSE_GRADUATE', description: 'Complete a course', icon: 'GraduationCap', category: 'MILESTONE', rarity: 'UNCOMMON', requirementType: 'COURSES_COMPLETED', requirementTarget: 1, xpReward: 500 },
  { title: 'POLYGLOT', description: 'Complete 3 courses', icon: 'GraduationCap', category: 'MASTERY', rarity: 'RARE', requirementType: 'COURSES_COMPLETED', requirementTarget: 3, xpReward: 1500 },
];

async function main() {
  let seeded = 0;
  for (const d of defs) {
    await prisma.achievement.upsert({ where: { title: d.title }, update: d, create: d }).then(() => seeded++);
  }
  console.log('Seeded ' + seeded + ' achievements');
}

main().catch(console.error).finally(() => prisma.$disconnect());
