-- Generated from prisma/lab-repair-batch-02.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Complete TLS Protocol Analysis & Downgrade Attack Prevention in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete TLS Protocol Analysis & Downgrade Attack Prevention in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "TestSSL Scanner", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Weak Cipher Finder", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "POODLE Tester", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "TLS13 Enforcer", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "SSlyze Auditor", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"TestSSL Scanner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Weak Cipher Finder\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"POODLE Tester\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"TLS13 Enforcer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"SSlyze Auditor\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'TLS Protocol Analysis & Downgrade Attack Prevention';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: testssl.sh --all https://target.example.com'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'TLS Protocol Analysis & Downgrade Attack Prevention'
)
AND "title" = 'TestSSL Scanner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: sslscan target.example.com'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'TLS Protocol Analysis & Downgrade Attack Prevention'
)
AND "title" = 'Weak Cipher Finder';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: testssl.sh --poodle https://target.example.com'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'TLS Protocol Analysis & Downgrade Attack Prevention'
)
AND "title" = 'POODLE Tester';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: ssl_protocols TLSv1.3; ssl_ciphers TLS_AES_256_GCM_SHA384;'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'TLS Protocol Analysis & Downgrade Attack Prevention'
)
AND "title" = 'TLS13 Enforcer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: sslyze --regular target.example.com:443'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'TLS Protocol Analysis & Downgrade Attack Prevention'
)
AND "title" = 'SSlyze Auditor';

UPDATE "Lab"
SET
  "description" = 'Complete Blockchain & Cryptocurrency Security in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Blockchain & Cryptocurrency Security in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Slither Auditor", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Reentrancy Exploiter", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Overflow Finder", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Access Bypasser", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Fuzzer Runner", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Slither Auditor\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Reentrancy Exploiter\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Overflow Finder\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Access Bypasser\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Fuzzer Runner\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Blockchain & Cryptocurrency Security';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: slither contracts/Vulnerable.sol --checklist'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Blockchain & Cryptocurrency Security'
)
AND "title" = 'Slither Auditor';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Call withdraw() recursively before balance update'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Blockchain & Cryptocurrency Security'
)
AND "title" = 'Reentrancy Exploiter';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: uint256 amount = type(uint256).max + 1;'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Blockchain & Cryptocurrency Security'
)
AND "title" = 'Overflow Finder';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Directly call admin function without modifier check'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Blockchain & Cryptocurrency Security'
)
AND "title" = 'Access Bypasser';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: echidna-test contracts/Vulnerable.sol --config echidna.yaml'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Blockchain & Cryptocurrency Security'
)
AND "title" = 'Fuzzer Runner';

UPDATE "Lab"
SET
  "description" = 'Complete Side-Channel Attack Analysis in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Side-Channel Attack Analysis in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Timing Attacker", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Cache Analyzer", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Constant-Time Enforcer", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Blinding Implementer", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Defense Deployer", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Timing Attacker\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Cache Analyzer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Constant-Time Enforcer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Blinding Implementer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Defense Deployer\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Side-Channel Attack Analysis';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: measure response time variations for different inputs to extract key'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Side-Channel Attack Analysis'
)
AND "title" = 'Timing Attacker';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Flush+Reload on shared memory regions to detect AES lookup patterns'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Side-Channel Attack Analysis'
)
AND "title" = 'Cache Analyzer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Use bitwise OR accumulator: result |= a[i] ^ b[i] for all i'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Side-Channel Attack Analysis'
)
AND "title" = 'Constant-Time Enforcer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: m'' = m * r^e mod n, decrypt m'', unblind with r^-1'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Side-Channel Attack Analysis'
)
AND "title" = 'Blinding Implementer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Add random delays, use constant-time algorithms, clear cache lines'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Side-Channel Attack Analysis'
)
AND "title" = 'Defense Deployer';

UPDATE "Lab"
SET
  "description" = 'Complete Steganography & Covert Channel Detection in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Steganography & Covert Channel Detection in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Steghide Extractor", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "LSB Detector", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "JPEG Analyzer", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "DNS Tunnel Detector", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Steg Detector", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Steghide Extractor\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"LSB Detector\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"JPEG Analyzer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"DNS Tunnel Detector\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Steg Detector\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Steganography & Covert Channel Detection';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: steghide extract -sf suspect.jpg -p password'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Steganography & Covert Channel Detection'
)
AND "title" = 'Steghide Extractor';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: zsteg suspect.png -a'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Steganography & Covert Channel Detection'
)
AND "title" = 'LSB Detector';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: jpegdct suspect.jpg | grep -i quantization'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Steganography & Covert Channel Detection'
)
AND "title" = 'JPEG Analyzer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: dnscat2 detection by analyzing DNS query entropy and size patterns'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Steganography & Covert Channel Detection'
)
AND "title" = 'DNS Tunnel Detector';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: stegdetect suspect.jpg'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Steganography & Covert Channel Detection'
)
AND "title" = 'Steg Detector';

UPDATE "Lab"
SET
  "description" = 'Complete Quantum-Resistant Cryptography Migration in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Quantum-Resistant Cryptography Migration in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Inventory Auditor", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Kyber Deployer", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Dilithium Signer", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Hybrid Tester", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Migration Planner", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Inventory Auditor\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Kyber Deployer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Dilithium Signer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Hybrid Tester\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Migration Planner\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Quantum-Resistant Cryptography Migration';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: find / -name ''*.pem'' -o -name ''*.key'' | xargs openssl x509 -noout -text | grep -E ''RSA|EC'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Quantum-Resistant Cryptography Migration'
)
AND "title" = 'Inventory Auditor';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: oqs-keygen -algorithm kyber512 -out kyber.key'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Quantum-Resistant Cryptography Migration'
)
AND "title" = 'Kyber Deployer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: oqs-sign -algorithm dilithium2 -key dilithium.key -message msg.txt -signature sig.bin'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Quantum-Resistant Cryptography Migration'
)
AND "title" = 'Dilithium Signer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: openssl s_server -www -groups X25519Kyber768Draft00'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Quantum-Resistant Cryptography Migration'
)
AND "title" = 'Hybrid Tester';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Classify all crypto: Critical (RSA-2048) -> High (ECDSA-P256) -> Medium (AES-256)'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Quantum-Resistant Cryptography Migration'
)
AND "title" = 'Migration Planner';
