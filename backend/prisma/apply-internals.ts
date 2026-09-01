import { upsertSection, upsertLesson, prisma } from './upsert-helpers';
import * as fs from 'fs';
import * as path from 'path';

const courseId = '7647f852-ba48-4b26-90f7-21a4387c0c17';

const modules = [
  { file: 'internals-mod1-boot.md', section: 'Kernel Boot & Initialization' },
  { file: 'internals-mod2-processes.md', section: 'Process Management' },
  { file: 'internals-mod3-memory.md', section: 'Memory Management' },
  { file: 'internals-mod4-filesystems.md', section: 'Filesystem Internals' },
  { file: 'internals-mod5-syscalls.md', section: 'System Calls & Kernel Interface' },
  { file: 'internals-mod6-kernel-modules.md', section: 'Kernel Modules & eBPF' },
  { file: 'internals-mod7-containers.md', section: 'Namespaces & Containers' },
  { file: 'internals-mod8-hardware.md', section: 'Device Drivers & Hardware' },
  { file: 'internals-mod9-profiling.md', section: 'Performance Profiling' },
  { file: 'internals-mod10-security.md', section: 'Kernel Security' },
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
