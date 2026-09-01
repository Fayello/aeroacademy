# Module 8 -- Cloud Compliance

## Why Compliance Is Not the Same as Security

Compliance frameworks exist to ensure that organizations meet minimum security and operational standards. They are useful because they provide a structured approach to identifying and mitigating risks. But compliance is not security. You can be fully compliant and still be insecure. You can pass an audit and still have critical vulnerabilities.

The gap between compliance and security is where most breaches happen. An auditor checks a box because a control is documented, not because it is effective. A firewall rule exists but is overly permissive. An encryption policy is in place but the keys are not rotated. A logging system captures data but nobody reviews it.

Cloud compliance is particularly challenging because the cloud environment changes constantly. Resources are created and destroyed continuously. Configurations drift. New services introduce new compliance requirements. Manual compliance processes cannot keep up with the pace of cloud.

The real value of compliance frameworks is not the checklist. It is the structured thinking they impose. A framework forces you to ask: what data do we have, where is it stored, who has access to it, how do we protect it, how do we detect when protection fails, and how do we respond when it does. Those questions are the foundation of security, regardless of whether an auditor asks them.

This module covers how to use compliance frameworks effectively in cloud environments, how to automate compliance checking, and how to prepare for audits without treating compliance as a checkbox exercise.

## CIS Benchmarks for AWS, Azure, and GCP

The Center for Internet Security (CIS) publishes benchmarks for each major cloud provider. These benchmarks provide specific, actionable configuration recommendations. They are not theoretical. They tell you exactly what setting to change and why.

### CIS AWS Foundations Benchmark v2.0

The CIS AWS Foundations Benchmark covers IAM, logging, monitoring, and networking. Key controls include:

**IAM controls:**
- 1.1: Maintain current contact details (ensure root account contact information is accurate)
- 1.2: Ensure security contact information is registered (AWS security notifications go to the right people)
- 1.3: Ensure security questions are registered (account recovery)
- 1.4: Ensure no root user access key exists (root access keys are catastrophic if compromised)
- 1.5: Ensure MFA is enabled for all IAM users (MFA is the single most effective control against credential theft)
- 1.6: Ensure hardware MFA is enabled for the root user (hardware tokens are more secure than virtual MFA)
- 1.7: Ensure MFA is enabled for all IAM users that have console password access
- 1.8: Ensure credentials are not embedded in Lambda functions (use IAM roles instead)
- 1.9: Ensure IAM policies are attached only to groups or roles (direct user attachment makes permissions management difficult)
- 1.10: Ensure there is only one active access key for any single IAM user (multiple keys increase the attack surface)
- 1.11: Ensure IAM policies that allow full administrative privileges are not attached (avoid AdministratorAccess for non-root users)
- 1.12: Ensure a support role has been created to manage incidents with AWS Support (operational readiness)
- 1.13: Ensure VPC flow logs are enabled in all VPCs (network visibility)
- 1.14: Ensure CloudTrail is enabled in all regions (audit trail)
- 1.15: Ensure CloudTrail log file validation is enabled (tamper detection)
- 1.16: Ensure CloudTrail logs are encrypted at rest (data protection)
- 1.17: Ensure CloudTrail logs are integrated with CloudWatch Logs (real-time monitoring)
- 1.18: Ensure AWS Config is enabled in all regions (configuration compliance)
- 1.19: Ensure S3 bucket access logging is enabled on the CloudTrail S3 bucket (audit of audit logs)
- 1.20: Ensure CloudTrail logs are stored in a dedicated S3 bucket (separation of duties)

**S3 controls:**
- 2.1: Ensure all S3 buckets employ encryption-at-rest (data protection)
- 2.2: Ensure S3 bucket policy is set to deny HTTP (enforce HTTPS)
- 2.3: Ensure MFA Delete is enabled on S3 buckets (protection against accidental deletion)
- 2.4: Ensure S3 buckets are not publicly exposed (prevent data leaks)
- 2.5: Ensure S3 buckets with component access enabled have Block Public Access turned on (defense in depth)

**EC2 controls:**
- 3.1: Ensure no network monitoring and management systems have public IP addresses (exposure reduction)
- 3.2: Ensure that EC2 Metadata Service v2 (IMDSv2) is required (prevent SSRF-based credential theft)
- 3.3: Ensure that the default security group of every VPC restricts all traffic (isolation)

