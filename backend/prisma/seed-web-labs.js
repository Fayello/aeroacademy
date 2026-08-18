const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const ENCRYPTION_KEY = process.env.LAB_ENCRYPTION_KEY || 'aeroacademy-labs-encryption-key-change-in-production-32b!';
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

async function hashAnswer(answer) {
  return bcrypt.hash(answer.trim().toLowerCase(), SALT_ROUNDS);
}

function encryptData(plaintext) {
  const key = crypto.scryptSync(ENCRYPTION_KEY, ENCRYPTION_KEY, 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function encryptCredentials(credentials) {
  return encryptData(JSON.stringify(credentials));
}

async function main() {
  const existing = await prisma.lab.findMany({
    where: { dockerImage: { in: ['vulnerables/web-dvwa', 'bkimminich/juice-shop', 'webgoat/webgoat', '1njected/nodegoat', 'roottusk/vapi'] } },
  });
  if (existing.length >= 5) {
    console.log('All 5 web exploitation labs already exist. Skipping.');
    return;
  }

  const sqliLab = await prisma.lab.create({
    data: {
      title: 'Advanced Web Exploitation Sandbox',
      description: 'Practice SQL Injection, XSS, and Command Injection against a pre-configured DVWA environment.',
      dockerImage: 'vulnerables/web-dvwa',
      briefing: '### Mission Objective\nYou have been tasked with auditing a legacy web portal known as DVWA. The target is suspected to contain multiple critical vulnerabilities, including SQL Injection and XSS.\n\n### Operational Guardrails\n1. Do not attempt to pivot out of the container network.\n2. Ensure all findings are documented in the security registry.\n3. Target the \'admin\' account for session hijacking research.',
      tasks: ['Identify the SQL Injection vulnerability in the search module.', 'Extract the database version and schema names.', 'Bypass the login mechanism using an authentication bypass payload.', 'Successfully execute a reflected XSS attack in the guestbook.', 'Exploit a Local File Inclusion (LFI) vulnerability to read /etc/passwd.', 'Perform Command Injection to execute unauthorized system commands.', 'Execute a Brute Force attack to recover the administrative credentials.', 'Bypass file upload restrictions to deploy a functional web shell.'],
      credentials: encryptCredentials([{ service: 'Web Portal', username: 'admin', password: 'password' }, { service: 'Database', username: 'root', password: '' }]),
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
    await prisma.labFlag.create({ data: { labId: sqliLab.id, ...flag, correctAnswer: await hashAnswer(flag.correctAnswer) } });
  }
  console.log('Created: Advanced Web Exploitation Sandbox (DVWA)');

  const brokenAuthLab = await prisma.lab.create({
    data: {
      title: 'Broken Authentication Sandbox',
      description: 'Analyze insecure session management and credential brute-force vulnerabilities in a controlled environment.',
      dockerImage: 'bkimminich/juice-shop',
      briefing: '### Mission Objective\nTarget the OWASP Juice Shop to identify flaws in the authentication and session management layers.\n\n### Operational Guardrails\n1. Focus on the \'Admin\' and \'Bender\' accounts.\n2. The environment is highly sensitive; avoid excessive automated scanning that could crash the Node.js backend.',
      tasks: ['Discover the administration dashboard.', 'Perform an authentication bypass to log in as admin.', 'Identify the weakness in the password reset mechanism.', 'Retrieve the hidden support user credentials.'],
      credentials: encryptCredentials([{ service: 'Customer Portal', username: 'guest', password: 'password123' }]),
      imageUrl: '/images/labs/juiceshop.png',
    }
  });
  const juiceShopFlags = [
    { title: 'Admin Access', description: 'Successfully log in as the administrator.', correctAnswer: 'AERO{AUTH_BYPASS_99}', points: 150 },
    { title: 'Hidden Feedback', description: 'Find and extract the hidden feedback from the support team.', correctAnswer: 'AERO{HIDDEN_VOICE_77}', points: 200 },
  ];
  for (const flag of juiceShopFlags) {
    await prisma.labFlag.create({ data: { labId: brokenAuthLab.id, ...flag, correctAnswer: await hashAnswer(flag.correctAnswer) } });
  }
  console.log('Created: Broken Authentication Sandbox (Juice Shop)');

  const webGoatLab = await prisma.lab.create({
    data: {
      title: 'Enterprise Java Security: WebGoat',
      description: 'Master the exploitation of complex Java-based vulnerabilities in this high-density enterprise environment.',
      dockerImage: 'webgoat/webgoat',
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
    await prisma.labFlag.create({ data: { labId: webGoatLab.id, ...flag, correctAnswer: await hashAnswer(flag.correctAnswer) } });
  }
  console.log('Created: Enterprise Java Security (WebGoat)');

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
    await prisma.labFlag.create({ data: { labId: nodeGoatLab.id, ...flag, correctAnswer: await hashAnswer(flag.correctAnswer) } });
  }
  console.log('Created: Node.js Security Matrix (NodeGoat)');

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
    await prisma.labFlag.create({ data: { labId: vapiLab.id, ...flag, correctAnswer: await hashAnswer(flag.correctAnswer) } });
  }
  console.log('Created: API Security Sandbox (vAPI)');

  console.log('All 5 web exploitation labs seeded!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
