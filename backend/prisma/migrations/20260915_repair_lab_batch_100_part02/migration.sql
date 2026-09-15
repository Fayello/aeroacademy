-- Generated from prisma/lab-repair-batch-02.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Complete DevSecOps Pipeline with Automated Compliance in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete DevSecOps Pipeline with Automated Compliance in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "SAST Scanner", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "DAST Scanner", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "SCA Analyzer", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Gate Enforcer", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Report Generator", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"SAST Scanner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"DAST Scanner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"SCA Analyzer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Gate Enforcer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Report Generator\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'DevSecOps Pipeline with Automated Compliance';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: sonar-scanner -Dsonar.projectKey=myproject -Dsonar.sources=src/'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'DevSecOps Pipeline with Automated Compliance'
)
AND "title" = 'SAST Scanner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: zap-full-scan.py -t https://target.example.com -r report.html'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'DevSecOps Pipeline with Automated Compliance'
)
AND "title" = 'DAST Scanner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: snyk test --all-projects --severity-threshold=high'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'DevSecOps Pipeline with Automated Compliance'
)
AND "title" = 'SCA Analyzer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: if [ $(sonar-qube-quality-gate-check) != ''PASSED'' ]; then exit 1; fi'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'DevSecOps Pipeline with Automated Compliance'
)
AND "title" = 'Gate Enforcer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: merge-reports --sast sonar.json --dast zap.json --sca snyk.json'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'DevSecOps Pipeline with Automated Compliance'
)
AND "title" = 'Report Generator';

UPDATE "Lab"
SET
  "description" = 'Complete Docker Security Hardening in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Docker Security Hardening in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Bench Runner", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "User Hardener", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Cap Dropper", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "ReadOnly FS", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Resource Limiter", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Bench Runner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"User Hardener\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Cap Dropper\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"ReadOnly FS\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Resource Limiter\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Docker Security Hardening';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: docker run --net host --pid host docker/docker-bench-security'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Docker Security Hardening'
)
AND "title" = 'Bench Runner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: RUN addgroup -S appgroup && adduser -S appuser -G appgroup USER appuser'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Docker Security Hardening'
)
AND "title" = 'User Hardener';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: docker run --cap-drop ALL --cap-add NET_BIND_SERVICE nginx'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Docker Security Hardening'
)
AND "title" = 'Cap Dropper';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: docker run --read-only --tmpfs /tmp nginx'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Docker Security Hardening'
)
AND "title" = 'ReadOnly FS';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: docker run --memory=512m --cpus=1.0 nginx'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Docker Security Hardening'
)
AND "title" = 'Resource Limiter';

UPDATE "Lab"
SET
  "description" = 'Complete Kubernetes Pod Security & Admission Control in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Kubernetes Pod Security & Admission Control in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "PSA Configurer", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Gatekeeper Deployer", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Constraint Creator", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Kyverno Installer", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Policy Tester", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"PSA Configurer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Gatekeeper Deployer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Constraint Creator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Kyverno Installer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Policy Tester\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Kubernetes Pod Security & Admission Control';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: kubectl label namespace default pod-security.kubernetes.io/enforce=restricted'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Kubernetes Pod Security & Admission Control'
)
AND "title" = 'PSA Configurer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: helm install gatekeeper gatekeeper/gatekeeper --namespace gatekeeper-system'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Kubernetes Pod Security & Admission Control'
)
AND "title" = 'Gatekeeper Deployer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: kubectl apply -f constraint-template.yaml'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Kubernetes Pod Security & Admission Control'
)
AND "title" = 'Constraint Creator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: helm install kyverno kyverno/kyverno --namespace kyverno'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Kubernetes Pod Security & Admission Control'
)
AND "title" = 'Kyverno Installer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: kubectl run test --image=nginx --privileged=true --dry-run=server'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Kubernetes Pod Security & Admission Control'
)
AND "title" = 'Policy Tester';

UPDATE "Lab"
SET
  "description" = 'Complete Container Escape & Runtime Exploitation in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Container Escape & Runtime Exploitation in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Privileged Escaper", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Socket Exploiter", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Cgroup Escaper", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Seccomp Defenser", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "AppArmor Enforcer", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Privileged Escaper\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Socket Exploiter\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Cgroup Escaper\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Seccomp Defenser\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"AppArmor Enforcer\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Container Escape & Runtime Exploitation';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: mount /dev/sda1 /mnt && chroot /mnt'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Container Escape & Runtime Exploitation'
)
AND "title" = 'Privileged Escaper';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: curl -s --unix-socket /var/run/docker.sock http://localhost/containers/json'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Container Escape & Runtime Exploitation'
)
AND "title" = 'Socket Exploiter';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: echo 1 > /proc/sys/kernel/cgroup_release_agent'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Container Escape & Runtime Exploitation'
)
AND "title" = 'Cgroup Escaper';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: docker run --security-opt seccomp=strict-profile.json nginx'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Container Escape & Runtime Exploitation'
)
AND "title" = 'Seccomp Defenser';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: docker run --security-opt apparmor=docker-strict nginx'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Container Escape & Runtime Exploitation'
)
AND "title" = 'AppArmor Enforcer';

UPDATE "Lab"
SET
  "description" = 'Complete Image Vulnerability Scanning & Compliance in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Image Vulnerability Scanning & Compliance in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Trivy Scanner", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Grype Comparator", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Digest Pinner", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Hadolint Runner", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Harbor Configurer", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Trivy Scanner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Grype Comparator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Digest Pinner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Hadolint Runner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Harbor Configurer\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Image Vulnerability Scanning & Compliance';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: trivy image --severity HIGH,CRITICAL --format json myimage:latest'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Image Vulnerability Scanning & Compliance'
)
AND "title" = 'Trivy Scanner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: grype docker:myimage:latest -o json'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Image Vulnerability Scanning & Compliance'
)
AND "title" = 'Grype Comparator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: FROM ubuntu:22.04@sha256:abc123...'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Image Vulnerability Scanning & Compliance'
)
AND "title" = 'Digest Pinner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: hadolint Dockerfile --format json'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Image Vulnerability Scanning & Compliance'
)
AND "title" = 'Hadolint Runner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: curl -X PUT https://harbor/api/v2.0/projects/myproject -d ''{auto_scan:true}'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Image Vulnerability Scanning & Compliance'
)
AND "title" = 'Harbor Configurer';
