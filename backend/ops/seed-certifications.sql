-- Seed certifications (XCA, XCP, XCE)
-- Run: psql -U aeroacademy -d aeroacademy -f seed-certifications.sql

INSERT INTO "Certification" ("id", "name", "code", "description", "requirements", "xpRequired", "isActive", "createdAt")
VALUES
  (
    gen_random_uuid(),
    'XpertClass Certified Analyst',
    'XCA',
    'Entry-level certification demonstrating foundational cybersecurity competency across at least one domain with hands-on lab experience.',
    '{"minDomains":1,"minMasteryPerDomain":60,"minLabsPerDomain":5,"minAssessments":1,"crossDomain":false}'::jsonb,
    5000,
    true,
    NOW()
  ),
  (
    gen_random_uuid(),
    'XpertClass Certified Practitioner',
    'XCP',
    'Mid-level certification validating multi-domain proficiency with advanced lab work and assessment performance.',
    '{"minDomains":2,"minMasteryPerDomain":70,"minLabsPerDomain":10,"minAssessments":3,"crossDomain":false}'::jsonb,
    15000,
    true,
    NOW()
  ),
  (
    gen_random_uuid(),
    'XpertClass Certified Expert',
    'XCE',
    'Expert-level certification requiring mastery across multiple domains, extensive lab completion, and cross-domain competency.',
    '{"minDomains":4,"minMasteryPerDomain":80,"minLabsPerDomain":15,"minAssessments":5,"crossDomain":true}'::jsonb,
    30000,
    true,
    NOW()
  )
ON CONFLICT ("code") DO NOTHING;
