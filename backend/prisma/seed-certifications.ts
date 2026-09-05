import { PrismaClient } from '@prisma/client';

const CERTIFICATIONS = [
  {
    name: 'XpertClass Certified Analyst',
    code: 'XCA',
    description: 'Entry-level certification demonstrating foundational cybersecurity competency across at least one domain with hands-on lab experience.',
    xpRequired: 5000,
    requirements: {
      minDomains: 1,
      minMasteryPerDomain: 60,
      minLabsPerDomain: 5,
      minAssessments: 1,
      crossDomain: false,
    },
  },
  {
    name: 'XpertClass Certified Practitioner',
    code: 'XCP',
    description: 'Mid-level certification validating multi-domain proficiency with advanced lab work and assessment performance.',
    xpRequired: 15000,
    requirements: {
      minDomains: 2,
      minMasteryPerDomain: 70,
      minLabsPerDomain: 10,
      minAssessments: 3,
      crossDomain: false,
    },
  },
  {
    name: 'XpertClass Certified Expert',
    code: 'XCE',
    description: 'Expert-level certification requiring mastery across multiple domains, extensive lab completion, and cross-domain competency.',
    xpRequired: 30000,
    requirements: {
      minDomains: 4,
      minMasteryPerDomain: 80,
      minLabsPerDomain: 15,
      minAssessments: 5,
      crossDomain: true,
    },
  },
];

export async function seedCertifications(prisma: PrismaClient) {
  for (const cert of CERTIFICATIONS) {
    const existing = await prisma.certification.findUnique({ where: { code: cert.code } });
    if (!existing) {
      await prisma.certification.create({ data: cert });
      console.log(`  ✅ Created certification: ${cert.code} — ${cert.name}`);
    } else {
      console.log(`  ⏭️  Certification ${cert.code} already exists, skipping`);
    }
  }
}
