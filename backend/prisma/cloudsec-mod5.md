# Module 5: Logging and Monitoring

## The Difference Between Having Logs and Having Security Visibility

Every cloud environment generates logs. CloudTrail logs every API call. VPC flow logs capture network traffic metadata. Application logs record user actions. GuardDuty analyzes logs for threats. Config records configuration changes. The volume of logs is enormous. A moderately active AWS account generates tens of thousands of CloudTrail events per day.

Having logs is not the same as having security visibility. Logs that nobody reads are useless. Logs that are not retained are useless after the retention period expires. Logs that are not monitored in real time are useful only for forensics, not for prevention. Logs that are not correlated across services miss the patterns that indicate compromise.

This module covers the core AWS logging and monitoring services, how to configure them for security, and how to detect real threats using log analysis.

## CloudTrail: The Foundation of Cloud Auditing

AWS CloudTrail records every API call made in your AWS account. Every console action, every CLI command, every SDK call, every API invocation by an AWS service. If it touches the AWS API, CloudTrail records it.

### CloudTrail Event Types

**Management Events:** These are the default. CloudTrail logs all management API calls: IAM changes, security group modifications, S3 bucket policy changes, EC2 instance launches, and thousands of other operations. Each event includes:
- The caller's identity (IAM user, role, or service)
- The timestamp
- The action performed
- The request parameters
- The response elements
- The source IP address
- The user agent

**Data Events:** These capture S3 object-level operations (Get, Put, Delete) and Lambda function invocations. Data events are high-volume and high-cost, so they are disabled by default. Enable them selectively for sensitive buckets or critical Lambda functions.

**CloudTrail Insights:** CloudTrail Insights automatically detects unusual API activity patterns. It learns your normal API activity baseline and alerts you when activity deviates significantly. For example, if your account normally makes 100 EC2 LaunchInstances calls per day and suddenly makes 10,000, Insights generates a finding.

### Log File Integrity Validation

CloudTrail supports log file integrity validation using SHA-256 hashing and RSA digital signatures. When enabled, CloudTrail creates a digest file for each batch of log files. The digest file contains a hash of each log file and a digital signature that you can verify.

**Why this matters:** If an attacker gains access to your account, they might try to delete or modify CloudTrail logs to cover their tracks. Log file integrity validation allows you to detect tampering. If a log file has been modified, the hash will not match, and verification will fail.

**Verification process:**
1. Download the digest file and the log files from S3
2. Use the AWS CLI to verify: `aws cloudtrail validate-logs --trail-arn arn:aws:cloudtrail:region:account:trail/trail-name --start-time 2024-01-01T00:00:00Z`
3. The CLI verifies the hash chain and reports whether any log files have been modified or deleted

### CloudTrail Configuration Best Practices

**Multi-region trail:** Create a trail that logs events from all regions to a single S3 bucket in a central security account. This ensures you capture events regardless of which region they occur in.

**Log file validation:** Always enable log file integrity validation.

**S3 bucket hardening:** The CloudTrail S3 bucket should have:
- A bucket policy that denies unencrypted uploads (`Deny if s3:x-amz-server-side-encryption is not aws:kms`)
- A bucket policy that denies public access
- Object lock enabled (governance or compliance mode) to prevent deletion
- Access logging enabled to a separate logging bucket

**CloudWatch Logs integration:** Stream CloudTrail events to CloudWatch Logs for real-time analysis and alerting. This is essential for detecting threats in near-real-time.

**Event selectors:** Use event selectors to filter which events are logged. For sensitive buckets, enable S3 data events. For critical Lambda functions, enable Lambda data events. For all other resources, management events are sufficient.

### CloudTrail Log Analysis

**Finding compromised credentials using CloudTrail:**

A compromised access key generates API calls from an unusual source IP, user agent, or geographic location. Query CloudTrail logs in CloudWatch Logs Insights:

```sql
fields @timestamp, eventSource, eventName, userIdentity.type, sourceIPAddress, userAgent
| filter userIdentity.type = "AccessKey"
| filter sourceIPAddress not like /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/
| sort @timestamp desc
| limit 50
```

