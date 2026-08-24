-- Seed Learning Outcomes per Domain
-- Domain IDs: SYSTEMS=59b95565, NETWORKING=26ffbc52, DEVOPS=13a0f49d, DATABASES=e0b42edc, SECURITY=795e7236, QA=486a912e

-- SYSTEMS
INSERT INTO "LearningOutcome" ("id", "code", "title", "description", "domainId", "weight", "createdAt") VALUES
('a0000001-0000-0000-0000-000000000001', 'SYS1', 'Linux Process Management', 'Create, monitor, and manage processes, services, and system resources on Linux systems', '59b95565-e6aa-47c4-a0a6-b1cd14652c81', 1.2, NOW()),
('a0000001-0000-0000-0000-000000000002', 'SYS2', 'File System Operations', 'Navigate, manipulate, and secure file systems using standard Linux tools and permissions', '59b95565-e6aa-47c4-a0a6-b1cd14652c81', 1.0, NOW()),
('a0000001-0000-0000-0000-000000000003', 'SYS3', 'System Hardening', 'Apply security best practices to harden a Linux system against common attack vectors', '59b95565-e6aa-47c4-a0a6-b1cd14652c81', 1.3, NOW()),
('a0000001-0000-0000-0000-000000000004', 'SYS4', 'Shell Scripting', 'Write and debug shell scripts to automate system administration tasks', '59b95565-e6aa-47c4-a0a6-b1cd14652c81', 1.0, NOW()),
('a0000001-0000-0000-0000-000000000005', 'SYS5', 'Service Configuration', 'Install, configure, and troubleshoot system services and daemons', '59b95565-e6aa-47c4-a0a6-b1cd14652c81', 1.1, NOW()),
('a0000001-0000-0000-0000-000000000006', 'SYS6', 'Disk & Storage Management', 'Partition, format, mount, and manage storage devices and filesystems', '59b95565-e6aa-47c4-a0a6-b1cd14652c81', 1.0, NOW()),
('a0000001-0000-0000-0000-000000000007', 'SYS7', 'System Monitoring', 'Use monitoring tools to analyze system performance, logs, and resource usage', '59b95565-e6aa-47c4-a0a6-b1cd14652c81', 1.0, NOW()),
('a0000001-0000-0000-0000-000000000008', 'SYS8', 'User & Group Administration', 'Manage user accounts, groups, sudo access, and authentication policies', '59b95565-e6aa-47c4-a0a6-b1cd14652c81', 1.1, NOW())
ON CONFLICT ("domainId", "code") DO NOTHING;

-- NETWORKING
INSERT INTO "LearningOutcome" ("id", "code", "title", "description", "domainId", "weight", "createdAt") VALUES
('a0000002-0000-0000-0000-000000000001', 'NET1', 'TCP/IP Fundamentals', 'Understand the TCP/IP model, IP addressing, subnetting, and routing basics', '26ffbc52-1f74-4265-8543-4d658962ff38', 1.3, NOW()),
('a0000002-0000-0000-0000-000000000002', 'NET2', 'Network Protocol Analysis', 'Capture and analyze network traffic using tools like tcpdump and Wireshark', '26ffbc52-1f74-4265-8543-4d658962ff38', 1.2, NOW()),
('a0000002-0000-0000-0000-000000000003', 'NET3', 'Firewall Configuration', 'Configure iptables/nftables and cloud security groups to control network access', '26ffbc52-1f74-4265-8543-4d658962ff38', 1.2, NOW()),
('a0000002-0000-0000-0000-000000000004', 'NET4', 'DNS Management', 'Configure DNS records, troubleshoot resolution, and understand DNS security', '26ffbc52-1f74-4265-8543-4d658962ff38', 1.1, NOW()),
('a0000002-0000-0000-0000-000000000005', 'NET5', 'Network Troubleshooting', 'Diagnose connectivity issues using ping, traceroute, netstat, and ss', '26ffbc52-1f74-4265-8543-4d658962ff38', 1.0, NOW()),
('a0000002-0000-0000-0000-000000000006', 'NET6', 'HTTP/HTTPS & Web Protocols', 'Understand HTTP methods, headers, TLS handshake, and certificate management', '26ffbc52-1f74-4265-8543-4d658962ff38', 1.1, NOW()),
('a0000002-0000-0000-0000-000000000007', 'NET7', 'Network Security Monitoring', 'Monitor network traffic for anomalies, intrusions, and policy violations', '26ffbc52-1f74-4265-8543-4d658962ff38', 1.2, NOW()),
('a0000002-0000-0000-0000-000000000008', 'NET8', 'VPN & Tunneling', 'Configure and troubleshoot VPNs, SSH tunnels, and encrypted network paths', '26ffbc52-1f74-4265-8543-4d658962ff38', 1.0, NOW())
ON CONFLICT ("domainId", "code") DO NOTHING;

