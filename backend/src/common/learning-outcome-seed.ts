import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OUTCOMES = [
  // ─── SYSTEMS (SYS) ──────────────────────────────────────────
  { domainCode: 'SYSTEMS', outcomes: [
    { code: 'SYS1', title: 'Linux Process Management', description: 'Create, monitor, and manage processes, services, and system resources on Linux systems', weight: 1.2 },
    { code: 'SYS2', title: 'File System Operations', description: 'Navigate, manipulate, and secure file systems using standard Linux tools and permissions', weight: 1.0 },
    { code: 'SYS3', title: 'System Hardening', description: 'Apply security best practices to harden a Linux system against common attack vectors', weight: 1.3 },
    { code: 'SYS4', title: 'Shell Scripting', description: 'Write and debug shell scripts to automate system administration tasks', weight: 1.0 },
    { code: 'SYS5', title: 'Service Configuration', description: 'Install, configure, and troubleshoot system services and daemons', weight: 1.1 },
    { code: 'SYS6', title: 'Disk & Storage Management', description: 'Partition, format, mount, and manage storage devices and filesystems', weight: 1.0 },
    { code: 'SYS7', title: 'System Monitoring', description: 'Use monitoring tools to analyze system performance, logs, and resource usage', weight: 1.0 },
    { code: 'SYS8', title: 'User & Group Administration', description: 'Manage user accounts, groups, sudo access, and authentication policies', weight: 1.1 },
  ]},

  // ─── NETWORKING (NET) ───────────────────────────────────────
  { domainCode: 'NETWORKING', outcomes: [
    { code: 'NET1', title: 'TCP/IP Fundamentals', description: 'Understand the TCP/IP model, IP addressing, subnetting, and routing basics', weight: 1.3 },
    { code: 'NET2', title: 'Network Protocol Analysis', description: 'Capture and analyze network traffic using tools like tcpdump and Wireshark', weight: 1.2 },
    { code: 'NET3', title: 'Firewall Configuration', description: 'Configure iptables/nftables and cloud security groups to control network access', weight: 1.2 },
    { code: 'NET4', title: 'DNS Management', description: 'Configure DNS records, troubleshoot resolution, and understand DNS security', weight: 1.1 },
    { code: 'NET5', title: 'Network Troubleshooting', description: 'Diagnose connectivity issues using ping, traceroute, netstat, and ss', weight: 1.0 },
    { code: 'NET6', title: 'HTTP/HTTPS & Web Protocols', description: 'Understand HTTP methods, headers, TLS handshake, and certificate management', weight: 1.1 },
    { code: 'NET7', title: 'Network Security Monitoring', description: 'Monitor network traffic for anomalies, intrusions, and policy violations', weight: 1.2 },
    { code: 'NET8', title: 'VPN & Tunneling', description: 'Configure and troubleshoot VPNs, SSH tunnels, and encrypted network paths', weight: 1.0 },
  ]},

  // ─── DEVOPS (DEV) ───────────────────────────────────────────
  { domainCode: 'DEVOPS', outcomes: [
    { code: 'DEV1', title: 'Containerization', description: 'Build, run, and manage Docker containers and compose multi-service applications', weight: 1.3 },
    { code: 'DEV2', title: 'CI/CD Pipeline Design', description: 'Design and implement continuous integration and deployment pipelines', weight: 1.2 },
    { code: 'DEV3', title: 'Infrastructure as Code', description: 'Use IaC tools to provision and manage cloud infrastructure declaratively', weight: 1.2 },
    { code: 'DEV4', title: 'Cloud Resource Management', description: 'Deploy and manage applications on cloud platforms (AWS, Azure, GCP)', weight: 1.1 },
    { code: 'DEV5', title: 'Version Control & Collaboration', description: 'Use Git effectively for branching, merging, and team collaboration workflows', weight: 1.0 },
    { code: 'DEV6', title: 'Monitoring & Observability', description: 'Set up logging, metrics, and tracing for production systems', weight: 1.1 },
    { code: 'DEV7', title: 'Automation & Scripting', description: 'Automate repetitive infrastructure and deployment tasks', weight: 1.0 },
    { code: 'DEV8', title: 'Container Orchestration', description: 'Manage containerized workloads using Kubernetes or Docker Swarm', weight: 1.2 },
  ]},

  // ─── DATABASES (DBA) ────────────────────────────────────────
  { domainCode: 'DATABASES', outcomes: [
    { code: 'DBA1', title: 'SQL Query Writing', description: 'Write complex SQL queries with joins, subqueries, aggregations, and window functions', weight: 1.3 },
    { code: 'DBA2', title: 'Database Design & Normalization', description: 'Design normalized schemas, ER diagrams, and optimize data structures', weight: 1.2 },
    { code: 'DBA3', title: 'Database Security', description: 'Implement access controls, encryption, and audit trails for databases', weight: 1.2 },
    { code: 'DBA4', title: 'Query Optimization', description: 'Analyze query execution plans and optimize performance using indexes', weight: 1.1 },
    { code: 'DBA5', title: 'Backup & Recovery', description: 'Implement and test backup strategies, point-in-time recovery, and failover', weight: 1.0 },
    { code: 'DBA6', title: 'NoSQL Operations', description: 'Work with document, key-value, and graph databases for appropriate use cases', weight: 1.0 },
    { code: 'DBA7', title: 'Data Migration', description: 'Plan and execute data migrations between systems with zero/minimal downtime', weight: 1.1 },
  ]},

  // ─── SECURITY (SEC) ─────────────────────────────────────────
  { domainCode: 'SECURITY', outcomes: [
    { code: 'SEC1', title: 'Vulnerability Assessment', description: 'Identify and classify vulnerabilities using scanning tools and manual techniques', weight: 1.3 },
    { code: 'SEC2', title: 'Web Application Security', description: 'Understand and test for OWASP Top 10 vulnerabilities (XSS, SQLi, CSRF, etc.)', weight: 1.3 },
    { code: 'SEC3', title: 'Penetration Testing Methodology', description: 'Follow structured pentest methodologies: recon, exploitation, post-exploitation, reporting', weight: 1.2 },
    { code: 'SEC4', title: 'Cryptography Fundamentals', description: 'Understand symmetric/asymmetric encryption, hashing, and key management', weight: 1.1 },
    { code: 'SEC5', title: 'Incident Response', description: 'Detect, contain, eradicate, and recover from security incidents', weight: 1.2 },
    { code: 'SEC6', title: 'Secure Configuration Management', description: 'Apply security baselines to servers, networks, and applications', weight: 1.1 },
    { code: 'SEC7', title: 'OSINT & Reconnaissance', description: 'Gather and analyze publicly available information for security assessments', weight: 1.0 },
    { code: 'SEC8', title: 'Malware Analysis Basics', description: 'Identify and classify malware samples using static and dynamic analysis', weight: 1.1 },
  ]},

  // ─── QA (QA) ────────────────────────────────────────────────
  { domainCode: 'QA', outcomes: [
    { code: 'QA1', title: 'Test Planning & Strategy', description: 'Design comprehensive test plans covering functional, non-functional, and regression testing', weight: 1.2 },
    { code: 'QA2', title: 'Automated Testing', description: 'Write and maintain automated test suites (unit, integration, e2e)', weight: 1.2 },
    { code: 'QA3', title: 'API Testing', description: 'Test RESTful/GraphQL APIs for correctness, performance, and security', weight: 1.1 },
    { code: 'QA4', title: 'Performance Testing', description: 'Conduct load, stress, and endurance testing to validate system performance', weight: 1.1 },
    { code: 'QA5', title: 'Bug Reporting & Triage', description: 'Document defects clearly, prioritize them, and track resolution progress', weight: 1.0 },
    { code: 'QA6', title: 'Security Testing', description: 'Integrate security testing into QA workflows (SAST, DAST, dependency scanning)', weight: 1.2 },
    { code: 'QA7', title: 'Quality Metrics & Analytics', description: 'Measure and analyze test coverage, defect rates, and quality trends', weight: 1.0 },
  ]},
];

async function main() {
  const domains = await prisma.skillDomain.findMany();
  const domainMap = new Map(domains.map((d) => [d.name, d.id]));

  let created = 0;
  let skipped = 0;

  for (const { domainCode, outcomes } of OUTCOMES) {
    const domainId = domainMap.get(domainCode);
    if (!domainId) {
      console.error(`Domain not found: ${domainCode}`);
      continue;
    }
    for (const o of outcomes) {
      const existing = await prisma.learningOutcome.findFirst({
        where: { domainId, code: o.code },
      });
      if (!existing) {
        await prisma.learningOutcome.create({
          data: {
            code: o.code,
            title: o.title,
            description: o.description,
            domainId,
            weight: o.weight,
          },
        });
        created++;
        console.log(`  Created: ${o.code} — ${o.title}`);
      } else {
        skipped++;
        console.log(`  Skipped: ${o.code} (already exists)`);
      }
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
