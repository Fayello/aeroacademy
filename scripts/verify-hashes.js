const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizeAnswer(answer) {
  return answer.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim();
}

// Build expected answers based on actual ubuntu:22.04 container behavior
const expectedAnswers = {
  // Lab 1: Ubuntu CLI
  'Filesystem Navigator': 'ubuntu',
  'Permission Reader': 'root',
  'Directory Builder': '2',
  'File Mover': 'migrate me',
  'Hidden Finder': '0',
  'Text Pipe Master': '1',
  'Glob Master': '5',
  'Redirect Wizard': '2',
  'Chmod Challenge': '700',
  'Find & Exec': '5',
  'Diff Detective': '1c1',
  'Tar Packer': '3',
  'Chain Commander': '3',
  'Script Crafter': 'HOSTNAME=' ,
  // Lab 2: Permissions
  'Permission Decode': '-rw-r--r--',
  'Ownership Transfer': 'root',
  'Group Write': '-rw-rw-r--',
  'Recursive Chmod': 'drwxr-xr-x',
  'chmod Master': '700',
  'Sticky Bit Expert': '1777',
  'Umask Detective': '-rw-r--r--',
  'Effective Group': 'root',
  'Password Vault': 'password_set',
  'Group Manager': 'student admin_group',
  'User Creator': '1001',
  'Find World Writable': '0',
  'User Deleter': 'no such user',
  // Lab 3: Text Processing
  'Word Counter': '6',
  'grep Guru': '1',
  'sed Specialist': 'Hello AEROACADEMY',
  'CSV Parser': '90',
  'Log Filter': '1',
  'sed Replace All': '3',
  'Sort Count': 'banana',
  'Script Loop': '55',
  'Regex Matcher': 'test',
  'String Transform': 'hello aero',
  'Line Address': '5',
  'Pipeline Master': '/bin/bash /bin/sync /usr/sbin/nologin',
  'Script Writer': '20',
  'Column Extractor': 'alice',
  // Lab 4: Process
  'Signal Handler': '0',
  'Process Tree': '5',
  'File Descriptor': '4',
  'Signal Messenger': '0',
  'Memory Inspector': '524288',
  'Background Job': '0',
  'Process Hunter': 'tail',
  'Systemd Master': 'is running',
  'Cron Crafter': '* * * * * echo cron_ok > /tmp/cron_proof',
  'Service Architect': 'ssh_started',
};

async function main() {
  const flags = await prisma.labFlag.findMany({
    where: { lab: { title: { contains: 'Fundamentals' } } },
    select: { title: true, correctAnswer: true, description: true, lab: { select: { title: true } } },
    orderBy: [{ lab: { title: 'asc' } }, { points: 'asc' }],
  });

  let pass = 0, fail = 0, skip = 0;
  for (const flag of flags) {
    const expected = expectedAnswers[flag.title];
    if (!expected) {
      console.log(`SKIP: ${flag.title} (no expected value defined)`);
      skip++;
      continue;
    }
    const normalized = normalizeAnswer(expected);
    const matches = await bcrypt.compare(normalized, flag.correctAnswer);
    if (matches) {
      console.log(`PASS: ${flag.lab.title} > ${flag.title} = "${expected}"`);
      pass++;
    } else {
      console.log(`FAIL: ${flag.lab.title} > ${flag.title} expected="${expected}" normalized="${normalized}"`);
      fail++;
    }
  }
  console.log(`\n=== RESULTS: ${pass} passed, ${fail} failed, ${skip} skipped out of ${flags.length} total ===`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