-- DEVOPS
INSERT INTO "LearningOutcome" ("id", "code", "title", "description", "domainId", "weight", "createdAt") VALUES
('a0000003-0000-0000-0000-000000000001', 'DEV1', 'Containerization', 'Build, run, and manage Docker containers and compose multi-service applications', '13a0f49d-e268-4e57-8329-03e9736e2cb2', 1.3, NOW()),
('a0000003-0000-0000-0000-000000000002', 'DEV2', 'CI/CD Pipeline Design', 'Design and implement continuous integration and deployment pipelines', '13a0f49d-e268-4e57-8329-03e9736e2cb2', 1.2, NOW()),
('a0000003-0000-0000-0000-000000000003', 'DEV3', 'Infrastructure as Code', 'Use IaC tools to provision and manage cloud infrastructure declaratively', '13a0f49d-e268-4e57-8329-03e9736e2cb2', 1.2, NOW()),
('a0000003-0000-0000-0000-000000000004', 'DEV4', 'Cloud Resource Management', 'Deploy and manage applications on cloud platforms (AWS, Azure, GCP)', '13a0f49d-e268-4e57-8329-03e9736e2cb2', 1.1, NOW()),
('a0000003-0000-0000-0000-000000000005', 'DEV5', 'Version Control & Collaboration', 'Use Git effectively for branching, merging, and team collaboration workflows', '13a0f49d-e268-4e57-8329-03e9736e2cb2', 1.0, NOW()),
('a0000003-0000-0000-0000-000000000006', 'DEV6', 'Monitoring & Observability', 'Set up logging, metrics, and tracing for production systems', '13a0f49d-e268-4e57-8329-03e9736e2cb2', 1.1, NOW()),
('a0000003-0000-0000-0000-000000000007', 'DEV7', 'Automation & Scripting', 'Automate repetitive infrastructure and deployment tasks', '13a0f49d-e268-4e57-8329-03e9736e2cb2', 1.0, NOW()),
('a0000003-0000-0000-0000-000000000008', 'DEV8', 'Container Orchestration', 'Manage containerized workloads using Kubernetes or Docker Swarm', '13a0f49d-e268-4e57-8329-03e9736e2cb2', 1.2, NOW())
ON CONFLICT ("domainId", "code") DO NOTHING;

-- DATABASES
INSERT INTO "LearningOutcome" ("id", "code", "title", "description", "domainId", "weight", "createdAt") VALUES
('a0000004-0000-0000-0000-000000000001', 'DBA1', 'SQL Query Writing', 'Write complex SQL queries with joins, subqueries, aggregations, and window functions', 'e0b42edc-551e-4016-9cc5-55dc219b381e', 1.3, NOW()),
('a0000004-0000-0000-0000-000000000002', 'DBA2', 'Database Design & Normalization', 'Design normalized schemas, ER diagrams, and optimize data structures', 'e0b42edc-551e-4016-9cc5-55dc219b381e', 1.2, NOW()),
('a0000004-0000-0000-0000-000000000003', 'DBA3', 'Database Security', 'Implement access controls, encryption, and audit trails for databases', 'e0b42edc-551e-4016-9cc5-55dc219b381e', 1.2, NOW()),
('a0000004-0000-0000-0000-000000000004', 'DBA4', 'Query Optimization', 'Analyze query execution plans and optimize performance using indexes', 'e0b42edc-551e-4016-9cc5-55dc219b381e', 1.1, NOW()),
('a0000004-0000-0000-0000-000000000005', 'DBA5', 'Backup & Recovery', 'Implement and test backup strategies, point-in-time recovery, and failover', 'e0b42edc-551e-4016-9cc5-55dc219b381e', 1.0, NOW()),
('a0000004-0000-0000-0000-000000000006', 'DBA6', 'NoSQL Operations', 'Work with document, key-value, and graph databases for appropriate use cases', 'e0b42edc-551e-4016-9cc5-55dc219b381e', 1.0, NOW()),
('a0000004-0000-0000-0000-000000000007', 'DBA7', 'Data Migration', 'Plan and execute data migrations between systems with zero/minimal downtime', 'e0b42edc-551e-4016-9cc5-55dc219b381e', 1.1, NOW())
ON CONFLICT ("domainId", "code") DO NOTHING;

