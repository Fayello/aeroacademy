import { upsertSection, upsertLesson, prisma } from './upsert-helpers';
import * as fs from 'fs';
import * as path from 'path';

const courseId = 'ad74f191-1606-4b41-aaba-e9d6c9f7999c';

const modules = [
  { file: 'devops-mod1-culture.md', section: 'DevOps Culture' },
  { file: 'devops-mod2-git.md', section: 'Git & Version Control' },
  { file: 'devops-mod3-cicd.md', section: 'CI/CD Pipelines' },
  { file: 'devops-mod4-docker.md', section: 'Containerization with Docker' },
  { file: 'devops-mod5-compose.md', section: 'Docker Compose' },
  { file: 'devops-mod6-kubernetes.md', section: 'Kubernetes Fundamentals' },
  { file: 'devops-mod7-terraform.md', section: 'Infrastructure as Code' },
  { file: 'devops-mod8-monitoring.md', section: 'Monitoring & Observability' },
  { file: 'devops-mod9-ansible.md', section: 'Configuration Management' },
  { file: 'devops-mod10-incident-response.md', section: 'Incident Response & SRE' },
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