This query finds access key usage from non-private IP addresses, which may indicate external access using stolen credentials.

**Detecting privilege escalation:**

```sql
fields @timestamp, eventName, userIdentity.arn, requestParameters
| filter eventName in ["CreatePolicyVersion", "SetDefaultPolicyVersion", "AttachUserPolicy", "AttachRolePolicy", "AttachGroupPolicy", "CreateAccessKey", "CreateLoginProfile"]
| sort @timestamp desc
| limit 50
```

This query detects IAM privilege escalation attempts: creating or attaching policies, creating access keys for other users, or creating login profiles.

**Detecting data exfiltration:**

```sql
fields @timestamp, eventName, requestParameters, responseElements
| filter eventName in ["GetObject", "GetBucketPolicy", "ListBucket"]
| filter requestParameters.bucketName like /prod|backup|archive/
| sort @timestamp desc
| limit 100
```

This query detects unusual access to production, backup, or archive S3 buckets, which may indicate data exfiltration.

## GuardDuty: Threat Detection at Scale

Amazon GuardDuty is a threat detection service that continuously monitors for malicious activity and unauthorized behavior. It analyzes CloudTrail management events, CloudTrail data events (S3 and Lambda), VPC flow logs, DNS logs, and EKS audit logs.

### How GuardDuty Works

GuardDuty uses threat intelligence feeds (IP addresses associated with malicious activity, domains known for command and control), machine learning (behavioral baselines for your account), and anomaly detection (unusual API call patterns, unusual network flows) to identify threats.

GuardDuty generates findings with severity levels (Low, Medium, High, Critical) and finding types. Each finding type corresponds to a specific threat pattern.

### Key Finding Types

**Reconnaissance:**
- `UnauthorizedAccess:EC2/MaliciousIPCaller.Custom`: EC2 instance receiving connections from a known malicious IP
- `Recon:IAMUser/NetworkPermissions`: IAM user changed network permissions (security group, NACL)
- `Recon:IAMUser/UserPermissions`: IAM user enumerated permissions

**Compromise:**
- `UnauthorizedAccess:EC2/TorIPCaller`: EC2 instance communicating with a Tor exit node
- `CredentialAccess:IAMUser/AnomalousBehavior`: IAM user making API calls at unusual times or from unusual locations
- `DefenseEvasion:IAMUser/ConsoleLogin`: Console login with subsequent disabling of security controls

**Instance compromise:**
- `UnauthorizedAccess:EC2/TorClient`: EC2 instance acting as a Tor client
- `Behavior:IAMUser/InstanceConnect`: EC2 instance connect to from an unusual location
- `Trojan:EC2/DGADomainRequest破解`: EC2 instance communicating with a domain generation algorithm (DGA) domain

### GuardDuty Configuration

**Enable GuardDuty:** `aws guardduty create-detector --enable` in each region where you have resources. In an AWS Organization, you can enable GuardDuty for all accounts using the delegated administrator account.

**GuardDuty with S3 Protection:** Enable S3 Protection to analyze S3 data events. This adds monitoring of S3 API calls (GetObject, PutObject, DeleteObject, PutBucketPolicy, PutBucketAcl) and detects anomalies like unusual access patterns or access from suspicious IPs.

**GuardDuty with EKS Protection:** Enable EKS Audit Log Monitoring to analyze Kubernetes API server audit logs. This detects suspicious pod creation, unauthorized access to the API server, and privilege escalation in Kubernetes.

**GuardDuty findings → EventBridge:** GuardDuty sends findings to EventBridge, which can trigger Lambda functions for automated response. For example, automatically isolate an EC2 instance when GuardDuty detects crypto-mining activity.

### GuardDuty Automation

GuardDuty findings can trigger automated responses through EventBridge rules:

```json
{
  "source": ["aws.guardduty"],
  "detail-type": ["GuardDuty Finding"],
  "detail": {
    "severity": [{"numeric": [">=", 7]}]
  }
}
```

