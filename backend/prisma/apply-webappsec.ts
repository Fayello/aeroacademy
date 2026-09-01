import { upsertSection, upsertLesson, prisma } from './upsert-helpers';
import * as fs from 'fs';
import * as path from 'path';

const courseId = 'd504a621-2c61-4060-9e40-db450c094a00';

const modules = [
  { file: 'was-mod1-http.md', section: 'HTTP Fundamentals' },
  { file: 'was-mod2-injection.md', section: 'Injection Attacks' },
  { file: 'was-mod3-xss.md', section: 'Cross-Site Scripting' },
  { file: 'was-mod4-auth-sessions.md', section: 'Authentication & Session Attacks' },
  { file: 'was-mod5-access-control.md', section: 'Access Control' },
  { file: 'was-mod6-misconfiguration.md', section: 'Security Misconfiguration' },
  { file: 'was-mod7-crypto-failures.md', section: 'Cryptographic Failures' },
  { file: 'was-mod8-ssrf.md', section: 'Server-Side Request Forgery' },
  { file: 'was-mod9-api-security.md', section: 'API Security' },
  { file: 'was-mod10-modern-attacks.md', section: 'Modern Attack Surfaces' },
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
