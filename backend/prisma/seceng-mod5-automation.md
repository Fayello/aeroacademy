# Module 5: Security Automation (SAST/DAST/SCA)

Security automation is the practice of using tools to identify vulnerabilities continuously and consistently across the software development lifecycle. The goal is not to replace human judgment but to augment it: to catch the vulnerabilities that are mechanically detectable so that human reviewers can focus on the vulnerabilities that require context, logic analysis, and creative thinking. Effective security automation reduces the time between vulnerability introduction and detection from months (production incidents) to minutes (CI/CD pipeline failures).

The three primary categories of security automation are Static Application Security Testing (SAST), Dynamic Application Security Testing (DAST), and Software Composition Analysis (SCA). Each category addresses a different class of vulnerability at a different stage of the development lifecycle. Together, they provide comprehensive coverage that no single tool can achieve alone.

## SAST: Static Application Security Testing

SAST tools analyze source code without executing it. They parse the code into an abstract syntax tree, apply pattern-matching rules and data flow analysis, and identify code patterns that indicate potential vulnerabilities. SAST tools are valuable because they can analyze the entire codebase, including code paths that are not exercised during testing, and they provide specific file and line references for each finding.

### Semgrep

Semgrep is an open-source static analysis tool that supports multiple languages and allows custom rule authoring. Its strength is its extensibility: you can write rules that match specific code patterns in your codebase and enforce custom security standards.

A basic Semgrep rule for detecting SQL injection in Python:

```yaml
rules:
  - id: python-sql-injection
    pattern: |
      $CURSOR.execute("..." % ...)
    message: "SQL injection risk: use parameterized queries instead of string formatting"
    languages: [python]
    severity: ERROR
    metadata:
      cwe: "CWE-89: SQL Injection"
```

Semgrep's data flow analysis tracks taint from sources (user input) to sinks (dangerous functions). A taint-aware rule can detect SQL injection even when the tainted data passes through intermediate variables and transformations:

```yaml
rules:
  - id: python-sql-injection-taint
    mode: taint
    pattern-sources:
      - pattern: request.args.get(...)
      - pattern: request.form.get(...)
    pattern-sinks:
      - pattern: $CURSOR.execute(...)
    message: "SQL injection: user input flows to database query"
    languages: [python]
    severity: ERROR
```

Semgrep integrates with CI/CD pipelines through GitHub Actions, GitLab CI, and other platforms. A typical integration runs Semgrep on every pull request and fails the build if any ERROR-level findings are detected.

### SonarQube

SonarQube provides comprehensive code quality and security analysis with support for 27 languages. It distinguishes between security vulnerabilities (exploitable issues) and security hotspots (code that requires manual review to determine if it is exploitable). This distinction is important because it reduces false positives: a hardcoded IP address in a test file is a security hotspot, not a vulnerability, while a hardcoded IP address in a production configuration file may be a vulnerability.

SonarQube's quality gates enforce security standards at the pipeline level. A quality gate can require that no new security vulnerabilities are introduced by a pull request, that the overall security rating does not degrade, and that all security hotspots are reviewed. This prevents the common problem of security debt accumulation, where individual findings are deprioritized until the codebase is overwhelmed with unresolved issues.

SonarQube's security rules are organized by OWASP Top 10 and CWE categories, making it easy to map findings to industry standards. The platform also provides historical analysis, showing how security metrics change over time and identifying trends that indicate systemic issues.

### Checkmarx

Checkmarx is an enterprise SAST platform that provides deeper analysis than open-source alternatives. Its strength is its ability to track data flow across function boundaries, modules, and even microservices. This cross-boundary analysis finds vulnerabilities that single-file analysis misses, such as a function that sanitizes input in one service but the sanitized output is used unsafely in another service.

Checkmarx's aspiration analysis simulates attack paths through the application, identifying chains of vulnerabilities that an attacker could combine to achieve a security compromise. This is particularly valuable in large applications where individual findings may appear low-risk but combined attack paths are critical.

Checkmarx's false positive rate is lower than most SAST tools due to its deep analysis capabilities, but it is also slower. A full codebase scan of a large application can take hours. This makes it suitable for nightly builds or weekly scans rather than real-time CI/CD feedback. For real-time feedback, supplement Checkmarx with faster tools like Semgrep.