This rule triggers on GuardDuty findings with severity 7 or higher. The target can be a Lambda function that:
- Disables the compromised IAM access key
- Isolates the affected EC2 instance (updates security groups to deny all traffic)
- Sends a notification to the security team
- Creates a ticket in the incident management system

## AWS Config: Configuration Compliance

AWS Config records the configuration of your AWS resources and evaluates them against rules you define. Config is not a real-time threat detection service. It is a configuration compliance service that answers the question "is my resource configured correctly?"

### How Config Works

Config continuously monitors resource configurations. When a resource changes (security group rule added, S3 bucket policy modified, IAM policy attached), Config records the change and evaluates it against your rules.

**Config rule evaluation:**
- Config rule defines the desired configuration
- Config evaluates each resource against the rule
- Resources that comply are marked as "COMPLIANT"
- Resources that do not comply are marked as "NON-COMPLIANT"

### Managed Config Rules

AWS provides dozens of managed Config rules for common compliance checks:

**Security-focused rules:**
- `s3-bucket-public-read-prohibited`: Detects S3 buckets with public read access
- `s3-bucket-ssl-requests-only`: Detects S3 buckets without HTTPS-only access
- `restricted-ssh`: Detects security groups allowing unrestricted SSH access
- `ec2-instance-no-public-ip`: Detects EC2 instances with public IP addresses (useful for production)
- `iam-user-mfa-enabled`: Detects IAM users without MFA enabled
- `iam-password-policy`: Validates password policy meets requirements
- `root-account-mfa-enabled`: Detects root account without MFA
- `access-keys-rotated`: Detects access keys older than 90 days

### Custom Config Rules

For organization-specific compliance requirements, create custom Config rules using Lambda functions:

```python
import boto3
import json

def lambda_handler(event, context):
    config = boto3.client('config')
    invoking_event = json.loads(event['invokingEvent'])
    configuration_item = invoking_event['configurationItem']
    
    if configuration_item['resourceType'] != 'AWS::EC2::SecurityGroup':
        return
    
    sg_id = configuration_item['resourceId']
    ec2 = boto3.client('ec2')
    sg = ec2.describe_security_groups(GroupIds=[sg_id])['SecurityGroups'][0]
    
    compliance = 'COMPLIANT'
    for rule in sg['IpPermissions']:
        for ip_range in rule.get('IpRanges', []):
            if ip_range.get('CidrIp') == '0.0.0.0/0':
                if rule.get('FromPort') == 22 or rule.get('FromPort') == 3389:
                    compliance = 'NON-COMPLIANT'
                    break
    
    config.put_evaluations(
        Evaluations=[{
            'ComplianceResourceType': configuration_item['resourceType'],
            'ComplianceResourceId': configuration_item['resourceId'],
            'ComplianceType': compliance,
            'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
        }],
        ResultToken=event['resultToken']
    )
```

This custom rule checks security groups for unrestricted SSH (port 22) and RDP (port 3389) access. Any security group with 0.0.0.0/0 access to these ports is marked NON-COMPLIANT.

### Config Remediation

Config rules can automatically remediate non-compliant resources using Systems Manager Automation documents. For example, when a security group is created with unrestricted SSH, Config can automatically remove the offending rule.

**Remediation workflow:**
1. Config detects non-compliant resource
2. Config triggers the associated SSM Automation document
3. SSM Automation runs the remediation steps
4. Config re-evaluates the resource and marks it as COMPLIANT

**Caution:** Automatic remediation can break things. Test thoroughly in non-production environments. Use manual remediation for critical resources (databases, production load balancers) and automatic remediation only for well-understood, low-risk changes.

## Security Hub: Aggregated Security Findings

AWS Security Hub aggregates findings from GuardDuty, Config, IAM Access Analyzer, Amazon Macie, Amazon Inspector, AWS Firewall Manager, and third-party security tools. It provides a single dashboard for your security posture.

### Security Hub Standards

Security Hub evaluates your environment against industry standards:

**AWS Foundational Security Best Practices:** 56 controls covering IAM, VPC, S3, EC2, RDS, CloudTrail, and more. Based on AWS security best practices.

**CIS AWS Foundations Benchmark:** Controls based on the Center for Internet Security benchmark for AWS.

**PCI DSS v3.2.1:** Controls for PCI DSS compliance.

**NIST Special Publication 800-53 Rev. 5:** Controls based on the NIST framework.

**ISO/IEC 27001:2013:** Controls based on the ISO 27001 standard.

**SOC 2:** Controls based on SOC 2 Trust Service Criteria.

### Security Hub Findings

Each finding includes:
- A severity level (informational, low, medium, high, critical)
- The affected resource
- The compliance standard and control that failed
- Remediation steps
- The time the finding was generated

### Security Hub Automation

Security Hub findings can trigger automated responses through EventBridge:

```json
{
  "source": ["aws.securityhub"],
  "detail-type": ["Security Hub Findings - Imported"],
  "detail": {
    "findings": {
      "Compliance": {
        "Status": ["FAILED"]
      },
      "Severity": {
        "Label": ["CRITICAL", "HIGH"]
      }
    }
  }
}
```

This rule triggers on critical or high severity findings that failed compliance checks. The target can be a Lambda function that creates a ticket, sends a notification, or initiates remediation.

## Real Scenario: Detecting Compromised Credentials via CloudTrail

In August 2023, a mid-size e-commerce company detected a security incident through CloudTrail analysis. The incident response team identified that an attacker had obtained AWS access keys for a developer account and was attempting to exfiltrate customer data from S3.

**Timeline of events:**

**Day 1, 14:23 UTC:** The developer's access key was used to call `iam:ListUsers` from IP address 185.220.100.252 (a known Tor exit node). This was unusual because the developer normally accessed AWS from their office IP.

**Day 1, 14:25 UTC:** The attacker called `iam:GetPolicy` and `iam:ListAttachedUserPolicies` to enumerate the developer's permissions. The developer had read access to a staging S3 bucket.

**Day 1, 14:27 UTC:** The attacker called `s3:ListBucket` on the staging bucket to enumerate its contents. The staging bucket contained 50,000 objects.

**Day 1, 14:30 UTC:** The attacker called `s3:GetObject` on 200 objects in the staging bucket. The staging bucket contained sample customer data (names, email addresses, order history) used for testing.