**Logging controls:**
- 4.1: Ensure a log metric filter and alarm exist for unauthorized API calls (detection)
- 4.2: Ensure a log metric filter and alarm exist for Management Console sign-in without MFA (detection)
- 4.3: Ensure a log metric filter and alarm exist for usage of root account (detection)
- 4.4: Ensure a log metric filter and alarm exist for IAM policy changes (detection)
- 4.5: Ensure a log metric filter and alarm exist for CloudTrail configuration changes (detection)
- 4.6: Ensure a log metric filter and alarm exist for AWS Management Console authentication failures (detection)

The logging controls are particularly important because they transform passive log data into active detection capabilities. A log metric filter watches CloudWatch Logs for specific patterns. When the pattern matches, it triggers a CloudWatch alarm. The alarm can send notifications or trigger automated remediation. This is how you detect compromises in near-real-time.

### CIS Azure Foundations Benchmark

The CIS Azure Benchmark covers Azure-specific controls. Key areas include Azure AD (ensure MFA is enabled for all users, ensure Conditional Access policies are configured, ensure privileged identity management is enabled), Storage (ensure secure transfer is required, ensure storage account access keys are rotated regularly, ensure shared access signature tokens expire within 1 hour), Networking (ensure no public IP addresses are used for management, ensure Network Security Groups flow logs are enabled, ensure Azure DDoS Protection Standard is enabled), and Logging (ensure audit logs are enabled for Azure AD, ensure activity logs are retained for at least 90 days, ensure log alerts for specific policy effects are triggered).

### CIS GCP Benchmark

The CIS GCP Benchmark covers Google Cloud Platform. Key areas include IAM (ensure corporate login credentials are used, ensure multi-factor authentication is enabled, ensure Security Key Enforcement is enabled for admin accounts), Storage (ensure that Cloud Storage buckets are not anonymously or publicly accessible, ensure that Cloud Storage buckets have uniform bucket-level access enabled), Logging (ensure that Cloud Audit Logging is configured properly across all services and all users from a project, ensure that sinks are configured for all Log entries), and Networking (ensure that the default network does not exist in a project, ensure Legacy Authorization is disabled, ensure VPC Flow Logs is enabled for every subnet in a VPC Network).

## AWS Security Hub Compliance Checks

AWS Security Hub provides automated compliance checks based on the standards listed above. Security Hub aggregates findings from multiple AWS services and third-party tools, then evaluates your environment against selected compliance standards.

### Enabling Security Hub Standards

Enable multiple compliance standards in Security Hub to get comprehensive coverage. The AWS Foundational Security Best Practices standard provides 56 controls covering core AWS services. Add the CIS benchmark for specific configuration checks. Add PCI DSS if you handle payment card data. Add NIST 800-53 if you need federal compliance.

Each standard generates compliance findings for each control. Controls are marked as PASSED, FAILED, or NOT_AVAILABLE. NOT_AVAILABLE means the control applies to a service you are not using. Focus your attention on FAILED controls first, then review NOT_AVAILABLE controls to determine whether they should be enabled.

### Understanding Compliance Findings

Security Hub findings include the compliance status, the affected resource, the specific configuration that failed, and the remediation steps. Use these findings to prioritize remediation.

Not all failures are equal. A failure on the root-account-mfa-enabled control is critical because the root account has unrestricted access. A failure on the ec2-instance-no-public-ip control is medium severity because public IPs are sometimes necessary. A failure on the iam-user-unused-credentials-check is low severity if the credentials are for a service account that runs a nightly batch job.

Prioritize based on severity and blast radius. Critical findings affect the most resources or the most sensitive data. High findings affect important services. Medium findings are configuration issues that increase attack surface. Low findings are best practice violations with minimal immediate risk.

### Custom Security Hub Insights

Create Security Hub insights to group related findings. For example, create an insight for all high-severity findings in the production account, or all S3-related findings across all accounts, or all findings related to a specific compliance standard. Insights provide a dashboard view of your most pressing compliance issues and help you communicate status to leadership.

### Security Hub Automation Rules

Security Hub automation rules allow you to define automated actions for findings. When a finding matches specific criteria, the automation rule can suppress the finding, update the finding severity, or add a note. Use automation rules carefully. Suppressing findings hides them from view. Only suppress findings that are genuinely false positives with documented justification.

## Audit Preparation

Audits are stressful because they compress months of compliance work into a short examination period. The key to successful audits is continuous compliance, not last-minute scrambling.

### Building an Audit-Ready Architecture

Evidence collection is the foundation. Configure AWS Config to record resource configurations. Use Config rules to evaluate compliance continuously. Store Config snapshots and compliance results in a dedicated S3 bucket with object lock. This provides an immutable audit trail that auditors can verify independently.

