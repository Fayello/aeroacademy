-- Map Labs to Learning Outcomes based on title/description keywords

-- SYSTEMS outcomes
-- SYS1: Linux Process Management
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '989bd7ac-13fd-4e6f-b502-3ff3b334c350', 'a0000001-0000-0000-0000-000000000001', 1.0),
(gen_random_uuid(), '8cb79cf7-a12b-4e99-a050-9f067f2b604d', 'a0000001-0000-0000-0000-000000000001', 1.0),
(gen_random_uuid(), '5e42dba4-6d8a-4889-9a53-97e3511e0ebc', 'a0000001-0000-0000-0000-000000000001', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- SYS2: File System Operations
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), 'def2c670-6ec3-4a82-8df9-e1b74237df6e', 'a0000001-0000-0000-0000-000000000002', 1.0),
(gen_random_uuid(), '322a1e1c-b550-4cdb-b3f2-b7d59f9f503a', 'a0000001-0000-0000-0000-000000000002', 1.0),
(gen_random_uuid(), 'd4eb2f04-7abb-485c-94ae-d6aa46e99935', 'a0000001-0000-0000-0000-000000000002', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- SYS3: System Hardening
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), 'f6d4f425-9d67-4506-ae35-c713d671e033', 'a0000001-0000-0000-0000-000000000003', 1.0),
(gen_random_uuid(), 'ade24958-3672-4cf3-83d8-c9ebb02742ab', 'a0000001-0000-0000-0000-000000000003', 1.0),
(gen_random_uuid(), '419473fc-4546-42cc-bf9b-171641b05521', 'a0000001-0000-0000-0000-000000000003', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- SYS4: Shell Scripting
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), 'e5b52cdf-1435-4b77-896a-41a270c88021', 'a0000001-0000-0000-0000-000000000004', 1.0),
(gen_random_uuid(), 'ea46a43d-c6a5-40e9-93bb-e7f40f2a8572', 'a0000001-0000-0000-0000-000000000004', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- SYS5: Service Configuration
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '7bc1ef0e-30a3-4d97-84ce-e7cfc60f421e', 'a0000001-0000-0000-0000-000000000005', 1.0),
(gen_random_uuid(), '50d6a493-7898-473d-8287-137229593da9', 'a0000001-0000-0000-0000-000000000005', 1.0),
(gen_random_uuid(), '39444481-c0f1-4af3-9ac9-7223c18963a7', 'a0000001-0000-0000-0000-000000000005', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- SYS6: Disk & Storage Management
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), 'd4eb2f04-7abb-485c-94ae-d6aa46e99935', 'a0000001-0000-0000-0000-000000000006', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- SYS7: System Monitoring
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '91168c5d-2af5-4998-b0aa-5480fa2b43da', 'a0000001-0000-0000-0000-000000000007', 1.0),
(gen_random_uuid(), '4a07684f-30df-4ece-b9bc-57a2727769d4', 'a0000001-0000-0000-0000-000000000007', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- SYS8: User & Group Administration
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), 'def2c670-6ec3-4a82-8df9-e1b74237df6e', 'a0000001-0000-0000-0000-000000000008', 1.0),
(gen_random_uuid(), '322a1e1c-b550-4cdb-b3f2-b7d59f9f503a', 'a0000001-0000-0000-0000-000000000008', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- NETWORKING outcomes
-- NET1: TCP/IP Fundamentals
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), 'e0decd06-4a2e-4f94-965a-79854928514d', 'a0000002-0000-0000-0000-000000000001', 1.0),
(gen_random_uuid(), '884ee166-21d8-4336-a519-6ccdf111068c', 'a0000002-0000-0000-0000-000000000001', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- NET2: Network Protocol Analysis
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '884ee166-21d8-4336-a519-6ccdf111068c', 'a0000002-0000-0000-0000-000000000002', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- NET3: Firewall Configuration
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '884ee166-21d8-4336-a519-6ccdf111068c', 'a0000002-0000-0000-0000-000000000003', 1.0),
(gen_random_uuid(), 'c211f80d-bba0-4d2b-9004-5958c731a6b6', 'a0000002-0000-0000-0000-000000000003', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- NET4: DNS Management
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), 'e0decd06-4a2e-4f94-965a-79854928514d', 'a0000002-0000-0000-0000-000000000004', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- NET6: HTTP/HTTPS & Web Protocols
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '19200b65-cad3-4667-9c99-67a384e89b73', 'a0000002-0000-0000-0000-000000000006', 1.0),
(gen_random_uuid(), 'c211f80d-bba0-4d2b-9004-5958c731a6b6', 'a0000002-0000-0000-0000-000000000006', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- NET7: Network Security Monitoring
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '884ee166-21d8-4336-a519-6ccdf111068c', 'a0000002-0000-0000-0000-000000000007', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- NET8: VPN & Tunneling
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '884ee166-21d8-4336-a519-6ccdf111068c', 'a0000002-0000-0000-0000-000000000008', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- DEVOPS outcomes
-- DEV1: Containerization
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '8f5af76d-8355-42dd-bbd2-37a10a896dc1', 'a0000003-0000-0000-0000-000000000001', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- DEV2: CI/CD Pipeline Design
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), 'db2d2817-5c84-4d6e-b1a7-2e1051fee251', 'a0000003-0000-0000-0000-000000000002', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- DEV3: Infrastructure as Code
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), 'ea46a43d-c6a5-40e9-93bb-e7f40f2a8572', 'a0000003-0000-0000-0000-000000000003', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- DEV5: Version Control & Collaboration
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), 'db2d2817-5c84-4d6e-b1a7-2e1051fee251', 'a0000003-0000-0000-0000-000000000005', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- DEV6: Monitoring & Observability
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '91168c5d-2af5-4998-b0aa-5480fa2b43da', 'a0000003-0000-0000-0000-000000000006', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- DEV7: Automation & Scripting
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), 'ea46a43d-c6a5-40e9-93bb-e7f40f2a8572', 'a0000003-0000-0000-0000-000000000007', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- DEV8: Container Orchestration
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '19796c88-1a0a-4c0c-ba7d-4422edecb4fe', 'a0000003-0000-0000-0000-000000000008', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- DATABASES outcomes
-- DBA1: SQL Query Writing
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '11dc0358-43a4-4f7c-b6eb-e12274be5ff9', 'a0000004-0000-0000-0000-000000000001', 1.0),
(gen_random_uuid(), '88de7b45-d1c8-4d13-97df-66805199f591', 'a0000004-0000-0000-0000-000000000001', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- DBA2: Database Design & Normalization
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '11dc0358-43a4-4f7c-b6eb-e12274be5ff9', 'a0000004-0000-0000-0000-000000000002', 1.0),
(gen_random_uuid(), '88de7b45-d1c8-4d13-97df-66805199f591', 'a0000004-0000-0000-0000-000000000002', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- DBA3: Database Security
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '11dc0358-43a4-4f7c-b6eb-e12274be5ff9', 'a0000004-0000-0000-0000-000000000003', 1.0),
(gen_random_uuid(), '88de7b45-d1c8-4d13-97df-66805199f591', 'a0000004-0000-0000-0000-000000000003', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- DBA5: Backup & Recovery
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), 'eb5f9027-80b5-4611-a37d-b3223cf314d2', 'a0000004-0000-0000-0000-000000000005', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- SECURITY outcomes
-- SEC1: Vulnerability Assessment
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '2984df50-7e04-45a3-b5c1-05c5769d13ec', 'a0000005-0000-0000-0000-000000000001', 1.0),
(gen_random_uuid(), '1de4f6e8-cea4-4770-a4f0-a37fd6303941', 'a0000005-0000-0000-0000-000000000001', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- SEC2: Web Application Security
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), 'fe4537d4-26f0-490d-ab31-d0bf480438c0', 'a0000005-0000-0000-0000-000000000002', 1.0),
(gen_random_uuid(), 'ec751ad2-399b-4ec8-8556-ac12cb4d231a', 'a0000005-0000-0000-0000-000000000002', 1.0),
(gen_random_uuid(), 'f85ec687-5b86-40e2-a73b-5366652a4b10', 'a0000005-0000-0000-0000-000000000002', 1.0),
(gen_random_uuid(), '9c861331-b3f2-4322-94d5-bc64f312f46e', 'a0000005-0000-0000-0000-000000000002', 1.0),
(gen_random_uuid(), '19200b65-cad3-4667-9c99-67a384e89b73', 'a0000005-0000-0000-0000-000000000002', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- SEC3: Penetration Testing Methodology
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '869c9fbc-601d-460d-8ef1-fcac9a62d08a', 'a0000005-0000-0000-0000-000000000003', 1.0),
(gen_random_uuid(), '2984df50-7e04-45a3-b5c1-05c5769d13ec', 'a0000005-0000-0000-0000-000000000003', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- SEC6: Secure Configuration Management
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), 'f6d4f425-9d67-4506-ae35-c713d671e033', 'a0000005-0000-0000-0000-000000000006', 1.0),
(gen_random_uuid(), 'ade24958-3672-4cf3-83d8-c9ebb02742ab', 'a0000005-0000-0000-0000-000000000006', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- SEC7: OSINT & Reconnaissance
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '1de4f6e8-cea4-4770-a4f0-a37fd6303941', 'a0000005-0000-0000-0000-000000000007', 1.0),
(gen_random_uuid(), '45dfba8f-3775-4595-b47f-8b8654beb43f', 'a0000005-0000-0000-0000-000000000007', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- QA outcomes
-- QA3: API Testing
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), '19200b65-cad3-4667-9c99-67a384e89b73', 'a0000006-0000-0000-0000-000000000003', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;

-- QA6: Security Testing
INSERT INTO "LabOutcome" ("id", "labId", "learningOutcomeId", "weight") VALUES
(gen_random_uuid(), 'fe4537d4-26f0-490d-ab31-d0bf480438c0', 'a0000006-0000-0000-0000-000000000006', 1.0),
(gen_random_uuid(), 'c211f80d-bba0-4d2b-9004-5958c731a6b6', 'a0000006-0000-0000-0000-000000000006', 1.0)
ON CONFLICT ("labId", "learningOutcomeId") DO NOTHING;