## DAST: Dynamic Application Security Testing

DAST tools test running applications by sending crafted requests and analyzing responses. They do not have access to source code, so they identify vulnerabilities by observing application behavior. DAST tools are valuable because they find vulnerabilities that SAST tools miss: configuration issues, runtime vulnerabilities, authentication and session management flaws, and vulnerabilities that only manifest when the application is running in its production environment.

### OWASP ZAP

OWASP ZAP (Zed Attack Proxy) is an open-source DAST tool that intercepts and modifies HTTP traffic between the browser and the application. ZAP's automated scanner crawls the application, identifies endpoints, sends attack payloads, and analyzes responses for signs of vulnerability.

ZAP's active scanning rules cover the OWASP Top 10: SQL injection, cross-site scripting, path traversal, remote code execution, server-side request forgery, and more. The scanner sends payloads specific to each vulnerability class and analyzes the response for indicators of exploitation: error messages, reflected input, timing differences, and behavioral changes.

ZAP's automation framework enables integration with CI/CD pipelines. A ZAP automation plan defines the target application, authentication method, and scan policy. The plan can be executed as part of a deployment pipeline, with results published as test artifacts and build status set based on finding severity.

A ZAP automation plan for a web application:

```yaml
env:
  contexts:
    - name: "My Application"
      urls:
        - "https://staging.example.com"
      includePaths:
        - "https://staging.example.com/api/.*"
      excludePaths:
        - ".*logout.*"
      authentication:
        method: "form"
        parameters:
          loginUrl: "https://staging.example.com/login"
          loginRequestData: "username={%username%}&password={%password%}"
        verification:
          method: "response"
          loggedInRegex: "\\QWelcome\\E"

jobs:
  - type: "connect"
    parameters:
      site: "https://staging.example.com"
  - type: "spider"
    parameters:
      context: "My Application"
      maxDuration: 5
  - type: "activeScan"
    parameters:
      context: "My Application"
      maxRuleDurationInMins: 5
```

### Burp Suite

Burp Suite is the industry-standard DAST tool for web application security testing. Its interceptor proxy allows manual manipulation of HTTP requests and responses, making it invaluable for understanding application behavior and crafting targeted attacks. Burp's scanner provides automated vulnerability detection with a lower false positive rate than most DAST tools.

Burp Suite's extensions extend its capabilities. The Logger extension captures all traffic for later analysis. The Comparer extension highlights differences between requests and responses. The Intruder extension automates parameter fuzzing. The Collaborator extension detects out-of-band vulnerabilities (such as blind SQL injection and SSRF) by providing a unique domain that records incoming connections.

Burp Suite's headless scanning mode enables CI/CD integration, though the commercial license cost limits its use in open-source pipelines. For organizations that already use Burp Suite for manual testing, extending it to automated scanning provides consistency between manual and automated findings.

## SCA: Software Composition Analysis

SCA tools analyze third-party dependencies for known vulnerabilities. Modern applications depend heavily on open-source libraries: the average application contains 70-80% open-source code. A vulnerability in a widely-used library can affect thousands of applications simultaneously. SCA tools identify which dependencies are present in your application and cross-reference them against vulnerability databases.

### Snyk

Snyk provides vulnerability database coverage, fix advice, and integration with development workflows. Its strength is its developer-friendly approach: Snyk provides pull requests that automatically update vulnerable dependencies to patched versions, with compatibility testing to ensure the update does not break functionality.

Snyk's prioritization considers multiple factors: whether the vulnerability is exploitable in your specific context, whether a fix is available, and the severity of the vulnerability. This reduces noise compared to tools that report every known vulnerability regardless of relevance.

Snyk integrates with CI/CD pipelines, IDEs, and source code management platforms. In CI/CD, Snyk can be configured to fail the build if vulnerabilities above a certain severity are found. In the IDE, Snyk provides real-time feedback as developers add or update dependencies.

### Dependabot

Dependabot, built into GitHub, automatically creates pull requests when dependencies have known vulnerabilities. Its strength is its seamless integration with GitHub: no additional tooling is required, and the pull request workflow is familiar to developers.

