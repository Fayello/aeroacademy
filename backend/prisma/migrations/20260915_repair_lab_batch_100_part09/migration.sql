-- Generated from prisma/lab-repair-batch-02.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Complete WebAssembly Security Analysis in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete WebAssembly Security Analysis in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Disassembler", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Function Analyzer", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Memory Analyzer", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Crypto Analyzer", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Integrity Verifier", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Disassembler\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Function Analyzer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Memory Analyzer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Crypto Analyzer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Integrity Verifier\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'WebAssembly Security Analysis';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: wasm2wat module.wasm -o module.wat'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'WebAssembly Security Analysis'
)
AND "title" = 'Disassembler';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: grep -E ''call (env\.)?(crypto|eval|exec)'' module.wat'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'WebAssembly Security Analysis'
)
AND "title" = 'Function Analyzer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: grep -E ''i32\.load|i32\.store'' module.wat | head -20'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'WebAssembly Security Analysis'
)
AND "title" = 'Memory Analyzer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Identify S-box, key schedule, and round function patterns in WASM'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'WebAssembly Security Analysis'
)
AND "title" = 'Crypto Analyzer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: sha256sum module.wasm && compare with known-good hash'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'WebAssembly Security Analysis'
)
AND "title" = 'Integrity Verifier';

UPDATE "Lab"
SET
  "description" = 'Complete Secure Microservices Architecture in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Secure Microservices Architecture in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "mTLS Implementer", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Gateway Deployer", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Auth Policy Creator", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Tracing Configurer", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Vault Injector", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"mTLS Implementer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Gateway Deployer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Auth Policy Creator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Tracing Configurer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Vault Injector\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Secure Microservices Architecture';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Generate per-service certificates, configure mTLS in service mesh'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Microservices Architecture'
)
AND "title" = 'mTLS Implementer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Configure Kong/Traefik with JWT validation and rate limiting'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Microservices Architecture'
)
AND "title" = 'Gateway Deployer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: if (caller.service != ''payment-service'') { deny(); }'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Microservices Architecture'
)
AND "title" = 'Auth Policy Creator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: OpenTelemetry collector with trace context propagation'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Microservices Architecture'
)
AND "title" = 'Tracing Configurer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Sidecar container fetches secrets from Vault and writes to shared volume'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Microservices Architecture'
)
AND "title" = 'Vault Injector';

UPDATE "Lab"
SET
  "description" = 'Complete Fuzzing & Property-Based Testing for Security in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Fuzzing & Property-Based Testing for Security in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "AFL Fuzzer", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "LibFuzzer Runner", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Hypothesis Tester", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Crash Minimizer", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "CI Fuzzer", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"AFL Fuzzer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"LibFuzzer Runner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Hypothesis Tester\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Crash Minimizer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"CI Fuzzer\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Fuzzing & Property-Based Testing for Security';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: afl-fuzz -i seeds/ -o findings/ ./target @@'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Fuzzing & Property-Based Testing for Security'
)
AND "title" = 'AFL Fuzzer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: clang -fsanitize=fuzzer,address target.c && ./a.out corpus/'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Fuzzing & Property-Based Testing for Security'
)
AND "title" = 'LibFuzzer Runner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: @given(data=st.text()) def test_parse(data): parse(data)'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Fuzzing & Property-Based Testing for Security'
)
AND "title" = 'Hypothesis Tester';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: afl-tmin -i crash_input -o minimized -- ./target @@'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Fuzzing & Property-Based Testing for Security'
)
AND "title" = 'Crash Minimizer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: afl-fuzz -V 3600 -i seeds/ -o findings/ ./target @@'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Fuzzing & Property-Based Testing for Security'
)
AND "title" = 'CI Fuzzer';

UPDATE "Lab"
SET
  "description" = 'Complete Secure Logging, Monitoring & Incident Response in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Secure Logging, Monitoring & Incident Response in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "ELK Deployer", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Filebeat Configurer", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Kibana Dashboard", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Wazuh Rule Creator", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Incident Playbook", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"ELK Deployer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Filebeat Configurer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Kibana Dashboard\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Wazuh Rule Creator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Incident Playbook\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Secure Logging, Monitoring & Incident Response';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: docker-compose up -d elasticsearch logstash kibana'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Logging, Monitoring & Incident Response'
)
AND "title" = 'ELK Deployer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: filebeat.inputs: - type: log paths: [''/var/log/auth.log'']'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Logging, Monitoring & Incident Response'
)
AND "title" = 'Filebeat Configurer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Visualize: failed logins per hour, top attackers, geo map'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Logging, Monitoring & Incident Response'
)
AND "title" = 'Kibana Dashboard';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: <rule id=''100101'' level=''10''><decoded_as>sshd</decoded_as><field name=''sshd.invalid_user''>yes</field></rule>'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Logging, Monitoring & Incident Response'
)
AND "title" = 'Wazuh Rule Creator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: 1. Detect 2. Triage 3. Contain 4. Eradicate 5. Recover 6. Lessons learned'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Logging, Monitoring & Incident Response'
)
AND "title" = 'Incident Playbook';

UPDATE "Lab"
SET
  "description" = 'Complete Penetration Testing Methodology (PTES) in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Penetration Testing Methodology (PTES) in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Info Gatherer", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Vuln Scanner", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Exploiter", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Lateral Mover", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Report Writer", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Info Gatherer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Vuln Scanner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Exploiter\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Lateral Mover\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Report Writer\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Penetration Testing Methodology (PTES)';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: theHarvester -d target.com -b google,linkedin,github'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Penetration Testing Methodology (PTES)'
)
AND "title" = 'Info Gatherer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: nmap --script vuln -sV target.com'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Penetration Testing Methodology (PTES)'
)
AND "title" = 'Vuln Scanner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: msfconsole -x ''use exploit/multi/handler; set PAYLOAD linux/x64/meterpreter/reverse_tcp'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Penetration Testing Methodology (PTES)'
)
AND "title" = 'Exploiter';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Crack hash -> use credential -> pivot to next host'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Penetration Testing Methodology (PTES)'
)
AND "title" = 'Lateral Mover';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Executive summary, methodology, findings with CVSS, remediation timeline'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Penetration Testing Methodology (PTES)'
)
AND "title" = 'Report Writer';
