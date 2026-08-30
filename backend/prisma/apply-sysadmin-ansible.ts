import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const prisma = new PrismaClient();

const courseId = '29cfecbb-9f10-4173-a9e4-32ad87517632';

async function main() {
  const md = fs.readFileSync(path.join(__dirname, 'sysadmin-mod10-ansible-automation.md'), 'utf8');
  
  // Find the Monitoring & Automation section
  const section = await prisma.section.findFirst({
    where: { courseId, title: 'Monitoring & Automation' }
  });
  if (!section) throw new Error('Section not found');

  const lesson = await prisma.lesson.create({
    data: {
      sectionId: section.id,
      title: 'Ansible Automation',
      content: md,
      order: 1,
    }
  });
  console.log(`Created: ${lesson.title} (${md.length} chars)`);
  console.log('Done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