Dependabot's limitation is that it focuses on updates rather than analysis. It tells you that a vulnerability exists and provides an update, but it does not analyze whether the vulnerability is exploitable in your context. A vulnerability in a function you do not use is reported with the same urgency as a vulnerability in a function you depend on.

### OWASP Dependency-Check

OWASP Dependency-Check is an open-source SCA tool that identifies project dependencies and checks for known vulnerabilities. It supports Java, .NET, Ruby, Python, Node.js, and other ecosystems. The tool generates reports that can be integrated into build systems and CI/CD pipelines.

Dependency-Check's strength is its comprehensive vulnerability database, which aggregates data from NVD, GitHub advisories, and other sources. Its weakness is its high false positive rate: it reports vulnerabilities based on package name matching, which can miss vulnerabilities (if the package name does not match) or report false positives (if the package name matches but the vulnerable code path is not used).

## Secret Scanning

Secret scanning tools detect hardcoded credentials, API keys, tokens, and other sensitive data in source code. Hardcoded secrets are one of the most common and most preventable vulnerability classes: they are easy to detect, easy to fix, and trivially exploitable.

### TruffleHog

TruffleHog scans git repositories for high-entropy strings, known secret patterns, and verified credentials. Its verified scanning feature checks detected secrets against the actual service (e.g., verifying that a detected AWS key is valid) to reduce false positives. TruffleHog supports over 600 secret detectors covering cloud providers, SaaS platforms, databases, and other services.

TruffleHog integrates with CI/CD pipelines to scan every commit for secrets. A typical integration scans the diff of every pull request, failing the build if new secrets are detected. This prevents secrets from being committed to the repository while allowing investigation of historical secrets.

### GitLeaks

GitLeaks is a faster, simpler alternative to TruffleHog that focuses on pattern matching rather than verification. Its speed makes it suitable for scanning large repositories or running on every commit without significant pipeline overhead.

GitLeaks's configuration file defines patterns to search for and patterns to ignore. A custom configuration can target organization-specific secret formats:

```toml
[[rules]]
id = "custom-api-key"
description = "Custom API Key"
regex = '''ak_live_[a-zA-Z0-9]{32,}'''
tags = ["api-key", "custom"]

[[rules]]
id = "custom-db-password"
description = "Database Password in Config"
regex = '''DB_PASSWORD\s*=\s*['"]([^'"]+)['"]'''
tags = ["password", "database"]
```

## Container Scanning

Container images contain operating system packages, application dependencies, and configuration files that may have known vulnerabilities. Container scanning tools analyze image layers and identify vulnerable components.

### Trivy

Trivy scans container images for OS package vulnerabilities (Alpine, Debian, Ubuntu, RHEL) and application dependency vulnerabilities (npm, pip, Go modules, Maven). Its comprehensive coverage and speed make it the most popular open-source container scanner.

Trivy integrates with CI/CD pipelines to scan images during the build process. A typical pipeline builds the image, scans it with Trivy, and fails the build if critical vulnerabilities are found. Trivy also supports scanning infrastructure-as-code files (Terraform, CloudFormation, Kubernetes manifests) for misconfigurations.

A Trivy CI/CD integration:

```yaml
scan-image:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Build image
      run: docker build -t myapp:${{ github.sha }} .
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'myapp:${{ github.sha }}'
        format: 'sarif'
        output: 'trivy-results.sarif'
        severity: 'CRITICAL,HIGH'
        exit-code: '1'
```

### Grype

Grype is a vulnerability scanner for container images and filesystems, developed by Anchore. It provides similar functionality to Trivy with a focus on accuracy and low false positive rates. Grype's matcher architecture allows fine-grained control over which vulnerability databases are used and how matches are scored.

## CI/CD Integration Patterns

Effective security automation requires integrating tools into the CI/CD pipeline at appropriate points. The goal is to provide fast feedback to developers while maintaining comprehensive coverage.

The first gate is the commit stage. Secret scanning tools (TruffleHog, GitLeaks) and fast SAST tools (Semgrep) run on every commit or pull request. These tools are fast (seconds to minutes) and provide immediate feedback. Failures at this stage block the pull request from being merged.

