-- Seed Practical Assessments per Domain
-- Each domain gets 1 assessment with 3-5 scenarios

-- 1. SYSTEMS: Linux Server Administration Assessment
INSERT INTO "PracticalAssessment" ("id", "title", "description", "domainId", "timeLimit", "maxScore", "isActive", "createdAt") VALUES
('b0000001-0000-0000-0000-000000000001', 'Linux Server Administration', 'Demonstrate proficiency in Linux system administration including process management, file operations, user administration, and service configuration.', '59b95565-e6aa-47c4-a0a6-b1cd14652c81', 90, 100, true, NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AssessmentScenario" ("id", "assessmentId", "title", "description", "order", "maxScore", "expectedSteps", "expectedState") VALUES
('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Process Management', 'Identify and manage running processes. Find a specific process, check its resource usage, and restart it as a systemd service.', 1, 25, '["ps/top to identify process", "Check resource usage", "Restart via systemctl"]', '{"serviceRunning": true, "processManaged": true}'),
('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 'File System Operations', 'Navigate the filesystem, create directories with proper permissions, set up ACLs, and verify file ownership.', 2, 25, '["Navigate to target dir", "Create with correct permissions", "Set ACLs", "Verify ownership"]', '{"dirsCreated": true, "permissionsCorrect": true}'),
('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', 'User & Group Administration', 'Create users, assign groups, configure sudo access, and set password policies.', 3, 25, '["Create user", "Assign to groups", "Configure sudoers", "Set password policy"]', '{"userCreated": true, "sudoConfigured": true}'),
('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001', 'Service Configuration', 'Install and configure a system service (nginx/apache), set up virtual hosts, and verify it starts on boot.', 4, 25, '["Install service", "Configure virtual host", "Enable on boot", "Verify running"]', '{"serviceInstalled": true, "vhostConfigured": true, "bootEnabled": true}')
ON CONFLICT ("id") DO NOTHING;

-- Link SYS assessment to outcomes
INSERT INTO "AssessmentOutcome" ("id", "assessmentId", "learningOutcomeId", "weight") VALUES
('d0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 1.0),
('d0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 1.0),
('d0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000008', 1.0),
('d0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000005', 1.0)
ON CONFLICT ("id") DO NOTHING;

-- 2. NETWORKING: Network Infrastructure Assessment
INSERT INTO "PracticalAssessment" ("id", "title", "description", "domainId", "timeLimit", "maxScore", "isActive", "createdAt") VALUES
('b0000001-0000-0000-0000-000000000002', 'Network Infrastructure', 'Demonstrate networking skills including traffic analysis, firewall configuration, DNS management, and VPN setup.', '26ffbc52-1f74-4265-8543-4d658962ff38', 90, 100, true, NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AssessmentScenario" ("id", "assessmentId", "title", "description", "order", "maxScore", "expectedSteps", "expectedState") VALUES
('c0000002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002', 'Traffic Analysis', 'Capture network traffic using tcpdump, filter by protocol, and identify suspicious patterns.', 1, 25, '["Start capture", "Apply filters", "Analyze packets", "Identify anomalies"]', '{"captureComplete": true, "anomaliesIdentified": true}'),
('c0000002-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 'Firewall Rules', 'Configure iptables/nftables rules to allow HTTP/HTTPS, block specific IPs, and log dropped packets.', 2, 25, '["Define rule set", "Apply rules", "Test connectivity", "Verify logging"]', '{"rulesApplied": true, "connectivityVerified": true}'),
('c0000002-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000002', 'DNS Configuration', 'Set up forward and reverse DNS zones, configure BIND9, and verify resolution.', 3, 25, '["Configure zone files", "Set up BIND9", "Add records", "Test resolution"]', '{"zoneConfigured": true, "resolutionWorking": true}'),
('c0000002-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000002', 'VPN Setup', 'Configure an OpenVPN server, generate client certificates, and verify encrypted tunnel.', 4, 25, '["Generate CA", "Configure server", "Create client certs", "Test tunnel"]', '{"vpnRunning": true, "tunnelEncrypted": true}')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AssessmentOutcome" ("id", "assessmentId", "learningOutcomeId", "weight") VALUES
('d0000002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002', 'a0000002-0000-0000-0000-000000000002', 1.0),
('d0000002-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 'a0000002-0000-0000-0000-000000000003', 1.0),
('d0000002-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000002', 'a0000002-0000-0000-0000-000000000004', 1.0),
('d0000002-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000002', 'a0000002-0000-0000-0000-000000000008', 1.0)
ON CONFLICT ("id") DO NOTHING;

-- 3. DEVOPS: Container & Cloud Assessment
INSERT INTO "PracticalAssessment" ("id", "title", "description", "domainId", "timeLimit", "maxScore", "isActive", "createdAt") VALUES
('b0000001-0000-0000-0000-000000000003', 'Container & Cloud Operations', 'Demonstrate DevOps skills including Docker containerization, CI/CD pipelines, IaC, and monitoring.', '13a0f49d-e268-4e57-8329-03e9736e2cb2', 90, 100, true, NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AssessmentScenario" ("id", "assessmentId", "title", "description", "order", "maxScore", "expectedSteps", "expectedState") VALUES
('c0000003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000003', 'Docker Containerization', 'Write a Dockerfile for a multi-stage build, create a docker-compose.yml with networking and volumes.', 1, 25, '["Write Dockerfile", "Multi-stage build", "Create compose file", "Configure networking"]', '{"imageBuilt": true, "composeWorking": true}'),
('c0000003-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000003', 'CI/CD Pipeline', 'Configure a GitHub Actions pipeline with build, test, and deploy stages.', 2, 25, '["Define workflow", "Add build step", "Add test step", "Add deploy step"]', '{"pipelineConfigured": true, "stagesDefined": true}'),
('c0000003-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', 'Infrastructure as Code', 'Write a Terraform configuration to provision infrastructure on a cloud provider.', 3, 25, '["Define provider", "Create resources", "Configure variables", "Plan and apply"]', '{"infraProvisioned": true, "tfPlanClean": true}'),
('c0000003-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000003', 'Monitoring Setup', 'Deploy Prometheus + Grafana stack, configure alerts, and create a dashboard.', 4, 25, '["Deploy Prometheus", "Configure exporters", "Set up Grafana", "Create dashboard"]', '{"prometheusRunning": true, "grafanaDashboard": true}')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AssessmentOutcome" ("id", "assessmentId", "learningOutcomeId", "weight") VALUES
('d0000003-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000003', 'a0000003-0000-0000-0000-000000000001', 1.0),
('d0000003-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000003', 'a0000003-0000-0000-0000-000000000002', 1.0),
('d0000003-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', 'a0000003-0000-0000-0000-000000000003', 1.0),
('d0000003-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000003', 'a0000003-0000-0000-0000-000000000006', 1.0)
ON CONFLICT ("id") DO NOTHING;

-- 4. DATABASES: Database Administration Assessment
INSERT INTO "PracticalAssessment" ("id", "title", "description", "domainId", "timeLimit", "maxScore", "isActive", "createdAt") VALUES
('b0000001-0000-0000-0000-000000000004', 'Database Administration', 'Demonstrate database skills including SQL queries, schema design, security, and backup strategies.', 'e0b42edc-551e-4016-9cc5-55dc219b381e', 90, 100, true, NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AssessmentScenario" ("id", "assessmentId", "title", "description", "order", "maxScore", "expectedSteps", "expectedState") VALUES
('c0000004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000004', 'SQL Query Writing', 'Write complex queries with JOINs, subqueries, aggregations, and window functions.', 1, 25, '["Write JOINs", "Use subqueries", "Apply aggregations", "Use window functions"]', '{"queriesExecute": true, "resultsCorrect": true}'),
('c0000004-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000004', 'Schema Design', 'Design a normalized database schema with proper relationships, indexes, and constraints.', 2, 25, '["Create ER diagram", "Normalize to 3NF", "Add indexes", "Define constraints"]', '{"schemaDesigned": true, "normalized": true}'),
('c0000004-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000004', 'Database Security', 'Implement role-based access, configure SSL, set up audit logging.', 3, 25, '["Create roles", "Grant permissions", "Enable SSL", "Configure auditing"]', '{"rolesCreated": true, "sslEnabled": true}'),
('c0000004-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', 'Backup & Recovery', 'Set up automated backups, test point-in-time recovery, verify data integrity.', 4, 25, '["Configure backups", "Schedule automation", "Test recovery", "Verify integrity"]', '{"backupScheduled": true, "recoveryTested": true}')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AssessmentOutcome" ("id", "assessmentId", "learningOutcomeId", "weight") VALUES
('d0000004-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000004', 'a0000004-0000-0000-0000-000000000001', 1.0),
('d0000004-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000004', 'a0000004-0000-0000-0000-000000000002', 1.0),
('d0000004-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000004', 'a0000004-0000-0000-0000-000000000003', 1.0),
('d0000004-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', 'a0000004-0000-0000-0000-000000000005', 1.0)
ON CONFLICT ("id") DO NOTHING;

-- 5. SECURITY: Penetration Testing Assessment
INSERT INTO "PracticalAssessment" ("id", "title", "description", "domainId", "timeLimit", "maxScore", "isActive", "createdAt") VALUES
('b0000001-0000-0000-0000-000000000005', 'Penetration Testing Methodology', 'Demonstrate penetration testing skills following a structured methodology: reconnaissance, scanning, exploitation, and reporting.', '795e7236-bb1f-4723-835f-9b54ca7ab599', 120, 100, true, NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AssessmentScenario" ("id", "assessmentId", "title", "description", "order", "maxScore", "expectedSteps", "expectedState") VALUES
('c0000005-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000005', 'Reconnaissance', 'Gather information about the target using OSINT, DNS enumeration, and port scanning.', 1, 25, '["OSINT gathering", "DNS enumeration", "Port scanning", "Service identification"]', '{"reconComplete": true, "targetsIdentified": true}'),
('c0000005-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000005', 'Vulnerability Analysis', 'Identify vulnerabilities using automated scanners and manual techniques.', 2, 25, '["Run vulnerability scanner", "Manual testing", "Analyze results", "Prioritize findings"]', '{"vulnsIdentified": true, "prioritized": true}'),
('c0000005-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000005', 'Exploitation', 'Exploit identified vulnerabilities to gain access, escalate privileges.', 3, 25, '["Select exploit", "Gain initial access", "Escalate privileges", "Maintain access"]', '{"accessGained": true, "privilegesEscalated": true}'),
('c0000005-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000005', 'Reporting', 'Document findings with executive summary, technical details, and remediation steps.', 4, 25, '["Executive summary", "Technical findings", "Remediation steps", "Risk ratings"]', '{"reportComplete": true, "remediationsProvided": true}')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AssessmentOutcome" ("id", "assessmentId", "learningOutcomeId", "weight") VALUES
('d0000005-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000005', 'a0000005-0000-0000-0000-000000000001', 1.0),
('d0000005-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000005', 'a0000005-0000-0000-0000-000000000002', 1.0),
('d0000005-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000005', 'a0000005-0000-0000-0000-000000000003', 1.0),
('d0000005-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000005', 'a0000005-0000-0000-0000-000000000005', 1.0)
ON CONFLICT ("id") DO NOTHING;

-- 6. QA: Quality Assurance Assessment
INSERT INTO "PracticalAssessment" ("id", "title", "description", "domainId", "timeLimit", "maxScore", "isActive", "createdAt") VALUES
('b0000001-0000-0000-0000-000000000006', 'Quality Assurance Engineering', 'Demonstrate QA skills including test planning, automated testing, API testing, and security testing.', '486a912e-a0a2-4847-85ee-79f1b0471e87', 90, 100, true, NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AssessmentScenario" ("id", "assessmentId", "title", "description", "order", "maxScore", "expectedSteps", "expectedState") VALUES
('c0000006-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000006', 'Test Planning', 'Create a comprehensive test plan covering functional, non-functional, and regression scenarios.', 1, 25, '["Define scope", "Write test cases", "Plan environment", "Define acceptance criteria"]', '{"planComplete": true, "testCasesWritten": true}'),
('c0000006-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000006', 'Automated Testing', 'Write and run unit tests, integration tests, and end-to-end tests.', 2, 25, '["Write unit tests", "Write integration tests", "Write e2e tests", "Run test suite"]', '{"testsPass": true, "coverageAdequate": true}'),
('c0000006-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000006', 'API Testing', 'Test RESTful APIs for correctness, error handling, and performance.', 3, 25, '["Test endpoints", "Validate responses", "Test error cases", "Check performance"]', '{"apiTested": true, "errorsHandled": true}'),
('c0000006-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000006', 'Security Testing', 'Perform basic security testing: XSS, SQLi, CSRF checks.', 4, 25, '["Test for XSS", "Test for SQLi", "Test for CSRF", "Document findings"]', '{"securityTested": true, "vulnsDocumented": true}')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AssessmentOutcome" ("id", "assessmentId", "learningOutcomeId", "weight") VALUES
('d0000006-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000006', 'a0000006-0000-0000-0000-000000000001', 1.0),
('d0000006-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000006', 'a0000006-0000-0000-0000-000000000002', 1.0),
('d0000006-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000006', 'a0000006-0000-0000-0000-000000000003', 1.0),
('d0000006-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000006', 'a0000006-0000-0000-0000-000000000006', 1.0)
ON CONFLICT ("id") DO NOTHING;
