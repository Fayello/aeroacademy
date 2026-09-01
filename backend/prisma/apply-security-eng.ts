import { upsertSection, upsertLesson, prisma } from './upsert-helpers';
import * as fs from 'fs';
import * as path from 'path';

const courseId = '04c3438e-cff8-493a-8e50-b5b0413d737c';

const modules = [
  { file: 'seceng-mod1-what-it-is.md', section: 'Security Fundamentals' },
  { file: 'seceng-mod2-threat-modeling.md', section: 'Threat Modeling' },
  { file: 'seceng-mod3-secure-design.md', section: 'Secure Design' },
  { file: 'seceng-mod4-code-review.md', section: 'Secure Code Review' },
  { file: 'seceng-mod5-automation.md', section: 'Security Automation' },
  { file: 'seceng-mod6-authn-authz.md', section: 'Authentication & Authorization' },
  { file: 'seceng-mod7-cryptography.md', section: 'Cryptography' },
  { file: 'seceng-mod8-incident-response.md', section: 'Incident Response' },
  { file: 'seceng-mod9-vulnerability-management.md', section: 'Vulnerability Management' },
  { file: 'seceng-mod10-architecture.md', section: 'Security Architecture' },
];

async function main() {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error('Course not found');

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    const md = fs.readFileSync(path.join(__dirname, mod.file), 'utf8');
    const title = md.split('\n')[0].replace(/^# /, '').replace(/Module \d+: /, '');
    const section = await upsertSection(courseId, mod.section, i);
    const lesson = await upsertLesson(section.id, title, md, 0);
    console.log(`Updated: ${lesson.title} (${md.length} chars)`);
  }
  console.log('Done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