Documentation must be current and accurate. Maintain architecture diagrams, data flow diagrams, and security control documentation. Update them when changes occur, not when auditors ask. Use infrastructure as code (Terraform, CloudFormation) to ensure documentation matches reality. If your documentation says you use encryption but your CloudFormation templates do not enforce it, the auditor will catch the discrepancy.

Access controls must follow least privilege for all human and machine access. Use IAM Access Analyzer to identify over-permissioned roles. Maintain access logs for all administrative actions. Review access quarterly. The auditor will ask for evidence that access reviews happen regularly.

Encryption must cover all data at rest and in transit. Enable encryption at rest for all data stores. Enable encryption in transit for all communications. Document key management procedures including rotation schedules and access controls. The auditor will ask for evidence that keys are rotated on schedule.

Monitoring must be comprehensive and operational. Enable CloudTrail in all regions. Enable GuardDuty. Enable Config rules. Centralize logs in a security account. Set up alerts for critical findings. Document your monitoring and response procedures. The auditor will ask for evidence that you actually review the monitoring data.

### Common Audit Findings and How to Prevent Them

Finding 1: Root account does not have hardware MFA. Prevention: Enable hardware MFA for root immediately. Store the hardware token in a secure location. Test it periodically. Document the recovery procedure.

Finding 2: IAM users have access keys that are not rotated. Prevention: Implement a 90-day key rotation policy. Use IAM Access Analyzer to identify old keys. Automate key rotation where possible.

Finding 3: S3 buckets are publicly accessible. Prevention: Enable S3 Block Public Access at the account level. Use AWS Config to detect buckets that are not compliant. Use SCPs to prevent disabling Block Public Access.

Finding 4: CloudTrail is not enabled in all regions. Prevention: Create a multi-region trail that covers all regions. This is a one-time setup that provides continuous coverage.

Finding 5: VPC flow logs are not enabled. Prevention: Enable flow logs for all VPCs. Store them in CloudWatch Logs or S3. Set up retention policies.

Finding 6: Security groups allow unrestricted SSH or RDP. Prevention: Use Config rules to detect unrestricted access. Use SCPs to prevent creation of overly permissive security groups.

Finding 7: RDS instances are not encrypted. Prevention: Enable default encryption for RDS at the account level. Existing instances cannot be encrypted in place; create encrypted snapshots and restore.

Finding 8: Lambda functions have overly permissive execution roles. Prevention: Implement permission boundaries for Lambda roles. Use IAM Access Analyzer to identify unused permissions.

## Compliance as Code

Manual compliance checking does not scale. When your environment has hundreds or thousands of resources, manual checking is impossible. Compliance as code automates the process.

### AWS Config Rules

Config rules are the primary mechanism for compliance as code in AWS. Managed rules cover common compliance requirements. Custom rules written in Lambda handle organization-specific requirements.

A custom Config rule that checks whether all Lambda functions have a specific tag examines each Lambda function when it is created or modified. If the required tag is missing, the function is marked NON-COMPLIANT. This enforces tagging compliance, which is essential for cost allocation, access control, and incident response.

Config rules can trigger automatic remediation using Systems Manager Automation. When a non-compliant resource is detected, Config invokes an SSM Automation document that remediates the resource. For example, when an S3 bucket without encryption is detected, the Automation document enables SSE-S3 encryption. When a security group with unrestricted SSH is detected, the Automation document removes the offending rule.

Use automatic remediation for well-understood, low-risk changes. Use manual remediation for critical resources like databases and production load balancers. The cost of automatically remediating a database configuration change that breaks the application is higher than the cost of a manual review.

### AWS CloudFormation Guard

CloudFormation Guard is a policy-as-code tool that evaluates CloudFormation templates before deployment. It checks templates against a set of rules and blocks non-compliant templates. This is shift-left compliance: catching violations before resources are created, not after.

A rule that prevents public S3 buckets ensures that any S3 bucket created through CloudFormation has all four public access block settings enabled. Templates that do not meet this requirement are rejected during deployment. The developer must fix the template before the infrastructure can be deployed.

### Terraform Sentinel

Terraform Sentinel is the policy-as-code framework for Terraform. Sentinel policies run during terraform plan and can block non-compliant infrastructure changes. A Sentinel policy that requires encryption for S3 buckets blocks bucket creation or update if server-side encryption is not configured. It enforces encryption at the infrastructure level.