**Day 1, 14:45 UTC:** The attacker attempted to call `s3:GetBucketPolicy` on the production bucket but was denied (the developer's permissions did not extend to production).

**Day 1, 15:02 UTC:** The attacker called `iam:CreateAccessKey` on the developer's own user. This generated a new access key, which the attacker used for subsequent operations.

**Day 1, 15:10 UTC:** GuardDuty generated a finding: `CredentialAccess:IAMUser/AnomalousBehavior`: the developer's access key was used from a Tor exit node at an unusual time.

**Day 1, 15:15 UTC:** The security team received the GuardDuty finding notification and began investigation.

**Day 1, 15:30 UTC:** The security team reviewed CloudTrail logs and identified the full scope of the attacker's activity. They determined the attacker had accessed staging data but not production data.

**Day 1, 15:45 UTC:** The security team disabled the developer's access keys, created new keys for the developer, and initiated a review of the staging bucket data access.

**Day 1, 16:00 UTC:** The security team notified affected customers (the staging data contained real customer data used for testing, which was a separate compliance issue).

**What worked:**
- CloudTrail was enabled with log file integrity validation
- CloudTrail logs were streamed to CloudWatch Logs
- GuardDuty was enabled with S3 protection
- The security team had a playbook for compromised credential incidents
- S3 bucket policies prevented cross-bucket access

**What could have been better:**
- CloudTrail Insights could have detected the anomalous API activity sooner (before GuardDuty generated the finding)
- The developer's IAM policy was too broad (ListUsers, GetPolicy were not needed for their tasks)
- Real customer data should not have been in a staging environment
- The developer did not have MFA enabled on console access

**Lessons learned:**
- Enable CloudTrail Insights for all accounts
- Scope IAM policies to only the actions needed
- Implement data classification and prevent production data from being in non-production environments
- Enforce MFA for all users
- Monitor for Tor exit node and known malicious IP access


## CloudWatch Alarms for Security Monitoring

CloudWatch alarms transform passive log data into active detection capabilities. An alarm watches a metric or log pattern and triggers when the threshold is breached. The alarm can send notifications, trigger Lambda functions, or invoke Systems Manager Automation documents.

### Security-Focused Alarm Configurations

**Unauthorized API calls alarm:**
Create a metric filter on CloudTrail logs that matches the error code AccessDenied or UnauthorizedAccess. The metric filter counts these events per hour. The alarm triggers when the count exceeds a threshold (for example, 100 unauthorized calls per hour). This detects reconnaissance activity where an attacker is probing for accessible resources.

**Root account usage alarm:**
Create a metric filter on CloudTrail logs that matches the userIdentity.type value of Root. The alarm triggers on any occurrence. Root account usage should be extremely rare (only for initial setup and emergency account recovery). Any root usage outside of planned maintenance should be investigated immediately.

**IAM policy changes alarm:**
Create a metric filter on CloudTrail logs that matches events like CreatePolicy, AttachUserPolicy, AttachRolePolicy, PutUserPolicy, and PutRolePolicy. The alarm triggers on any occurrence. IAM policy changes can indicate privilege escalation. An attacker who creates a policy granting themselves admin access can then do anything in the account.

**Security group changes alarm:**
Create a metric filter on CloudTrail logs that matches AuthorizeSecurityGroupIngress, AuthorizeSecurityGroupEgress, and CreateSecurityGroup. The alarm triggers when security group rules are modified. An attacker may open port 22 or 3389 to gain remote access, or open ports to allow data exfiltration.

**CloudTrail configuration changes alarm:**
Create a metric filter on CloudTrail logs that matches StopLogging and DeleteTrail. The alarm triggers immediately. An attacker who stops CloudTrail logging can operate without leaving an audit trail. This is one of the first actions an attacker takes to cover their tracks.

### Alarm Notification Architecture

Send alarm notifications to multiple channels:
- **SNS topic** that sends email to the security team
- **SNS topic** that sends SMS to the on-call engineer
- **EventBridge rule** that triggers a Lambda function for automated response
- **Integration with PagerDuty or Opsgenie** for incident management

Do not rely on a single notification channel. If the email notification fails (SPAM filter, mailbox full), the SMS notification provides a backup. If the on-call engineer does not respond, the PagerDuty escalation policy notifies the backup engineer.

## Amazon Detective

Amazon Detective is a security investigation service that helps you analyze, investigate, and identify the root cause of potentially suspicious activities. It automatically collects and summarizes CloudTrail, VPC Flow Logs, and GuardDuty findings.

### How Detective Works

Detective builds a graph model of your AWS resources, IP addresses, users, and their interactions over time. It uses machine learning to identify unusual patterns and presents them in an interactive visual interface.

When GuardDuty generates a finding, Detective provides an interactive investigation view. You can see:
- The affected resource and its activity over time
- The users and roles that interacted with the resource
- The IP addresses that communicated with the resource
- The geographic locations of the IP addresses
- Unusual patterns in the resource's behavior

### Detective Use Cases

**Compromised credential investigation:** When GuardDuty detects anomalous behavior from an IAM user, Detective shows the user's activity timeline. You can see every API call the user made, when they made it, and from where. This helps determine the scope of the compromise.

**EC2 instance compromise investigation:** When GuardDuty detects crypto-mining or communication with a malicious IP, Detective shows the instance's network connections, process history, and the user who launched the instance. This helps trace the attack from initial access to current activity.

**S3 data exfiltration investigation:** When GuardDuty detects unusual S3 data access, Detective shows which objects were accessed, when, and from where. This helps determine what data was exposed and whether it was downloaded or just listed.

## VPC Flow Logs Analysis Deep Dive

VPC flow logs capture network traffic metadata. Analyzing flow logs helps you understand network behavior, detect anomalies, and troubleshoot connectivity issues.

### Flow Log Analysis Queries

**Find the top 10 talkers (source IPs with most traffic):**
```sql
fields srcAddr
| stats sum(bytes) as totalBytes by srcAddr
| sort totalBytes desc
| limit 10
```

**Find all rejected SSH connections:**
```sql
fields @timestamp, srcAddr, dstAddr, srcPort, dstPort, action
| filter action = "REJECT" and dstPort = 22
| sort @timestamp desc
| limit 100
```

**Find connections to known malicious IPs (requires threat intelligence feed):**
```sql
fields @timestamp, srcAddr, dstAddr, dstPort
| filter dstAddr in ["185.220.100.252", "198.51.100.0"]
| sort @timestamp desc
```

**Find unusual outbound traffic patterns:**
```sql
fields @timestamp, srcAddr, dstAddr, dstPort, bytes
| filter action = "ACCEPT" and dstPort != 443 and dstPort != 80
| stats sum(bytes) as totalBytes by srcAddr, dstAddr, dstPort
| sort totalBytes desc
| limit 20
```

**Find all traffic from a specific instance:**
```sql
fields @timestamp, srcAddr, dstAddr, srcPort, dstPort, action, bytes
| filter instanceId = "i-0abc123def456789"
| sort @timestamp desc
| limit 200
```

### Flow Log Troubleshooting

**Instance cannot reach the internet:**
1. Check if the instance has a public IP or NAT gateway route
2. Check the security group allows outbound traffic
3. Check the NACL allows outbound traffic on the required ports
4. Check the route table has a route to the internet gateway or NAT gateway
5. Check the flow logs for REJECT records on the instance's ENI

**Instance cannot reach another instance:**
1. Check if both instances are in the same VPC or peered VPC
2. Check the route tables for routes between the subnets
3. Check the security groups allow the required traffic
4. Check the NACLs allow the required traffic
5. Check the flow logs for REJECT records

**Database connection timeout:**
1. Check if the database is in a private subnet with no internet route (expected)
2. Check the security group allows inbound on the database port from the application subnet
3. Check the NACL allows outbound from the application subnet to the database subnet
4. Check the flow logs for REJECT records on the database port

## Assessment

**Lab Task 1 (60 minutes):** Enable CloudTrail with multi-region logging and log file integrity validation. Stream events to CloudWatch Logs. Create three CloudWatch Logs Insights queries: (1) find all IAM policy changes in the last 24 hours, (2) find all console logins from IP addresses outside your organization's range, (3) find all S3 PutBucketPolicy calls. Run each query and interpret the results.

**Lab Task 2 (60 minutes):** Enable GuardDuty in your account. Generate at least three different types of findings by performing actions that GuardDuty flags (accessing S3 from an unusual IP, creating access keys, disabling CloudTrail). Monitor the findings in the GuardDuty console. Create an EventBridge rule that sends a notification (via SNS) for findings with severity 7 or higher.

**Lab Task 3 (45 minutes):** Enable AWS Config with at least five security-focused managed rules (s3-bucket-public-read-prohibited, restricted-ssh, iam-user-mfa-enabled, root-account-mfa-enabled, access-keys-rotated). Remediate one non-compliant resource manually. Verify the resource becomes compliant after remediation. Document each rule, the resources it evaluates, and the remediation steps.

**Grading Criteria:**
- CloudTrail configuration: is it properly configured for security monitoring? (25%)
- Query quality: do the CloudWatch queries detect real security events? (25%)
- GuardDuty setup: is it enabled and generating meaningful findings? (25%)
- Config compliance: are the rules correctly configured and remediation working? (25%)

## Evidence

Save the following as evidence:
1. CloudTrail configuration screenshots, CloudWatch Logs Insights query results, and your interpretation (Task 1)
2. GuardDuty findings, EventBridge rule configuration, and test notification (Task 2)
3. AWS Config compliance dashboard, rule configurations, and remediation documentation (Task 3)
