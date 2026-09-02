// Run with: npx ts-node src/challenges/skill-seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DOMAINS = [
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
];

async function main() {
  console.log('Seeding skill domains and skills...');

  for (const domain of DOMAINS) {
    const createdDomain = await prisma.skillDomain.upsert({
      where: { name: domain.name },
      update: { displayName: domain.displayName },
      create: {
        name: domain.name,
        displayName: domain.displayName,
      },
    });

    console.log('Upserted domain: ' + createdDomain.displayName);

    for (const skill of domain.skills) {
      const createdSkill = await prisma.skill.upsert({
        where: {
          domainId_name: { domainId: createdDomain.id, name: skill.name },
        },
        update: { displayName: skill.displayName },
        create: {
          domainId: createdDomain.id,
          name: skill.name,
          displayName: skill.displayName,
        },
      });

      console.log('  Upserted skill: ' + createdSkill.displayName);
    }
  }

  console.log('Skill seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