-- SECURITY
INSERT INTO "LearningOutcome" ("id", "code", "title", "description", "domainId", "weight", "createdAt") VALUES
('a0000005-0000-0000-0000-000000000001', 'SEC1', 'Vulnerability Assessment', 'Identify and classify vulnerabilities using scanning tools and manual techniques', '795e7236-bb1f-4723-835f-9b54ca7ab599', 1.3, NOW()),
('a0000005-0000-0000-0000-000000000002', 'SEC2', 'Web Application Security', 'Understand and test for OWASP Top 10 vulnerabilities (XSS, SQLi, CSRF, etc.)', '795e7236-bb1f-4723-835f-9b54ca7ab599', 1.3, NOW()),
('a0000005-0000-0000-0000-000000000003', 'SEC3', 'Penetration Testing Methodology', 'Follow structured pentest methodologies: recon, exploitation, post-exploitation, reporting', '795e7236-bb1f-4723-835f-9b54ca7ab599', 1.2, NOW()),
('a0000005-0000-0000-0000-000000000004', 'SEC4', 'Cryptography Fundamentals', 'Understand symmetric/asymmetric encryption, hashing, and key management', '795e7236-bb1f-4723-835f-9b54ca7ab599', 1.1, NOW()),
('a0000005-0000-0000-0000-000000000005', 'SEC5', 'Incident Response', 'Detect, contain, eradicate, and recover from security incidents', '795e7236-bb1f-4723-835f-9b54ca7ab599', 1.2, NOW()),
('a0000005-0000-0000-0000-000000000006', 'SEC6', 'Secure Configuration Management', 'Apply security baselines to servers, networks, and applications', '795e7236-bb1f-4723-835f-9b54ca7ab599', 1.1, NOW()),
('a0000005-0000-0000-0000-000000000007', 'SEC7', 'OSINT & Reconnaissance', 'Gather and analyze publicly available information for security assessments', '795e7236-bb1f-4723-835f-9b54ca7ab599', 1.0, NOW()),
('a0000005-0000-0000-0000-000000000008', 'SEC8', 'Malware Analysis Basics', 'Identify and classify malware samples using static and dynamic analysis', '795e7236-bb1f-4723-835f-9b54ca7ab599', 1.1, NOW())
ON CONFLICT ("domainId", "code") DO NOTHING;

-- QA
INSERT INTO "LearningOutcome" ("id", "code", "title", "description", "domainId", "weight", "createdAt") VALUES
('a0000006-0000-0000-0000-000000000001', 'QA1', 'Test Planning & Strategy', 'Design comprehensive test plans covering functional, non-functional, and regression testing', '486a912e-a0a2-4847-85ee-79f1b0471e87', 1.2, NOW()),
('a0000006-0000-0000-0000-000000000002', 'QA2', 'Automated Testing', 'Write and maintain automated test suites (unit, integration, e2e)', '486a912e-a0a2-4847-85ee-79f1b0471e87', 1.2, NOW()),
('a0000006-0000-0000-0000-000000000003', 'QA3', 'API Testing', 'Test RESTful/GraphQL APIs for correctness, performance, and security', '486a912e-a0a2-4847-85ee-79f1b0471e87', 1.1, NOW()),
('a0000006-0000-0000-0000-000000000004', 'QA4', 'Performance Testing', 'Conduct load, stress, and endurance testing to validate system performance', '486a912e-a0a2-4847-85ee-79f1b0471e87', 1.1, NOW()),
('a0000006-0000-0000-0000-000000000005', 'QA5', 'Bug Reporting & Triage', 'Document defects clearly, prioritize them, and track resolution progress', '486a912e-a0a2-4847-85ee-79f1b0471e87', 1.0, NOW()),
('a0000006-0000-0000-0000-000000000006', 'QA6', 'Security Testing', 'Integrate security testing into QA workflows (SAST, DAST, dependency scanning)', '486a912e-a0a2-4847-85ee-79f1b0471e87', 1.2, NOW()),
('a0000006-0000-0000-0000-000000000007', 'QA7', 'Quality Metrics & Analytics', 'Measure and analyze test coverage, defect rates, and quality trends', '486a912e-a0a2-4847-85ee-79f1b0471e87', 1.0, NOW())
ON CONFLICT ("domainId", "code") DO NOTHING;