### AWS Audit Manager

AWS Audit Manager helps you continuously audit your AWS usage to simplify risk and compliance assessment. It collects evidence automatically from your AWS resources and organizes it into compliance assessments.

Audit Manager maps evidence to compliance framework controls. When an auditor asks for evidence that MFA is enabled for all IAM users, Audit Manager provides the IAM credential report showing MFA status for each user. When an auditor asks for evidence that S3 buckets are encrypted, Audit Manager provides the S3 encryption configuration for each bucket. This eliminates the manual evidence collection that consumes weeks of engineering time before an audit.

## Real Scenario: Passing SOC2 Audit with Automated Compliance

A SaaS company with 50 AWS accounts and 2,000+ resources needed to pass a SOC 2 Type II audit. The previous year, the audit took three months of preparation and cost over 200 engineering hours. The company decided to automate compliance to reduce the burden.

The engineering team implemented a comprehensive compliance as code strategy.

First, they deployed AWS Config rules across all 50 accounts using StackSets. They deployed a standard set of managed Config rules covering IAM, S3, EC2, RDS, and networking. They deployed custom Config rules for organization-specific requirements like mandatory tagging and encryption standards. The StackSet deployment ensured consistent coverage across all accounts with a single operation.

Second, they implemented CloudFormation Guard in their CI/CD pipeline. Every infrastructure change was validated against compliance rules before deployment. If a template violated a rule, the deployment was blocked. This prevented non-compliant resources from being created in the first place. The CI/CD pipeline became a compliance enforcement mechanism.

Third, they set up AWS Audit Manager to collect evidence automatically. Audit Manager gathered IAM credential reports, S3 bucket configurations, VPC flow log settings, and CloudTrail configurations on a weekly basis. The evidence was stored in a dedicated S3 bucket with object lock. When the auditor requested evidence, the company provided a link to the Audit Manager dashboard instead of spending weeks compiling manual reports.

Fourth, they configured Security Hub across all accounts with the SOC 2 standard enabled. Security Hub findings were aggregated in a central security account. A Lambda function checked for new high-severity findings and created tickets in their incident management system. This ensured that compliance failures were addressed promptly, not discovered during the audit.

Fifth, they implemented automated remediation for common non-compliant configurations. When Config detected an S3 bucket without encryption, a Lambda function automatically enabled SSE-S3 encryption. When Config detected a security group with unrestricted SSH, the rule was automatically removed. The remediation Lambda logged every action to CloudTrail for audit purposes.

The results were significant. The audit preparation time dropped from three months to two weeks. The engineering hours required dropped from 200 to 40. The auditor found zero critical findings because non-compliant resources were detected and remediated before the audit began. The auditor spent most of their time reviewing the automation and the evidence collection process rather than manually checking individual resources.

The ongoing cost of compliance dropped dramatically. Instead of a large annual effort, compliance became a continuous process that ran automatically. The security team spent their time on threat detection and incident response instead of manual compliance checks.

The key lesson is that compliance as code is not just about automating checks. It is about shifting compliance left. Instead of finding non-compliant resources after they are deployed, prevent non-compliant resources from being deployed in the first place. Instead of collecting evidence manually before an audit, collect evidence automatically on a continuous basis. Instead of treating compliance as a point-in-time exercise, treat it as a continuous process.


## Compliance Framework Mapping

Understanding how compliance frameworks map to cloud controls is essential for efficient audit preparation. Most frameworks share common control objectives. Mapping them once and implementing controls that satisfy multiple frameworks reduces duplication.

### SOC 2 Trust Service Criteria Mapping

SOC 2 defines five trust service criteria: Security, Availability, Processing Integrity, Confidentiality, and Privacy. Each criterion maps to specific cloud controls.

**Security (Common Criteria):**
- CC6.1: Logical access security maps to IAM policies, MFA, and access reviews
- CC6.2: Access credentials management maps to IAM password policies and key rotation
- CC6.3: Access revocation maps to automated user deprovisioning
- CC6.6: Security measures against threats maps to GuardDuty, WAF, and Shield
- CC6.7: Restriction of access to data maps to IAM policies and VPC security groups
- CC7.1: Detection of unauthorized access maps to CloudTrail and GuardDuty
- CC7.2: Monitoring of system components maps to CloudWatch and Config
- CC8.1: Change management maps to CI/CD pipelines and infrastructure as code

