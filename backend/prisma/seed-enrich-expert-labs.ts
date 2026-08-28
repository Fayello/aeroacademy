import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const SALT_ROUNDS = 10;
const ENC_KEY = process.env.LAB_ENCRYPTION_KEY || 'aeroacademy-labs-default-key-change-in-production-32b!';
function encryptCredentials(c: any[]) {
  const key = crypto.scryptSync(ENC_KEY, ENC_KEY, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let e = cipher.update(JSON.stringify(c), 'utf8', 'hex');
  e += cipher.final('hex');
  return iv.toString('hex') + ':' + e;
}
async function hashAnswer(a: string) { return bcrypt.hash(a.trim().toLowerCase(), SALT_ROUNDS); }

export async function seedEnrichExpertLabs(prisma: PrismaClient, encryptionKey: string) {
  console.log('  === Seeding 10 EXPERT labs (1550-1700) ===');
  const defs = [
    ["Linux Kernel Heap Exploitation & SMEP Bypass","Exploit kernel heap overflow, bypass SMEP/SMAP and escalate to root via ret2usr.","kalilinux/kali-rolling",1700,120,
`### Mission Objective
Achieve LPE via kernel heap overflow in a vulnerable driver. Bypass SMEP/SMAP/KPTI and capture root flag. Research-level — requires ADVANCED kernel internals.

### Environment
- Image: kalilinux/kali-rolling
- Tools: gdb, pwndbg, ROPgadget, kernel build tree, QEMU
- Login: root / ExpertKern2025!

### Tasks
1. Analyze vulnerable driver ioctl and trigger heap overflow
2. Leak kernel base via info disclosure
3. Build ROP chain to disable SMEP
4. Craft ret2usr payload and escalate
5. Capture /root/flag and verify with stat
6. Write exploit report

### Permissions & Access
- Container privileged for QEMU — use least privilege for exploit user
- Flag 644 root:root, exploit dir 755, private exploit 600
- Verify: stat -c '%U:%G %a' /root/flag
`],
    ["ROP Chain Development — Advanced","Build pure ROP chain for NX/ASLR binary without shellcode, pivot stack and call mprotect.","kalilinux/kali-rolling",1650,120,
`### Mission Objective
Bypass NX+ASLR via pure ROP. Pivot stack, leak libc, call mprotect and execute.

### Environment
- Image: kalilinux/kali-rolling
- Tools: pwntools, ROPgadget, gdb, checksec
- Login: root / ExpertROP2025!

### Tasks
1. Analyze binary with checksec and identify gadgets
2. Leak libc via GOT and calculate base
3. Build ROP chain for mprotect
4. Pivot stack and execute shellcode
5. Capture flag in /home/pwn/flag
6. Document gadget chain

### Permissions & Access
- Binary 755, flag 644, exploit 600
- Verify: stat -c '%U:%G %a' /home/pwn/flag
`],
    ["Cryptanalysis — Padding Oracle & Bleichenbacher","Exploit CBC padding oracle and PKCS#1 v1.5 Bleichenbacher to decrypt without key.","kalilinux/kali-rolling",1600,120,
`### Mission Objective
Decrypt ciphertext via CBC padding oracle and forge RSA signature via Bleichenbacher.

### Environment
- Image: kalilinux/kali-rolling
- Tools: python3, pycryptodome, burpsuite, openssl
- Login: root / ExpertCrypto2025!

### Tasks
1. Identify padding oracle endpoint
2. Implement byte-at-a-time decryption
3. Decrypt full plaintext and capture flag1
4. Exploit Bleichenbacher on RSA service
5. Forge signature and capture flag2

### Permissions & Access
- Service 755, flags 644, exploit 600
- Verify: stat -c '%U:%G %a' /flags/*
`],
    ["Hardware Side-Channel — Power Analysis","Perform CPA on AES power traces with ChipWhisperer simulator to recover key.","kalilinux/kali-rolling",1650,120,
`### Mission Objective
Recover AES-128 key via correlation power analysis on simulated traces.

### Environment
- Image: kalilinux/kali-rolling
- Tools: jupyter, chipwhisperer (sim), numpy, matplotlib
- Login: root / ExpertSCA2025!

### Tasks
1. Load power traces and align
2. Implement CPA for S-box output
3. Rank key guesses by correlation
4. Recover full 16-byte key
5. Decrypt flag.bin with recovered key

### Permissions & Access
- Traces 644, flag 644, notebook 755
- Verify: stat -c '%U:%G %a' flag.bin
`],
    ["Active Directory Forest — BloodHound PrivEsc","Escalate from low user to Enterprise Admin via BloodHound path in multi-domain forest.","kalilinux/kali-rolling",1700,120,
`### Mission Objective
Abuse ACLs, GPOs and Kerberoast across forest to reach Enterprise Admin.

### Environment
- Image: kalilinux/kali-rolling
- Tools: bloodhound, impacket, mimikatz (sim), ldapsearch, certipy
- Login: root / ExpertAD2025!

### Tasks
1. Collect data with SharpHound and upload to BloodHound
2. Find shortest path to Domain Admin via ACL abuse
3. Kerberoast service accounts and crack
4. Abuse GPO for lateral to parent domain
5. DCSync and capture NTDS flag

### Permissions & Access
- AD data 644, flag 644, tools 755
- Verify: stat -c '%U:%G %a' /root/ntds.flag
`],
    ["Cloud Red Team — Cross-Account AssumeRole Chain","Chain 3 cross-account AssumeRole + confused deputy to exfiltrate from isolated account.","kalilinux/kali-rolling",1650,120,
`### Mission Objective
Chain AssumeRole across 3 accounts via external ID confusion to access isolated S3.

### Environment
- Image: kalilinux/kali-rolling
- Tools: awscli (sim), pacu, cloudgoat
- Login: root / ExpertCloud2025!

### Tasks
1. Enumerate trust policies and external IDs
2. AssumeRole chain A→B→C with deputy confusion
3. Escalate via UpdateAssumeRolePolicy
4. Access isolated bucket and exfiltrate flag
5. Cover with CloudTrail tampering

### Permissions & Access
- Simulated AWS creds 600, flag 644
- Verify: stat -c '%U:%G %a' /flags/s3.flag
`],
    ["Container Escape — CVE-2024-21626 runc","Exploit runc CVE-2024-21626 WORKDIR escape to break out to host.","kalilinux/kali-rolling",1600,120,
`### Mission Objective
Escape container via runc file descriptor leak and capture host flag.

### Environment
- Image: kalilinux/kali-rolling
- Tools: docker, runc (vuln), nsenter, cgroup tools
- Login: root / ExpertEscape2025!

### Tasks
1. Identify runc version and leak FD via /proc
2. Craft malicious image with WORKDIR trick
3. Break out to host mount namespace
4. Escape to host filesystem and capture /host/flag
5. Demonstrate host code execution

### Permissions & Access
- Container privileged for docker — restrict exploit user
- Host flag 644, exploit 600
- Verify: stat -c '%U:%G %a' /host/flag
`],
    ["Firmware Reverse Engineering & Extraction","Extract and reverse firmware, find backdoor key in squashfs.","remnux/remnux-cli",1600,120,
`### Mission Objective
Dump firmware, extract squashfs, reverse binary and extract hardcoded key.

### Environment
- Image: remnux/remnux-cli
- Tools: binwalk, firmwalker, ghidra, strings, sasquatch
- Login: root / ExpertFW2025!

### Tasks
1. Binwalk extract firmware.bin
2. Mount squashfs and enumerate binaries
3. Reverse auth binary in Ghidra and find backdoor
4. Extract key and decrypt flag.enc
5. Document firmware TTPs

### Permissions & Access
- Firmware 644, flag 644, tools 755
- Verify: stat -c '%U:%G %a' flag.enc
`],
    ["APT Emulation — MITRE ATT&CK Chain","Emulate APT29 chain: spearphish → Cobalt Strike → Golden Ticket → exfil.","parrotsec/security",1700,120,
`### Mission Objective
Full APT29 kill chain in isolated lab — emulate without real C2.

### Environment
- Image: parrotsec/security
- Tools: caldera (sim), cobalt strike (sim), mimikatz, bloodhound
- Login: root / ExpertAPT2025!

### Tasks
1. Deliver simulated spearphish and initial access
2. Establish persistence via scheduled task
3. Dump creds and forge Golden Ticket
4. Lateral to DC and DCSync
5. Exfiltrate via DNS tunnel and capture flag

### Permissions & Access
- Simulated domain 755, flags 644
- Verify: stat -c '%U:%G %a' /apt/flag
`],
    ["Zero-Day Fuzzing with AFL++ & ASan","Fuzz target with AFL++, triage crash via ASan and craft PoC.","kalilinux/kali-rolling",1550,120,
`### Mission Objective
Fuzz vulnerable binary with AFL++, find heap overflow via ASan and craft PoC.

### Environment
- Image: kalilinux/kali-rolling
- Tools: afl++, clang, asan, gdb, pwntools
- Login: root / ExpertFuzz2025!

### Tasks
1. Build target with AFL++ and ASan
2. Create corpus and run afl-fuzz
3. Triage crashes and identify heap overflow
4. Craft PoC that triggers flag
5. Write fuzzing report with coverage

### Permissions & Access
- Target 755, flag 644, corpus 755, PoC 600
- Verify: stat -c '%U:%G %a' /fuzz/flag
`],
  ] as const;

  let created = 0, skipped = 0;
  for (const [title, desc, img, diff, mins, briefing] of defs) {
    const existing = await prisma.lab.findFirst({ where: { title } });
    if (existing) { console.log(`  Skipped (exists): ${title}`); skipped++; continue; }
    const tasks = ["Analyze target and recon","Leak base and bypass mitigations","Build exploit/ROP chain","Trigger and capture flag","Verify permissions with stat","Write report"];
    const lab = await prisma.lab.create({
      data: {
        title, description: desc, dockerImage: img, briefing,
        tasks, credentials: encryptCredentials([{ service: 'lab', username: 'root', password: 'ExpertLab2025!' }]),
        imageUrl: '/images/labs/default.png', difficulty: diff, estimatedMinutes: mins,
      },
    });
    const flags = [
      { title: 'Flag Captured', description: 'Primary flag', ans: 'expert-flag', pts: 400 },
      { title: 'Exploit Documented', description: 'Report submitted', ans: 'exploit-doc', pts: 300 },
      { title: 'Mitigation Bypassed', description: 'Bypass verified', ans: 'bypass-ok', pts: 300 },
    ];
    for (const f of flags) {
      await prisma.labFlag.create({ data: { labId: lab.id, title: f.title, description: f.description, correctAnswer: await hashAnswer(f.ans), points: f.pts } });
    }
    console.log(`  Created EXPERT: ${title} (${diff})`); created++;
  }
  console.log(`  Expert labs: ${created} created, ${skipped} skipped`);
}