The second gate is the build stage. SCA tools (Snyk, Dependabot) and container scanning tools (Trivy, Grype) run after the application is built. These tools analyze the compiled artifact and its dependencies. Failures at this stage block the build from being deployed.

The third gate is the deployment stage. DAST tools (ZAP, Burp) run against the deployed application in a staging environment. These tools require a running application, so they must run after deployment. Failures at this stage block deployment to production.

Each gate should have a clear policy for what findings block the pipeline and what findings are reported but do not block. Critical and high severity findings should block the pipeline. Medium and low severity findings should be reported and tracked for remediation but should not block deployment. This balance prevents security from becoming a bottleneck while maintaining protection against the most serious vulnerabilities.

## Real Story: Catching 50 Vulnerabilities Before Production

A mid-size SaaS company deployed a security automation pipeline in 2022 that combined Semgrep (SAST), Snyk (SCA), and Trivy (container scanning) in their CI/CD pipeline. The pipeline ran on every pull request and blocked merges that introduced critical or high severity findings.

Within the first three months, the pipeline caught 47 critical and high severity vulnerabilities before they reached staging, let alone production. These included 12 SQL injection vulnerabilities in legacy code that had not been caught by previous code reviews, 8 hardcoded API keys and database credentials in configuration files, 15 vulnerable dependencies with known CVEs, 6 container images with critical OS vulnerabilities, and 6 cross-site scripting vulnerabilities in newly written code.

The total remediation cost for these 47 vulnerabilities was approximately $23,500 in engineering time: an average of $500 per vulnerability. The company estimated that if these vulnerabilities had reached production and been found through incidents or external testing, the remediation cost would have been approximately $2.1 million: an average of $45,000 per vulnerability.

The three additional vulnerabilities were found after production deployment through the company's bug bounty program. Two were low severity information disclosure issues, and one was a medium severity logic flaw in the payment processing workflow. The bug bounty program paid $4,200 in rewards for these findings.

The total investment in security automation was approximately $85,000 in the first year (tool licensing, pipeline configuration, and developer training). The estimated risk reduction from preventing 47 production vulnerabilities was approximately $2 million. The ROI was approximately 23:1.

The most significant finding was not any individual vulnerability but the pattern it revealed. Twenty-three of the 47 vulnerabilities were in three microservices that had been written by the same team during a rapid growth period. The team had not received security training and was not aware of the secure coding practices that would have prevented these vulnerabilities. The company used this finding to prioritize security training for that team and to establish security champions on every engineering team.

## Reducing False Positives

False positives are the primary obstacle to effective security automation. A tool that reports 100 findings when only 10 are real vulnerabilities wastes developer time and erodes trust in the tooling. The goal is not zero false positives: that is impossible without zero true positives: but a signal-to-noise ratio that developers trust.

The first strategy is tuning. Every security tool can be configured to reduce false positives. In Semgrep, this means writing rules that match specific vulnerable patterns rather than broad patterns that match both vulnerable and safe code. In Snyk, this means using Snyk's prioritization to focus on vulnerabilities that are actually exploitable in your context. In Trivy, this means filtering findings by severity and fix availability.

The second strategy is context. A finding in test code is less urgent than a finding in production code. A vulnerability in a dependency that your application does not use is less urgent than a vulnerability in a dependency that handles user authentication. Tools that provide context: Snyk's exploitability scoring, SonarQube's security hotspots, Trivy's fix availability: help developers prioritize.

The third strategy is verification. Before filing a ticket for a security finding, verify that it is exploitable. A SQL injection finding in a parameterized query is a false positive. A SQL injection finding in a string concatenation query is a true positive. A hardcoded password in a test file is a low-priority finding. A hardcoded password in a production configuration file is a critical finding. Verification takes time but prevents wasted effort on false positives.

The fourth strategy is feedback. When developers determine that a finding is a false positive, they should be able to suppress it with a documented reason. This creates a record of suppressed findings that can be reviewed periodically to ensure that suppressed findings remain false positives. It also provides data for tool tuning: if the same rule produces the same false positive repeatedly, the rule should be modified.