**Availability:**
- A1.1: Capacity management maps to Auto Scaling and reserved capacity
- A1.2: Environmental protections maps to multi-AZ deployments
- A1.3: Recovery procedures maps to AWS Backup and disaster recovery planning

**Confidentiality:**
- C1.1: Data classification maps to data classification policies and tagging
- C1.2: Data disposal maps to S3 lifecycle policies and EBS volume deletion

### PCI DSS Mapping to AWS Controls

PCI DSS v4.0 has 12 requirements. Each maps to specific AWS configurations:

- Requirement 1 (Firewalls): Security groups and NACLs
- Requirement 2 (Default configurations): Hardened AMIs, default security group restrictions
- Requirement 3 (Stored data): S3 encryption, EBS encryption, RDS encryption
- Requirement 4 (Encryption in transit): TLS 1.2+, ACM certificate management
- Requirement 5 (Malware): Amazon Inspector, GuardDuty
- Requirement 6 (Secure systems): Regular patching, vulnerability scanning
- Requirement 7 (Access control): IAM policies, least privilege
- Requirement 8 (Authentication): MFA, IAM Identity Center
- Requirement 9 (Physical access): AWS data center security (provider responsibility)
- Requirement 10 (Logging): CloudTrail, VPC Flow Logs, Config
- Requirement 11 (Testing): Penetration testing, vulnerability scanning
- Requirement 12 (Policies): Documented security policies and procedures

## Compliance Automation Workflow

The compliance automation workflow runs continuously. It is not a one-time setup.

### Step 1: Define Requirements

Document which compliance frameworks apply to your organization. Map each framework's controls to specific cloud configurations. Identify which controls are automated (Config rules, Security Hub) and which require manual evidence (policies, procedures, training records).

### Step 2: Implement Controls

Deploy Config rules for automated controls. Implement infrastructure as code with policy validation for deployment-time controls. Configure logging and monitoring for detective controls. Document procedures for administrative controls.

### Step 3: Collect Evidence

Configure Audit Manager or a similar tool to collect evidence automatically. Store evidence in an immutable location (S3 with object lock). Organize evidence by framework and control.

### Step 4: Assess Compliance

Run Security Hub compliance assessments regularly. Review Config rule compliance status. Identify non-compliant resources and remediate them. Document remediation actions.

### Step 5: Report and Remediate

Generate compliance reports for auditors. Address auditor findings promptly. Update controls based on auditor feedback. Document all changes.

### Step 6: Continuously Improve

Review compliance posture quarterly. Update controls based on new threats and new compliance requirements. Automate manual processes where possible. Share lessons learned with the team.

## Assessment

**Lab Task 1 (60 minutes):** Enable AWS Config with at least 10 managed rules from the CIS AWS Foundations Benchmark. Identify any non-compliant resources. For each non-compliant resource, determine whether the non-compliance is a security risk or a false positive. Remediate the genuine security risks and document the remediation. For false positives, explain why the rule does not apply.

**Lab Task 2 (60 minutes):** Create a custom Config rule using Lambda that checks whether all EC2 instances in your account have a mandatory tag (for example, Environment or Owner). Deploy the rule, verify it detects non-compliant instances, and remediate by adding the required tag to all non-compliant instances. Document the Lambda code, the rule configuration, and the remediation results.

**Lab Task 3 (45 minutes):** Set up AWS Audit Manager for a SOC 2 assessment. Configure the assessment scope to include your EC2, S3, and IAM resources. Run the assessment and review the evidence collected. Verify that the evidence covers the relevant SOC 2 controls. Document any gaps in evidence collection.

**Lab Task 4 (60 minutes):** Write a CloudFormation Guard rule that prevents EC2 instances from being launched without a specific set of tags (Environment, Owner, CostCenter). Test the rule by deploying a CloudFormation template with and without the required tags. Verify that the template without tags is rejected. Document the rule, the test templates, and the test results.

**Grading Criteria:**
- Config rules: are the rules correctly deployed and findings properly assessed? (25%)
- Custom rule: does the Lambda rule correctly detect non-compliant resources? (25%)
- Audit Manager: is the assessment properly configured and evidence collected? (25%)
- CloudFormation Guard: does the rule correctly block non-compliant templates? (25%)

## Evidence

Save the following as evidence:
1. Config rules configuration, non-compliant resource findings, and remediation documentation (Task 1)
2. Custom Config rule Lambda code, rule configuration, and test results (Task 2)
3. Audit Manager assessment configuration, evidence samples, and gap analysis (Task 3)
4. CloudFormation Guard rule, test templates, and test results (Task 4)
