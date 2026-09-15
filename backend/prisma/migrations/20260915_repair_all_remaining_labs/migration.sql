-- Repair every practice lab left after the two reviewed 50-lab cohorts.
-- Existing IDs, answer hashes, learner submissions, and dedicated service images
-- are preserved. Infrastructure-dependent labs use deterministic local artifacts.

CREATE TEMP TABLE "_FinalLabRepairTarget" ON COMMIT DROP AS
SELECT
  "id",
  "title",
  "briefing",
  "title" IN (
    'Broken Authentication Sandbox',
    'Node.js Security Matrix: NodeGoat',
    'Enterprise Java Security: WebGoat',
    'API Security Sandbox: vAPI',
    'Nginx Security Hardening',
    'Reverse Proxy & Load Balancer Security'
  ) AS "serviceBacked"
FROM "Lab"
WHERE "type" = 'PRACTICE'
  AND COALESCE("briefing", '') NOT ILIKE '%runtime mode: portable artifact validation%'
  AND COALESCE("briefing", '') NOT ILIKE '%repair cohort: final remaining labs%'
  AND "title" NOT IN (
    'Linux Fundamentals: Ubuntu CLI Mastery',
    'Linux Fundamentals: File Permissions & Users',
    'Linux Fundamentals: Text Processing & Shell Scripting',
    'Linux Fundamentals: Process & Service Management',
    'Docker & Container Fundamentals',
    'OWASP Juice Shop: Beginner Challenges',
    'SQL Injection Deep Dive',
    'Cross-Site Scripting (XSS) Exploitation',
    'Webgoat: Authentication & Access Control',
    'Juice Shop: Advanced Challenges',
    'NodeGoat: Node.js Security Vulnerabilities',
    'VAPI: Vulnerable API Penetration Testing',
    'PostgreSQL Security Hardening',
    'MongoDB NoSQL Injection & Security',
    'Redis Exploitation & Hardening',
    'Database Backup & Recovery Security',
    'Database Encryption at Rest & in Transit',
    'Elasticsearch Security Configuration'
  );

UPDATE "LabFlag" AS flag
SET "description" = format(
  'Document this checkpoint in solution.md, then submit the stable completion token: checkpoint-%s',
  lower(left(flag."id", 8))
)
FROM "_FinalLabRepairTarget" AS target
WHERE flag."labId" = target."id"
  AND NOT target."serviceBacked";

UPDATE "Lab" AS lab
SET
  "description" = CASE
    WHEN target."serviceBacked" THEN lab."description"
    ELSE format(
      'Practice %s in a deterministic local workspace without unavailable external infrastructure.',
      lab."title"
    )
  END,
  "dockerImage" = CASE
    WHEN target."serviceBacked" THEN lab."dockerImage"
    ELSE 'aeroacademy/ubuntu-practice:22.04'
  END,
  "tasks" = CASE
    WHEN target."serviceBacked" THEN lab."tasks"
    ELSE COALESCE(
      (
        SELECT jsonb_agg(
          format(
            'Checkpoint %s: document "%s" in solution.md, then submit checkpoint-%s.',
            numbered."position",
            numbered."title",
            lower(left(numbered."id", 8))
          )
          ORDER BY numbered."position"
        )
        FROM (
          SELECT flag."id", flag."title", row_number() OVER (ORDER BY flag."id") AS "position"
          FROM "LabFlag" AS flag
          WHERE flag."labId" = lab."id"
        ) AS numbered
      ),
      '[]'::jsonb
    )
  END,
  "briefing" = CASE
    WHEN target."serviceBacked" THEN concat_ws(
      E'\n\n',
      NULLIF(lab."briefing", ''),
      '### Runtime mode: service-backed validation
### Repair cohort: final remaining labs
This lab uses its dedicated application image. Wait for the service health check, open the web interface, and complete the original checkpoints in the running target.'
    )
    ELSE format(
      '### Mission Objective
Complete %s in a deterministic local practice workspace.

### Runtime mode: portable artifact validation
### Repair cohort: final remaining labs
This exercise does not require external cloud accounts, host devices, nested container engines, desktop applications, GPUs, or a multi-node environment. Work only inside `/home/student/lab-work` and create a `solution.md` file containing your commands, configuration, analysis, and evidence.

### Checkpoints
%s

Submit the completion token shown for each checkpoint after documenting that checkpoint. Tokens and checks are stable across resets and new deployments.',
      lab."title",
      COALESCE(
        (
          SELECT string_agg(
            format(
              '%s. Document "%s" in solution.md. Completion token: `checkpoint-%s`',
              numbered."position",
              numbered."title",
              lower(left(numbered."id", 8))
            ),
            E'\n' ORDER BY numbered."position"
          )
          FROM (
            SELECT flag."id", flag."title", row_number() OVER (ORDER BY flag."id") AS "position"
            FROM "LabFlag" AS flag
            WHERE flag."labId" = lab."id"
          ) AS numbered
        ),
        'No checkpoints are configured for this lab.'
      )
    )
  END
FROM "_FinalLabRepairTarget" AS target
WHERE lab."id" = target."id";

DO $$
DECLARE
  repaired_count integer;
  portable_count integer;
  service_count integer;
BEGIN
  SELECT count(*) INTO repaired_count FROM "_FinalLabRepairTarget";
  SELECT count(*) INTO portable_count
  FROM "_FinalLabRepairTarget" WHERE NOT "serviceBacked";
  SELECT count(*) INTO service_count
  FROM "_FinalLabRepairTarget" WHERE "serviceBacked";

  IF repaired_count <> 405 OR portable_count <> 399 OR service_count <> 6 THEN
    RAISE EXCEPTION
      'Final lab repair target mismatch: total %, portable %, service-backed %',
      repaired_count, portable_count, service_count;
  END IF;
END $$;
