# Module 5 — Security Automation (SAST/DAST/SCA)

**Course:** Security Engineering | **Path:** Security Engineering (5 of 10)

---

## What You'll Actually Do

You'll integrate security scanning into CI/CD. SAST finds code vulnerabilities, DAST tests running applications, SCA checks dependencies. You'll configure all three and make them part of the build pipeline.

---

## SAST — Static Application Security Testing

Scans source code for vulnerabilities without running it.

```yaml
# GitHub Actions — Semgrep
- name: Run Semgrep
  uses: returntocorp/semgrep-action@v1
  with:
    config: p/owasp-top-ten
```

**Tools:** Semgrep, SonarQube, Bandit (Python), ESLint security plugins

**What it finds:** SQL injection, XSS, hardcoded secrets, insecure crypto

---

## DAST — Dynamic Application Security Testing

Tests a running application for vulnerabilities.

```yaml
# OWASP ZAP in CI
- name: Run ZAP Scan
  uses: zaproxy/action-full-scan@v0.7.0
  with:
    target: https://staging.example.com
```

**Tools:** OWASP ZAP, Burp Suite, Nuclei

**What it finds:** XSS, SQLi, misconfigurations, info disclosure

---

## SCA — Software Composition Analysis

Checks dependencies for known vulnerabilities.

```yaml
# GitHub Dependabot
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

**Tools:** Snyk, Dependabot, Trivy, Grype

**What it finds:** Vulnerable packages (like Log4Shell, left-pad)

---

## CI/CD Integration

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]

jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: returntocorp/semgrep-action@v1

  sca:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'

  dast:
    runs-on: ubuntu-latest
    needs: deploy-staging
    steps:
      - uses: zaproxy/action-full-scan@v0.7.0
        with:
          target: ${{ secrets.STAGING_URL }}
```

---

## Real Task: Set Up Security Pipeline

```bash
# 1. Add Semgrep for SAST
pip install semgrep
semgrep --config=auto --error .

# 2. Add Trivy for SCA
trivy fs --severity HIGH,CRITICAL .

# 3. Add ZAP for DAST
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py http://localhost:8080

# 4. Configure CI to fail on critical findings
```

---

## Assessment

**Lab task (25 min):**

1. Run SAST on a codebase and interpret results
2. Run SCA on a project and identify vulnerable dependencies
3. Run DAST against a running application
4. Integrate all three into a CI/CD pipeline
5. Triage findings by severity

**Grading:**
- SAST run: 20%
- SCA run: 20%
- DAST run: 20%
- CI/CD integrated: 25%
- Triage correct: 15%

---

## Evidence

- **OutcomeEvidence:** `SEC-LO5 — Security Automation`
