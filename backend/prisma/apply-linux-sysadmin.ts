import { upsertSection, upsertLesson, prisma } from './upsert-helpers';
import * as fs from 'fs';
import * as path from 'path';

const courseId = '29cfecbb-9f10-4173-a9e4-32ad87517632';

const sectionNames = [
  'Boot & Kernel',
  'Storage & Users',
  'Services & Networking',
  'Security & Backup',
  'Monitoring & Automation',
];

const modules = [
  { file: 'sysadmin-mod1-boot-kernel.md', section: 0 },
  { file: 'sysadmin-mod2-storage-filesystems.md', section: 0 },
  { file: 'sysadmin-mod3-user-admin.md', section: 1 },
  { file: 'sysadmin-mod4-service-management.md', section: 1 },
  { file: 'sysadmin-mod5-network-config.md', section: 2 },
  { file: 'sysadmin-mod6-security-hardening.md', section: 2 },
  { file: 'sysadmin-mod7-backup-recovery.md', section: 3 },
  { file: 'sysadmin-mod8-monitoring-logging.md', section: 3 },
  { file: 'sysadmin-mod9-virtualization.md', section: 4 },
  { file: 'sysadmin-mod10-ansible-automation.md', section: 4 },
];

async function main() {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error('Course not found');

  const sections = [];
  for (let i = 0; i < sectionNames.length; i++) {
    const s = await upsertSection(courseId, sectionNames[i], i);
    sections.push(s);
  }

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    const md = fs.readFileSync(path.join(__dirname, mod.file), 'utf8');
    const title = md.split('\n')[0].replace(/^# /, '').replace(/Module \d+: /, '');
    const section = sections[mod.section];
    const lesson = await upsertLesson(section.id, title, md, i);
    console.log(`Updated: ${lesson.title} (${md.length} chars)`);
  }
  console.log('Done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
