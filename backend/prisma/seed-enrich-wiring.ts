import { PrismaClient } from "@prisma/client";

interface Wiring {
  courseTitle: string;
  lessonTitle: string;
  labTitle: string;
}

const wirings: Wiring[] = [
  // Containerization & DevOps
  { courseTitle: "Containerization & DevOps", lessonTitle: "Docker Build & Registry", labTitle: "Docker Build, Push & Registry" },
  { courseTitle: "Containerization & DevOps", lessonTitle: "Nginx Reverse Proxy", labTitle: "Nginx Reverse Proxy & Load Balancer" },
  { courseTitle: "Containerization & DevOps", lessonTitle: "Redis Caching", labTitle: "Redis Caching & Session Management" },
  { courseTitle: "Containerization & DevOps", lessonTitle: "Monitoring", labTitle: "Prometheus + Grafana Monitoring Stack" },
  { courseTitle: "Containerization & DevOps", lessonTitle: "Compose", labTitle: "Docker Compose Multi-Service Stack" },
  { courseTitle: "Containerization & DevOps", lessonTitle: "Kubernetes", labTitle: "Kubernetes Cluster Setup" },
  { courseTitle: "Containerization & DevOps", lessonTitle: "CI/CD", labTitle: "CI/CD Pipeline with GitHub Actions" },

  // Web Server Admin
  { courseTitle: "Web Server Admin", lessonTitle: "Nginx Mastery", labTitle: "Nginx Mastery: Architecture & Configuration" },
  { courseTitle: "Web Server Admin", lessonTitle: "SSL", labTitle: "Let's Encrypt SSL Automation with Certbot" },

  // Linux Fundamentals
  { courseTitle: "Linux Fundamentals", lessonTitle: "Shell Scripting", labTitle: "Linux Fundamentals: Text Processing & Shell Scripting" },

  // Networking & Security
  { courseTitle: "Networking & Security", lessonTitle: "Firewall", labTitle: "iptables to nftables Migration" },
  { courseTitle: "Networking & Security", lessonTitle: "VPN", labTitle: "WireGuard VPN Configuration" },

  // Advanced Web Vulns
  { courseTitle: "Advanced Web Vulns", lessonTitle: "SQLi", labTitle: "Advanced Web Exploitation Sandbox" },
  { courseTitle: "Advanced Web Vulns", lessonTitle: "Juice Shop", labTitle: "Broken Authentication Sandbox" },

  // Product Security SDL
  { courseTitle: "Product Security SDL", lessonTitle: "SAST, DAST & SCA Integration", labTitle: "" },

  // Malware Analysis
  { courseTitle: "Malware Analysis", lessonTitle: "YARA", labTitle: "Static Malware Analysis with YARA Rules" },
  { courseTitle: "Malware Analysis", lessonTitle: "Dynamic", labTitle: "Dynamic Malware Analysis in Sandbox" },
  { courseTitle: "Malware Analysis", lessonTitle: "PE Analysis", labTitle: "PE Header Analysis & Import Table Inspection" },
  { courseTitle: "Malware Analysis", lessonTitle: "Volatility", labTitle: "Memory Forensics with Volatility" },

  // IR/Forensics
  { courseTitle: "IR/Forensics", lessonTitle: "Suricata", labTitle: "Suricata IDS Rule Writing" },
  { courseTitle: "IR/Forensics", lessonTitle: "Elasticsearch", labTitle: "Elasticsearch SIEM Query Language" },
  { courseTitle: "IR/Forensics", lessonTitle: "Kibana", labTitle: "Kibana Security Incident Dashboard" },

  // Python for Cybersecurity
  { courseTitle: "Python for Cybersecurity", lessonTitle: "Flask", labTitle: "Python Flask CRUD Application" },
  { courseTitle: "Python for Cybersecurity", lessonTitle: "Scapy", labTitle: "Python Network Scanner with Scapy" },

  // Full-Stack JS
  { courseTitle: "Full-Stack JS", lessonTitle: "REST API", labTitle: "Node.js REST API from Scratch" },
  { courseTitle: "Full-Stack JS", lessonTitle: "React", labTitle: "React Component Architecture" },
  { courseTitle: "Full-Stack JS", lessonTitle: "WebSocket", labTitle: "WebSocket Real-Time Chat Application" },

  // API Design & Security
  { courseTitle: "API Design & Security", lessonTitle: "OAuth2", labTitle: "OAuth2 & OpenID Connect Implementation" },
  { courseTitle: "API Design & Security", lessonTitle: "GraphQL", labTitle: "GraphQL Server & Schema Design" },

  // Database Admin
  { courseTitle: "Database Admin", lessonTitle: "PostgreSQL Schema", labTitle: "PostgreSQL Schema Design & Migrations" },
  { courseTitle: "Database Admin", lessonTitle: "Backup", labTitle: "Database Backup & Recovery Strategies" },

  // IaC (note: lab titles intentionally swapped per spec)
  { courseTitle: "IaC", lessonTitle: "Terraform", labTitle: "Ansible Playbook Mastery" },
  { courseTitle: "IaC", lessonTitle: "Ansible", labTitle: "Terraform Fundamentals" },

  // K8s
  { courseTitle: "K8s", lessonTitle: "K8s RBAC", labTitle: "Kubernetes RBAC & NetworkPolicies" },

  // SRE
  { courseTitle: "SRE", lessonTitle: "Prometheus+Grafana", labTitle: "Prometheus + Grafana Monitoring Stack" },

  // UAT
  { courseTitle: "UAT", lessonTitle: "Selenium", labTitle: "Selenium Browser Automation Fundamentals" },
  { courseTitle: "UAT", lessonTitle: "API Testing", labTitle: "API Testing with Newman/Postman" },
  { courseTitle: "UAT", lessonTitle: "Performance", labTitle: "Performance Testing with k6" },
];

