import { PrismaClient } from "@prisma/client";

interface Wiring {
  courseTitle: string;
  lessonTitle: string; // substring match (contains, case-insensitive)
  labTitle: string;
}

const wirings: Wiring[] = [
  // Containerization & DevOps
  { courseTitle: "Containerization & DevOps", lessonTitle: "Image Building", labTitle: "Container Image Scanning & Registry Security" },
  { courseTitle: "Containerization & DevOps", lessonTitle: "Docker Compose", labTitle: "Docker Compose Multi-Service Stack" },
  { courseTitle: "Containerization & DevOps", lessonTitle: "Monitoring & Observability", labTitle: "Prometheus + Grafana Monitoring Stack" },
  { courseTitle: "Containerization & DevOps", lessonTitle: "CI/CD Pipeline", labTitle: "CI/CD Pipeline with GitHub Actions" },
  { courseTitle: "Containerization & DevOps", lessonTitle: "Infrastructure as Code", labTitle: "Terraform Security & IaC Scanning" },
  { courseTitle: "Containerization & DevOps", lessonTitle: "GitOps", labTitle: "GitOps Security with ArgoCD" },

  // Web Server Administration
  { courseTitle: "Web Server Administration", lessonTitle: "Nginx Architecture", labTitle: "Nginx Security Hardening" },
  { courseTitle: "Web Server Administration", lessonTitle: "Reverse Proxy", labTitle: "Reverse Proxy & Load Balancer Security" },
  { courseTitle: "Web Server Administration", lessonTitle: "SSL/TLS", labTitle: "TLS/SSL Certificate Management" },
  { courseTitle: "Web Server Administration", lessonTitle: "Zero-Downtime", labTitle: "Web Server Hardening CIS Benchmark" },

  // Linux Fundamentals
  { courseTitle: "Linux Fundamentals — From Zero to Command Line Hero", lessonTitle: "Shell Scripting", labTitle: "Linux Fundamentals: Text Processing & Shell Scripting" },

  // Networking & Security
  { courseTitle: "Networking & Security", lessonTitle: "Firewall Types", labTitle: "Firewall Configuration with iptables" },
  { courseTitle: "Networking & Security", lessonTitle: "WireGuard", labTitle: "VPN Configuration with WireGuard" },
  { courseTitle: "Networking & Security", lessonTitle: "Packet Analysis", labTitle: "Packet Analysis with Wireshark/tshark" },
  { courseTitle: "Networking & Security", lessonTitle: "Intrusion Detection", labTitle: "Intrusion Detection with Suricata" },
  { courseTitle: "Networking & Security", lessonTitle: "Zero Trust", labTitle: "Zero Trust Architecture Implementation" },

  // Advanced Web Vulnerabilities
  { courseTitle: "Advanced Web Vulnerabilities", lessonTitle: "SQL Injection Beyond", labTitle: "SQL Injection Deep Dive" },
  { courseTitle: "Advanced Web Vulnerabilities", lessonTitle: "JWT Security", labTitle: "JWT Security Pitfalls" },
  { courseTitle: "Advanced Web Vulnerabilities", lessonTitle: "Server-Side Request Forgery", labTitle: "Server-Side Request Forgery (SSRF)" },
  { courseTitle: "Advanced Web Vulnerabilities", lessonTitle: "GraphQL", labTitle: "API Security Testing (REST & GraphQL)" },

  // Product Security SDL
  { courseTitle: "Product Security Architecture & SDL", lessonTitle: "SAST, DAST", labTitle: "Static Application Security Testing (SAST)" },
  { courseTitle: "Product Security Architecture & SDL", lessonTitle: "Software Composition", labTitle: "Software Composition Analysis (SCA)" },

  // Malware Analysis & RE
  { courseTitle: "Malware Analysis & Reverse Engineering", lessonTitle: "YARA", labTitle: "Steganography & Covert Channel Detection" },
  { courseTitle: "Malware Analysis & Reverse Engineering", lessonTitle: "Memory Forensics", labTitle: "Memory Forensics with Volatility" },

  // Incident Response & Digital Forensics
  { courseTitle: "Incident Response & Digital Forensics", lessonTitle: "Forensic Acquisition", labTitle: "Digital Forensics & Incident Response" },
  { courseTitle: "Incident Response & Digital Forensics", lessonTitle: "Log Management", labTitle: "Secure Logging, Monitoring & Incident Response" },

  // Cloud Security & Hardening (new course)
  { courseTitle: "Cloud Security & Hardening", lessonTitle: "Cloud Reconnaissance", labTitle: "Cloud Penetration Testing (AWS/Azure/GCP)" },
  { courseTitle: "Cloud Security & Hardening", lessonTitle: "Docker Security", labTitle: "Docker Security Hardening" },
  { courseTitle: "Cloud Security & Hardening", lessonTitle: "Serverless Security", labTitle: "Serverless Security Testing" },
  { courseTitle: "Cloud Security & Hardening", lessonTitle: "IAM Attack", labTitle: "AWS IAM Security & Policy Analysis" },

  // Python for Cybersecurity & Automation
  { courseTitle: "Python for Cybersecurity & Automation", lessonTitle: "Packet Crafting", labTitle: "Network Reconnaissance with Nmap" },
  { courseTitle: "Python for Cybersecurity & Automation", lessonTitle: "Custom Exploit", labTitle: "Memory Safety & Buffer Overflow Exploitation" },

  // Full-Stack JS Development
  { courseTitle: "Full-Stack JavaScript Development", lessonTitle: "Express.js REST", labTitle: "Secure Node.js Development" },
  { courseTitle: "Full-Stack JavaScript Development", lessonTitle: "Docker Deployment", labTitle: "Docker Security Hardening" },

  // API Design & Security
  { courseTitle: "API Design & Security", lessonTitle: "OAuth 2.0", labTitle: "OAuth 2.0 & OIDC Security Testing" },
  { courseTitle: "API Design & Security", lessonTitle: "Rate Limiting", labTitle: "API Security Best Practices" },
  { courseTitle: "API Design & Security", lessonTitle: "OWASP API", labTitle: "OWASP Top 10 Prevention Workshop" },

  // Database Administration & Security
  { courseTitle: "Database Administration & Security", lessonTitle: "Backup & Recovery", labTitle: "Database Backup & Recovery Security" },
  { courseTitle: "Database Administration & Security", lessonTitle: "MongoDB Security", labTitle: "MongoDB NoSQL Injection & Security" },

  // Infrastructure as Code
  { courseTitle: "Infrastructure as Code", lessonTitle: "Terraform", labTitle: "Terraform Security & IaC Scanning" },

  // Kubernetes Administration & Security
  { courseTitle: "Kubernetes Administration & Security", lessonTitle: "RBAC", labTitle: "Kubernetes Security Hardening" },

  // Site Reliability Engineering
  { courseTitle: "Site Reliability Engineering", lessonTitle: "Monitoring Architecture", labTitle: "Prometheus + Grafana Monitoring Stack" },
];

