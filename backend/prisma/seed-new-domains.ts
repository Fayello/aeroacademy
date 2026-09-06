import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const SALT_ROUNDS = 10;
const ENC_KEY = process.env.LAB_ENCRYPTION_KEY || 'xItkd5u+6XXgCx8DZlE7a3y05LwCCBMqdLiJiRJbVPQ=';

function encryptCredentials(c: any[]) {
  const key = crypto.scryptSync(ENC_KEY, ENC_KEY, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let e = cipher.update(JSON.stringify(c), 'utf8', 'hex');
  e += cipher.final('hex');
  return iv.toString('hex') + ':' + e;
}

async function hashAnswer(a: string) {
  return bcrypt.hash(a.trim().toLowerCase(), SALT_ROUNDS);
}

interface LabDef {
  title: string;
  description: string;
  dockerImage: string;
  difficulty: number;
  estimatedMinutes: number;
  skillName: string;
  briefing: string;
  tasks: string[];
  flags: { title: string; description: string; ans: string; pts: number }[];
}

const FILES = [
  'labs-cloud.json',
  'labs-aiml.json',
  'labs-datascience.json',
  'labs-webmobile.json',
  'labs-softwareeng.json',
  'labs-fintech.json',
  'labs-blockchain.json',
  'labs-iot.json',
];

async function main() {
  const prisma = new PrismaClient();

  // Resolve domain IDs
  const domainRows = await prisma.$queryRaw<{ id: string; name: string }[]>`
    SELECT id, name FROM "SkillDomain"
  `;
  const domainMap = new Map(domainRows.map(d => [d.name, d.id]));

  // Resolve skill IDs
  const skillRows = await prisma.$queryRaw<{ id: string; name: string; domainId: string }[]>`
    SELECT id, name, "domainId" FROM "Skill"
  `;
  const skillMap = new Map(skillRows.map(s => [s.name, s.id]));

  let totalLabs = 0;
  let totalFlags = 0;

  for (const file of FILES) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`  SKIP: ${file} not found`);
      continue;
    }

    const labs: LabDef[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`\n  Processing ${file}: ${labs.length} labs`);

    for (const lab of labs) {
      const skillId = skillMap.get(lab.skillName);
      if (!skillId) {
        console.log(`    SKIP: skill "${lab.skillName}" not found for "${lab.title}"`);
        continue;
      }

      // Create lab
      const labRow = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO "Lab" (id, title, description, "dockerImage", briefing, tasks, difficulty, "estimatedMinutes", "resourceProfile", "createdAt")
        VALUES (
          gen_random_uuid(),
          ${lab.title},
          ${lab.description},
          ${lab.dockerImage},
          ${lab.briefing},
          ${JSON.stringify(lab.tasks)}::jsonb,
          ${lab.difficulty},
          ${lab.estimatedMinutes},
          'STANDARD',
          NOW()
        )
        RETURNING id
      `;
      const labId = labRow[0].id;

      // Create lab-skill link
      await prisma.$executeRaw`
        INSERT INTO "LabSkill" (id, "labId", "skillId", "createdAt")
        VALUES (gen_random_uuid(), ${labId}::uuid, ${skillId}::uuid, NOW())
      `;

      // Create flags
      for (const flag of lab.flags) {
        const hashed = await hashAnswer(flag.ans);
        await prisma.$executeRaw`
          INSERT INTO "LabFlag" (id, "labId", title, description, "correctAnswer", points, "createdAt")
          VALUES (gen_random_uuid(), ${labId}::uuid, ${flag.title}, ${flag.description}, ${hashed}, ${flag.pts}, NOW())
        `;
        totalFlags++;
      }

      totalLabs++;
      console.log(`    + ${lab.title} (${lab.flags.length} flags)`);
    }
  }

  console.log(`\n  === DONE: ${totalLabs} labs, ${totalFlags} flags created ===`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