export async function wireLabCourseLinks(prisma: PrismaClient): Promise<void> {
  console.log("🔗 Wiring lab ↔ course lesson links…");

  let wired = 0;
  let skipped = 0;
  let notFound = 0;

  for (const w of wirings) {
    // Look up course
    const course = await prisma.course.findFirst({ where: { title: w.courseTitle } });
    if (!course) {
      console.log(`  ⚠ Course not found: "${w.courseTitle}" — skipping`);
      notFound++;
      continue;
    }

    // Look up lesson within the course
    const lesson = await prisma.lesson.findFirst({
      where: { section: { courseId: course.id }, title: w.lessonTitle },
    });
    if (!lesson) {
      console.log(`  ⚠ Lesson not found: "${w.lessonTitle}" in "${w.courseTitle}" — skipping`);
      notFound++;
      continue;
    }

    // Skip if lesson already has a lab linked
    if (lesson.labId) {
      console.log(`  ⏭ Lesson "${w.lessonTitle}" already linked to lab — skipping`);
      skipped++;
      continue;
    }

    // For wirings with no lab (SAST/SCA), just skip lab lookup
    if (!w.labTitle) {
      console.log(`  ℹ No lab specified for "${w.lessonTitle}" — skipping lab link`);
      skipped++;
      continue;
    }

    // Look up lab
    const lab = await prisma.lab.findFirst({ where: { title: w.labTitle } });
    if (!lab) {
      console.log(`  ⚠ Lab not found: "${w.labTitle}" — skipping`);
      notFound++;
      continue;
    }

    // Wire it
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { labId: lab.id },
    });

    console.log(`  ✅ "${w.lessonTitle}" (${w.courseTitle}) → "${w.labTitle}"`);
    wired++;
  }

  console.log(`\n🔗 Wiring complete: ${wired} wired, ${skipped} skipped, ${notFound} not found`);
}