The fifth strategy is baseline scanning. When deploying security automation for the first time, scan the existing codebase and establish a baseline of known findings. Do not block the pipeline on pre-existing findings: this creates a barrier to adoption that developers will resist. Instead, report pre-existing findings and track remediation over time. Block the pipeline only on new findings introduced by the pull request.

## Assessment

**Lab 5.1: SAST Rule Writing (45 minutes)**
Write Semgrep rules to detect five specific vulnerability classes in a Python Django application: SQL injection, cross-site scripting, path traversal, insecure deserialization, and hardcoded credentials. Each rule must have a true positive and a false positive test case. Run the rules against a provided test codebase and report the results.

**Grading criteria:**
- Correct, functional Semgrep rules for all five vulnerability classes (15 points, 3 per rule)
- Appropriate true positive and false positive test cases (10 points, 2 per rule)
- Accurate results when run against the test codebase (10 points)
- Custom rules that go beyond Semgrep's built-in rules (10 points)

**Lab 5.2: CI/CD Pipeline Configuration (60 minutes)**
Configure a GitHub Actions pipeline that integrates Semgrep (SAST), Snyk (SCA), Trivy (container scanning), and GitLeaks (secret scanning). The pipeline should run each tool at the appropriate stage, block merges on critical findings, and produce a combined security report. Include configuration for each tool with appropriate policies.

**Grading criteria:**
- Working pipeline configuration with all four tools (16 points, 4 per tool)
- Appropriate pipeline stage placement for each tool (8 points)
- Correct merge blocking policy (8 points)
- Combined security report generation (8 points)

**Lab 5.3: False Positive Analysis (45 minutes)**
Analyze a provided set of 30 security tool findings (from Semgrep, Snyk, and Trivy) and classify each as true positive, false positive, or requires investigation. For each false positive, explain why it is a false positive. For each finding requiring investigation, describe the additional analysis needed. Calculate the false positive rate for each tool.

**Grading criteria:**
- Correct classification of all 30 findings (15 points, 0.5 per finding)
- Appropriate justifications for false positive classifications (10 points)
- Clear investigation plans for ambiguous findings (10 points)
- Accurate false positive rate calculations (5 points)
- Recommendations for reducing false positives in each tool (10 points)

## Evidence

Security automation is not a replacement for security engineering, security code review, or security testing. It is a force multiplier that makes all of them more effective. By catching the mechanically detectable vulnerabilities automatically, it frees human reviewers to focus on the context-dependent vulnerabilities that require understanding of the application's business logic and threat model.

The SCA findings in this module illustrate why automation is essential. A modern application with 200+ dependencies cannot be manually checked for known vulnerabilities. New CVEs are published daily, and a dependency that was safe yesterday may be vulnerable today. SCA tools provide continuous monitoring that would be impossible to replicate manually.

The false positive challenge is real but manageable. Every security tool produces false positives, and every development team has limited time for security findings. The strategies outlined in this module: tuning, context, verification, feedback, and baselining: reduce false positives to a level where developers trust the tools and act on the findings.

The investment in security automation pays for itself many times over. The cost of configuring and maintaining a security pipeline is a fraction of the cost of finding and remediating vulnerabilities in production. The key is starting with the tools most relevant to your technology stack, tuning them for your specific context, and iterating based on feedback from your development team.

## Summary

Security automation encompasses three primary categories: SAST (static analysis of source code), DAST (dynamic analysis of running applications), and SCA (analysis of third-party dependencies). Each category addresses different vulnerability classes at different stages of the development lifecycle. Together with secret scanning and container scanning, they provide comprehensive automated coverage that catches the mechanically detectable vulnerabilities before they reach production.

The key to effective security automation is integration into the CI/CD pipeline at appropriate stages. Fast tools run on every commit for immediate feedback. Comprehensive tools run during the build for thorough analysis. Dynamic tools run after deployment for runtime validation. Each stage has clear policies for what findings block the pipeline and what findings are reported for later remediation.

False positive management is the critical skill that determines whether developers trust and use the automation. Tuning, context, verification, feedback, and baselining are the strategies that reduce false positives to a manageable level. Without these strategies, security automation becomes noise that developers ignore.