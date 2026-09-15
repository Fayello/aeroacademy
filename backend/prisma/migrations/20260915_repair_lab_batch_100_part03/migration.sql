-- Generated from prisma/lab-repair-batch-02.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Complete Helm Chart Security & Template Hardening in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Helm Chart Security & Template Hardening in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Chart Auditor", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Security Context Adder", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Policy Validator", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "RBAC Configurer", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Chart Signer", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Chart Auditor\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Security Context Adder\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Policy Validator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"RBAC Configurer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Chart Signer\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Helm Chart Security & Template Hardening';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: helm lint mychart/ --strict'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Helm Chart Security & Template Hardening'
)
AND "title" = 'Chart Auditor';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: securityContext: runAsNonRoot: true runAsUser: 1000 readOnlyRootFilesystem: true'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Helm Chart Security & Template Hardening'
)
AND "title" = 'Security Context Adder';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: conftest test mychart/templates/ -p policy/'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Helm Chart Security & Template Hardening'
)
AND "title" = 'Policy Validator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: helm install myrelease ./mychart --set rbac.create=true'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Helm Chart Security & Template Hardening'
)
AND "title" = 'RBAC Configurer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: helm signer sign mychart/ --key cosign.key'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Helm Chart Security & Template Hardening'
)
AND "title" = 'Chart Signer';

UPDATE "Lab"
SET
  "description" = 'Complete Service Mesh Security (Istio/Linkerd) in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Service Mesh Security (Istio/Linkerd) in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Istio Installer", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "mTLS Enforcer", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Auth Policy Creator", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "JWT Configurer", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Traffic Monitor", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Istio Installer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"mTLS Enforcer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Auth Policy Creator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"JWT Configurer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Traffic Monitor\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Service Mesh Security (Istio/Linkerd)';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: istioctl install --set profile=default'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Service Mesh Security (Istio/Linkerd)'
)
AND "title" = 'Istio Installer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: kubectl apply -f peer-auth.yaml'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Service Mesh Security (Istio/Linkerd)'
)
AND "title" = 'mTLS Enforcer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: kubectl apply -f authorization-policy.yaml'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Service Mesh Security (Istio/Linkerd)'
)
AND "title" = 'Auth Policy Creator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: istioctl install --set values.global.jwtRules[0].issuer=https://auth.example.com'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Service Mesh Security (Istio/Linkerd)'
)
AND "title" = 'JWT Configurer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: kubectl port-forward svc/kiali -n istio-system 20001:20001'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Service Mesh Security (Istio/Linkerd)'
)
AND "title" = 'Traffic Monitor';

UPDATE "Lab"
SET
  "description" = 'Complete Runtime Protection with Sysdig/Falco in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Runtime Protection with Sysdig/Falco in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Falco Deployer", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Process Monitor", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "File Watcher", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Auto Responder", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "SIEM Integrator", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Falco Deployer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Process Monitor\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"File Watcher\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Auto Responder\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"SIEM Integrator\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Runtime Protection with Sysdig/Falco';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: helm install falco falcosecurity/falco --set falcosidekick.enabled=true'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Runtime Protection with Sysdig/Falco'
)
AND "title" = 'Falco Deployer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: falco -r /etc/falco/rules.d/custom-rules.yaml -o json'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Runtime Protection with Sysdig/Falco'
)
AND "title" = 'Process Monitor';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: - rule: File Tampering condition: modify_file and container'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Runtime Protection with Sysdig/Falco'
)
AND "title" = 'File Watcher';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: docker stop $(docker inspect --format=''{{.Id}}'' $CONTAINER_ID)'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Runtime Protection with Sysdig/Falco'
)
AND "title" = 'Auto Responder';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: falcosidekick --elasticsearch.hostport=http://elasticsearch:9200/falco-*'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Runtime Protection with Sysdig/Falco'
)
AND "title" = 'SIEM Integrator';

UPDATE "Lab"
SET
  "description" = 'Complete Kubernetes Network Security & Service Mesh Policies in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Kubernetes Network Security & Service Mesh Policies in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Cilium Deployer", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Deny-All Creator", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "L7 Policy Creator", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "WireGuard Enabler", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Hubble Monitor", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Cilium Deployer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Deny-All Creator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"L7 Policy Creator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"WireGuard Enabler\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Hubble Monitor\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Kubernetes Network Security & Service Mesh Policies';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: helm install cilium cilium/cilium --set encryption.enabled=true'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Kubernetes Network Security & Service Mesh Policies'
)
AND "title" = 'Cilium Deployer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: kubectl apply -f deny-all-networkpolicy.yaml'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Kubernetes Network Security & Service Mesh Policies'
)
AND "title" = 'Deny-All Creator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: kubectl apply -f cilium-l7-policy.yaml'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Kubernetes Network Security & Service Mesh Policies'
)
AND "title" = 'L7 Policy Creator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: cilium encrypt enable --type wireguard'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Kubernetes Network Security & Service Mesh Policies'
)
AND "title" = 'WireGuard Enabler';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: cilium hubble enable --ui'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Kubernetes Network Security & Service Mesh Policies'
)
AND "title" = 'Hubble Monitor';

UPDATE "Lab"
SET
  "description" = 'Complete Active Directory Security Assessment in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Active Directory Security Assessment in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "LDAP Enumerator", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "BloodHound Collector", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Kerberoaster", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "ASREPRoaster", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "GPAbuser", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"LDAP Enumerator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"BloodHound Collector\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Kerberoaster\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"ASREPRoaster\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"GPAbuser\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Active Directory Security Assessment';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: ldapsearch -x -H ldap://dc01 -b DC=lab,DC=local ''(objectClass=user)'' sAMAccountName'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Active Directory Security Assessment'
)
AND "title" = 'LDAP Enumerator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: bloodhound-python -u ad-test -p ''ad-sec-2024!'' -d lab.local -dc dc01.lab.local -c all'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Active Directory Security Assessment'
)
AND "title" = 'BloodHound Collector';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: impacket-GetUserSPNs lab.local/ad-test:ad-sec-2024! -dc-ip dc01 -request'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Active Directory Security Assessment'
)
AND "title" = 'Kerberoaster';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: impacket-GetNPUsers lab.local/ -usersfile users.txt -format hashcat'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Active Directory Security Assessment'
)
AND "title" = 'ASREPRoaster';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: bloodhound-python -c GpLocalGroup -u ad-test -p ''ad-sec-2024!'' -d lab.local'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Active Directory Security Assessment'
)
AND "title" = 'GPAbuser';
