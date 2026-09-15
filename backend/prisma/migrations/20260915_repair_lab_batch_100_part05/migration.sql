-- Generated from prisma/lab-repair-batch-02.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Complete Zero Trust Architecture Implementation in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Zero Trust Architecture Implementation in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Identity Verifier", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Micro-Segmentor", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Device Trust Checker", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "SDP Deployer", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Anomaly Detector", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Identity Verifier\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Micro-Segmentor\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Device Trust Checker\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"SDP Deployer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Anomaly Detector\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Zero Trust Architecture Implementation';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Verify JWT + device certificate + MFA on every request'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Zero Trust Architecture Implementation'
)
AND "title" = 'Identity Verifier';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: iptables -A FORWARD -s 10.0.1.0/24 -d 10.0.2.0/24 -p tcp --dport 443 -j ACCEPT'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Zero Trust Architecture Implementation'
)
AND "title" = 'Micro-Segmentor';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Check device certificate, OS version, and patch level before granting access'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Zero Trust Architecture Implementation'
)
AND "title" = 'Device Trust Checker';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: cloudflared access tcp-proxy --hostname app.example.com --url localhost:8080'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Zero Trust Architecture Implementation'
)
AND "title" = 'SDP Deployer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: ML-based detection of unusual access patterns'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Zero Trust Architecture Implementation'
)
AND "title" = 'Anomaly Detector';

UPDATE "Lab"
SET
  "description" = 'Complete SAML & SSO Security Testing in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete SAML & SSO Security Testing in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "XXE Injector", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Sig Wrapper", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Assertion Replayer", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Sig Stripper", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Validator Hardener", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"XXE Injector\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Sig Wrapper\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Assertion Replayer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Sig Stripper\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Validator Hardener\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'SAML & SSO Security Testing';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: <!DOCTYPE foo [<!ENTITY xxe SYSTEM ''file:///etc/passwd''>]>'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'SAML & SSO Security Testing'
)
AND "title" = 'XXE Injector';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Move original signature and modify assertion while keeping valid signature'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'SAML & SSO Security Testing'
)
AND "title" = 'Sig Wrapper';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Capture SAML response, modify attributes, replay to SP'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'SAML & SSO Security Testing'
)
AND "title" = 'Assertion Replayer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Remove ds:Signature element and test if SP accepts unsigned assertion'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'SAML & SSO Security Testing'
)
AND "title" = 'Sig Stripper';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Require signed assertions, validate certificate chain, check NotBefore/NotOnOrAfter'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'SAML & SSO Security Testing'
)
AND "title" = 'Validator Hardener';

UPDATE "Lab"
SET
  "description" = 'Complete Symmetric Encryption & Key Management in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Symmetric Encryption & Key Management in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Key Generator", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "File Encryptor", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "File Decryptor", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "PBKDF2 Deriver", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Key Rotator", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Key Generator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"File Encryptor\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"File Decryptor\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"PBKDF2 Deriver\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Key Rotator\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Symmetric Encryption & Key Management';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: openssl rand -base64 32 > aes-key.key'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Symmetric Encryption & Key Management'
)
AND "title" = 'Key Generator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: openssl enc -aes-256-gcm -salt -pbkdf2 -in plaintext.txt -out encrypted.bin -pass file:./aes-key.key'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Symmetric Encryption & Key Management'
)
AND "title" = 'File Encryptor';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: openssl enc -aes-256-gcm -d -pbkdf2 -in encrypted.bin -out decrypted.txt -pass file:./aes-key.key'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Symmetric Encryption & Key Management'
)
AND "title" = 'File Decryptor';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: openssl kdf -keylen 32 -salt -iterations 100000 -md sha256 PBKDF2'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Symmetric Encryption & Key Management'
)
AND "title" = 'PBKDF2 Deriver';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Generate DEK, encrypt DEK with KEK, rotate KEK periodically'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Symmetric Encryption & Key Management'
)
AND "title" = 'Key Rotator';

UPDATE "Lab"
SET
  "description" = 'Complete Asymmetric Encryption & PKI in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Asymmetric Encryption & PKI in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "RSA Generator", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "ECC Generator", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "CA Builder", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Cert Issuer", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "OCSP Responder", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"RSA Generator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"ECC Generator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"CA Builder\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Cert Issuer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"OCSP Responder\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Asymmetric Encryption & PKI';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out rsa.key'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Asymmetric Encryption & PKI'
)
AND "title" = 'RSA Generator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: openssl ecparam -genkey -name prime256v1 | openssl ec -out ecc.key'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Asymmetric Encryption & PKI'
)
AND "title" = 'ECC Generator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: step ca init --name ''Root CA'' --dns localhost --address :9000'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Asymmetric Encryption & PKI'
)
AND "title" = 'CA Builder';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: step ca certificate --ca-url https://localhost:9000 --root root_ca.crt service.local service.crt service.key'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Asymmetric Encryption & PKI'
)
AND "title" = 'Cert Issuer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: openssl ocsp -index index.txt -port 9080 -rsigner issuing.crt -rkey issuing.key -CA root.crt'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Asymmetric Encryption & PKI'
)
AND "title" = 'OCSP Responder';

UPDATE "Lab"
SET
  "description" = 'Complete Hashing & Password Security in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Hashing & Password Security in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Bcrypt Hasher", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Argon2 Hasher", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "HMAC Creator", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Timing Bypasser", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Strength Tester", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Bcrypt Hasher\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Argon2 Hasher\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"HMAC Creator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Timing Bypasser\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Strength Tester\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Hashing & Password Security';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: htpasswd -bnBC 12 '''' ''password123'' | tr -d '':'' | sed ''s/$2y/$2a/'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Hashing & Password Security'
)
AND "title" = 'Bcrypt Hasher';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: echo -n ''password123'' | argon2 $(openssl rand -hex 16) -id -t 3 -m 16 -p 4'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Hashing & Password Security'
)
AND "title" = 'Argon2 Hasher';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: echo -n ''message'' | openssl dgst -sha256 -hmac ''secret_key'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Hashing & Password Security'
)
AND "title" = 'HMAC Creator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: result |= a[i] ^ b[i] for all i'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Hashing & Password Security'
)
AND "title" = 'Timing Bypasser';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: zxcvbn ''password123'' --dictionary-root /usr/share/dict/'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Hashing & Password Security'
)
AND "title" = 'Strength Tester';