export async function wireLabCourseLinks(prisma: PrismaClient): Promise<void> {
  console.log("🔗 Wiring lab ↔ course lesson links…");

  let wired = 0;
  let skipped = 0;
  let notFound = 0;

  for (const w of wirings) {
    const course = await prisma.course.findFirst({ where: { title: w.courseTitle } });
    if (!course) {
      console.log(`  ⚠ Course not found: "${w.courseTitle}" — skipping`);
      notFound++;
      continue;
    }

    // Use contains for lesson title (case-insensitive substring match)
    const lesson = await prisma.lesson.findFirst({
      where: {
        section: { courseId: course.id },
        title: { contains: w.lessonTitle, mode: "insensitive" },
      },
    });
    if (!lesson) {
      console.log(`  ⚠ Lesson not found: "${w.lessonTitle}" in "${w.courseTitle}" — skipping`);
      notFound++;
      continue;
    }

    if (lesson.labId) {
      console.log(`  ⏭ Lesson "${lesson.title}" already linked — skipping`);
      skipped++;
      continue;
    }

    if (!w.labTitle) {
      console.log(`  ℹ No lab specified for "${w.lessonTitle}" — skipping`);
      skipped++;
      continue;
    }

    const lab = await prisma.lab.findFirst({ where: { title: w.labTitle } });
    if (!lab) {
      console.log(`  ⚠ Lab not found: "${w.labTitle}" — skipping`);
      notFound++;
      continue;
    }

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { labId: lab.id },
    });

    console.log(`  ✅ "${lesson.title}" (${w.courseTitle}) → "${w.labTitle}"`);
    wired++;
  }

  console.log(`\n🔗 Wiring complete: ${wired} wired, ${skipped} skipped, ${notFound} not found`);
}
