-- Generated from prisma/lab-repair-batch-02.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Complete Security Test Automation Framework in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Security Test Automation Framework in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Pytest Creator", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "SAST Integrator", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Selenium Tester", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "DAST Caller", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Regression Runner", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Pytest Creator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"SAST Integrator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Selenium Tester\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"DAST Caller\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Regression Runner\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Security Test Automation Framework';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: def test_sqli_protection(): response = client.get(''/search?q=<script>'') assert ''<script>'' not in response.text'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Security Test Automation Framework'
)
AND "title" = 'Pytest Creator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: subprocess.run([''bandit'', ''-r'', ''src/'', ''-f'', ''json''], check=True)'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Security Test Automation Framework'
)
AND "title" = 'SAST Integrator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: driver.find_element(By.ID, ''username'').send_keys(''admin\'' OR 1=1--'')'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Security Test Automation Framework'
)
AND "title" = 'Selenium Tester';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: requests.post(''http://zap:8080/JSON/ascan/action/scan/'', json={''url'': target})'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Security Test Automation Framework'
)
AND "title" = 'DAST Caller';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: pytest tests/security/ --html=report.html --self-contained-html'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Security Test Automation Framework'
)
AND "title" = 'Regression Runner';

UPDATE "Lab"
SET
  "description" = 'Complete Vulnerability Assessment & Risk Rating in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Vulnerability Assessment & Risk Rating in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "OpenVAS Scanner", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "CVSS Calculator", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Risk Matrix Creator", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "ATT&CK Mapper", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Dashboard Builder", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"OpenVAS Scanner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"CVSS Calculator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Risk Matrix Creator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"ATT&CK Mapper\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Dashboard Builder\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Vulnerability Assessment & Risk Rating';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: gvm-cli socket --xml ''<create_target><name>Target</name><hosts>192.168.1.0/24</hosts></create_target>'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Vulnerability Assessment & Risk Rating'
)
AND "title" = 'OpenVAS Scanner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H = 9.8 Critical'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Vulnerability Assessment & Risk Rating'
)
AND "title" = 'CVSS Calculator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Plot each vulnerability on 5x5 matrix: Likelihood (1-5) vs Impact (1-5)'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Vulnerability Assessment & Risk Rating'
)
AND "title" = 'Risk Matrix Creator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: SQL Injection -> T1190 (Exploit Public-Facing Application)'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Vulnerability Assessment & Risk Rating'
)
AND "title" = 'ATT&CK Mapper';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Grafana dashboard: open vulns by severity, mean time to remediate, trend over time'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Vulnerability Assessment & Risk Rating'
)
AND "title" = 'Dashboard Builder';

UPDATE "Lab"
SET
  "description" = 'Complete Mobile Application Security Testing in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Mobile Application Security Testing in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "MobSF Scanner", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "APK Decompiler", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Frida Injector", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "SSL Pinning Bypasser", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Deep Link Tester", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"MobSF Scanner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"APK Decompiler\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Frida Injector\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"SSL Pinning Bypasser\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Deep Link Tester\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Mobile Application Security Testing';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: python3 manage.py runserver 8000 && upload APK via API'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Mobile Application Security Testing'
)
AND "title" = 'MobSF Scanner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: apktool d target.apk && grep -r ''API_KEY'' target/smali/'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Mobile Application Security Testing'
)
AND "title" = 'APK Decompiler';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: frida -U -l bypass_ssl.js com.target.app'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Mobile Application Security Testing'
)
AND "title" = 'Frida Injector';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: objection --gadget --host 127.0.0.1 --port 8080 explore'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Mobile Application Security Testing'
)
AND "title" = 'SSL Pinning Bypasser';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: adb shell am start -a android.intent.action.VIEW -d ''myapp://admin?role=admin'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Mobile Application Security Testing'
)
AND "title" = 'Deep Link Tester';

UPDATE "Lab"
SET
  "description" = 'Complete Cloud Penetration Testing (AWS/Azure/GCP) in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Cloud Penetration Testing (AWS/Azure/GCP) in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Pacu Enumerator", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "IMDS Exploiter", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "IAM Escalator", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "S3 Enumeratior", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "ScoutSuite Auditor", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Pacu Enumerator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"IMDS Exploiter\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"IAM Escalator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"S3 Enumeratior\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"ScoutSuite Auditor\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Cloud Penetration Testing (AWS/Azure/GCP)';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: pacu --module iam__enum_users_roles_policies_groups'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cloud Penetration Testing (AWS/Azure/GCP)'
)
AND "title" = 'Pacu Enumerator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: curl http://169.254.169.254/latest/meta-data/iam/security-credentials/'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cloud Penetration Testing (AWS/Azure/GCP)'
)
AND "title" = 'IMDS Exploiter';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Assume role with existing credentials to gain elevated access'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cloud Penetration Testing (AWS/Azure/GCP)'
)
AND "title" = 'IAM Escalator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: aws s3 ls s3://target-bucket --recursive --profile compromised'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cloud Penetration Testing (AWS/Azure/GCP)'
)
AND "title" = 'S3 Enumeratior';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: scout aws --profile pentest-account --report-dir reports/'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cloud Penetration Testing (AWS/Azure/GCP)'
)
AND "title" = 'ScoutSuite Auditor';

UPDATE "Lab"
SET
  "description" = 'Complete Red Team Operations in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Red Team Operations in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Phisher", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "C2 Deployer", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "PassTheHash", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Persistence Setter", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Exfiltrator", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Phisher\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"C2 Deployer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"PassTheHash\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Persistence Setter\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Exfiltrator\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Red Team Operations';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: GoPhish campaign with credential harvesting'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Red Team Operations'
)
AND "title" = 'Phisher';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Sliver/Mythic C2 server with malleable C2 profiles'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Red Team Operations'
)
AND "title" = 'C2 Deployer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: impacket-psexec -hashes aad3b435b51404eeaad3b435b51404ee:NTHASH target'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Red Team Operations'
)
AND "title" = 'PassTheHash';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: reg add HKLM\Software\Microsoft\Windows\CurrentVersion\Run /v backdoor'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Red Team Operations'
)
AND "title" = 'Persistence Setter';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: dnscat2 tunnel with data encoding in DNS queries'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Red Team Operations'
)
AND "title" = 'Exfiltrator';
