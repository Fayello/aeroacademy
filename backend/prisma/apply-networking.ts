import { upsertSection, upsertLesson, prisma } from './upsert-helpers';
import * as fs from 'fs';
import * as path from 'path';

const courseId = 'd8029430-8cc8-4ab9-92f1-2b11ce9f17b4';

const modules = [
  { file: 'net-mod1-osi-packets.md', section: 'Protocol Layers & Packet Flow' },
  { file: 'net-mod2-subnetting.md', section: 'IP Addressing & Subnetting' },
  { file: 'net-mod3-dns.md', section: 'DNS & Name Resolution' },
  { file: 'net-mod4-routing.md', section: 'Routing & Traffic Path' },
  { file: 'net-mod5-switching-vlans.md', section: 'Switching & VLANs' },
  { file: 'net-mod6-firewalls.md', section: 'Firewalls & Filtering' },
  { file: 'net-mod7-vpn.md', section: 'VPN Technologies' },
  { file: 'net-mod8-troubleshooting.md', section: 'Network Troubleshooting' },
  { file: 'net-mod9-packet-analysis.md', section: 'Packet Analysis' },
  { file: 'net-mod10-security-monitoring.md', section: 'Network Security Monitoring' },
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
