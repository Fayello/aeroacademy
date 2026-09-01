# Module 9 -- Incident Response in the Cloud

## When Things Go Wrong in Cloud Environments

Incident response in the cloud is different from incident response on-premises. On-premises, you have a physical network you can isolate, servers you can image, hard drives you can seize. In the cloud, your infrastructure is API-driven, ephemeral, and distributed. An EC2 instance can be terminated in seconds. A Lambda function can be deleted with one command. S3 objects can be bulk-deleted. An attacker who gains access to your AWS account can cause damage faster than you can blink.

The good news is that cloud environments also provide better visibility and faster response capabilities than most on-premises environments. CloudTrail logs every API call. GuardDuty detects threats in near-real-time. Lambda can automate response actions in seconds. Snapshots let you preserve evidence without taking systems offline.

The key to effective cloud incident response is preparation. You need playbooks before the incident happens. You need automated responses for common scenarios. You need practice running through the playbooks. This module covers how to build and operate an incident response capability for cloud environments.

## Cloud-Based IR Playbook

An IR playbook is a step-by-step procedure for responding to a specific type of incident. Each playbook defines who does what, in what order, and how to communicate throughout the process.

### Playbook Structure

Every playbook should contain these sections:

**Detection and Triage:** How do you know this incident is happening? What alert triggered the response? What is the initial assessment of severity and scope?

**Containment:** What immediate actions stop the bleeding? Isolate the affected resource. Revoke compromised credentials. Block malicious IP addresses. The goal is to limit further damage while preserving evidence.

**Eradication:** What caused the incident? Remove the vulnerability. Patch the application. Update the configuration. Fix the IAM policy that was too permissive.

**Recovery:** Restore the affected systems to normal operation. Verify that the vulnerability is fixed. Monitor for re-compromise.

**Post-Incident:** Document what happened. Identify what worked and what did not. Update the playbook based on lessons learned. Share findings with the team.

### Playbook for Compromised AWS Credentials

This is the most common cloud incident. An attacker obtains AWS access keys, session tokens, or console passwords and uses them to access your AWS resources.

**Step 1: Detect the compromise.** GuardDuty generates a finding like CredentialAccess:IAMUser/AnomalousBehavior. CloudTrail shows API calls from an unusual source IP. A GuardDuty finding or CloudWatch alarm triggers the playbook.

**Step 2: Contain immediately.** Disable the compromised IAM access keys. Do not delete them yet (you need them for forensic analysis). If a user account is compromised, disable the account. If a role is compromised, remove the trust policy that allowed the compromise. If an EC2 instance is compromised, isolate it by updating its security group to deny all inbound and outbound traffic.

**Step 3: Scope the compromise.** Review CloudTrail logs for all API calls made by the compromised principal. Identify every resource the attacker accessed. Check for:
- IAM policy changes (new users, new roles, new access keys)
- S3 data access (GetObject calls to sensitive buckets)
- EC2 instances launched (crypto-mining, attack infrastructure)
- VPC changes (new security group rules, new internet gateways)
- Database access (RDS queries, DynamoDB reads)

**Step 4: Eradicate.** Revoke all access created by the attacker. Delete any IAM users, roles, or access keys the attacker created. Terminate any EC2 instances the attacker launched. Revert any security group or NACL changes. Restore any S3 bucket policies that were modified.

**Step 5: Recover.** Rotate all credentials that may have been exposed. This includes access keys for all users who had access to the compromised account, database passwords, API keys, and any other secrets. Update applications to use the new credentials.

**Step 6: Investigate.** Determine how the credentials were compromised. Was it a phishing attack? A leaked access key in a public repository? A compromised developer workstation? Understanding the root cause prevents recurrence.

### Playbook for Compromised EC2 Instance

An EC2 instance is compromised through a vulnerability in the application, a weak SSH password, or a misconfigured security group.

**Step 1: Isolate.** Update the instance security group to deny all inbound and outbound traffic except from the incident response team's bastion host. This preserves the instance for forensic analysis while preventing further damage.

**Step 2: Snapshot.** Create EBS snapshots of all volumes attached to the instance. Create an AMI from the instance. These snapshots provide a forensic image you can analyze offline.

**Step 3: Investigate.** Analyze the instance for signs of compromise:
- Check running processes for crypto-mining, reverse shells, or unexpected daemons
- Review log files for unauthorized access
- Check for new SSH keys in authorized_keys files
- Examine network connections for command and control traffic
- Review IAM role credentials usage in CloudTrail

**Step 4: Eradicate.** Terminate the compromised instance. Launch a new instance from a clean AMI. Do not reuse the compromised instance. Apply all security patches. Update the application code if a vulnerability was exploited.

**Step 5: Recover.** Deploy the new instance with updated security controls. Verify the new instance passes all security checks. Monitor closely for re-compromise.

### Playbook for Data Breach in S3

An S3 bucket containing sensitive data is publicly exposed or accessed by unauthorized principals.

**Step 1: Contain.** Enable S3 Block Public Access on the bucket. Update the bucket policy to deny all public access. If the bucket was public due to a bucket policy, remove the offending policy statement. If it was public due to ACL settings, update the ACL.

**Step 2: Assess.** Enable S3 server access logging on the bucket if not already enabled. Review the access logs to identify every principal that accessed the bucket and every object that was accessed. Check CloudTrail for S3 data events related to the bucket.

**Step 3: Notify.** If personal data was exposed, notify your legal and compliance teams. Depending on the data type and jurisdiction, you may need to notify affected individuals, regulatory authorities, or both. GDPR requires notification within 72 hours. CCPA requires notification "in the most expedient time possible."

**Step 4: Remediate.** Fix the misconfiguration that allowed public access. Enable encryption if not already enabled. Enable versioning to allow recovery of deleted objects. Enable lifecycle policies to manage object retention.

**Step 5: Monitor.** Set up CloudWatch alarms for S3 data events on the bucket. Use Amazon Macie to continuously monitor for sensitive data exposure. Create Config rules to detect future public bucket configurations.

## Forensics in the Cloud

Cloud forensics is the process of collecting and analyzing digital evidence from cloud environments. It is different from traditional forensics because you cannot physically seize hardware. Instead, you work with snapshots, logs, and API calls.

### EBS Snapshots for Forensic Imaging

EBS snapshots create point-in-time copies of EBS volumes. They are the cloud equivalent of disk images. When an EC2 instance is compromised, create snapshots of all attached volumes before terminating the instance.

**Snapshot forensics process:**
1. Create snapshots of all EBS volumes attached to the compromised instance
2. Copy snapshots to a forensic account (separate AWS account used only for investigations)
3. Launch an analysis instance in the forensic account with the snapshots attached
4. Analyze the snapshots using forensic tools (volatility for memory analysis, sleuthkit for disk analysis)
5. Document all findings with timestamps and evidence hashes

**Important:** Snapshots preserve the volume at the time of the snapshot. If the attacker modified files after the snapshot was created, those modifications are not captured. Create snapshots as quickly as possible after detection.

### VPC Traffic Capture

VPC traffic capture is not built-in to AWS. You need to implement it using VPC Traffic Mirroring or third-party tools.

**VPC Traffic Mirroring** copies network traffic from an ENI (elastic network interface) and sends it to a monitoring appliance. The monitoring appliance captures and analyzes the traffic.

To capture traffic from a compromised instance:
1. Create a traffic mirror target pointing to your monitoring instance
2. Create a traffic mirror session for the compromised instance ENI
3. Traffic from the compromised instance is mirrored to the monitoring instance
4. Use tcpdump or Wireshark on the monitoring instance to capture and analyze the traffic

Traffic mirroring must be set up before the incident. You cannot retroactively capture traffic that was not mirrored. This is why continuous traffic mirroring for high-value instances is important.

### CloudTrail for Forensic Timeline

CloudTrail provides the timeline of every API call made in your account. It is the most important forensic data source in AWS.

**Building a forensic timeline:**
1. Filter CloudTrail logs for the time period of the incident
2. Filter by the compromised principal (IAM user, role, or access key)
3. Sort by timestamp to create a chronological timeline
4. Document each API call with its parameters, response, source IP, and user agent
5. Identify the initial compromise vector (first unauthorized API call)
6. Trace the attacker's actions through the timeline

**CloudTrail Insights** can help identify the start of the incident by detecting unusual API activity patterns. If the attacker's activity deviates significantly from the baseline, Insights generates a finding with the time period and the unusual activity.

### S3 Object Forensics

S3 versioning preserves every version of every object. If an attacker modifies or deletes objects, the previous versions are preserved. Enable versioning on all S3 buckets containing sensitive data.

To recover deleted objects:
1. List all object versions in the bucket
2. Identify the versions that were deleted (shown in the list with a delete marker)
3. Restore the previous versions by copying them back
4. Remove the delete markers

To recover modified objects:
1. List all object versions in the bucket
2. Identify the version that was modified
3. Restore the previous version
4. Verify the previous version is the correct version

## Lambda for Automated Response

Lambda functions can automate incident response actions. When a GuardDuty finding is detected, EventBridge triggers a Lambda function that performs containment actions.

### Automated Containment Lambda

```python
import boto3
import json

ec2 = boto3.client('ec2')
iam = boto3.client('iam')
sns = boto3.client('sns')

def lambda_handler(event, context):
    finding = event['detail']
    severity = finding['severity']
    finding_type = finding['type']

    if 'EC2' in finding_type:
        instance_id = finding['resource']['instanceDetails']['instanceId']

        # Isolate the EC2 instance
        # Get current security groups
        instance = ec2.describe_instances(InstanceIds=[instance_id])
        current_sgs = [sg['GroupId'] for sg in instance['Reservations'][0]['Instances'][0]['SecurityGroups']]

        # Create isolation security group
        isolation_sg = ec2.create_security_group(
            GroupName=f'isolation-{instance_id}',
            Description=f'Isolation SG for {instance_id}',
            VpcId=instance['Reservations'][0]['Instances'][0]['VpcId']
        )

        # Replace instance security groups with isolation SG
        ec2.modify_instance_attribute(
            InstanceId=instance_id,
            Groups=[isolation_sg['GroupId']]
        )

        # Notify
        sns.publish(
            TopicArn='arn:aws:sns:us-east-1:123456789012:security-alerts',
            Message=f'EC2 instance {instance_id} isolated due to {finding_type}. Severity: {severity}'
        )

    elif 'IAM' in finding_type:
        # Disable compromised access key
        access_key_id = finding['resource']['accessKeyDetails']['accessKeyId']
        user_name = finding['resource']['accessKeyDetails']['userName']

        iam.update_access_key(
            UserName=user_name,
            AccessKeyId=access_key_id,
            Status='Inactive'
        )

        sns.publish(
            TopicArn='arn:aws:sns:us-east-1:123456789012:security-alerts',
            Message=f'Access key {access_key_id} for user {user_name} disabled due to {finding_type}'
        )

    return {
        'statusCode': 200,
        'body': json.dumps(f'Automated response completed for {finding_type}')
    }
```

This Lambda function handles two common scenarios. For EC2 compromises, it creates an isolation security group with no rules and attaches it to the compromised instance, effectively cutting off all network access. For IAM compromises, it disables the compromised access key. In both cases, it sends a notification to the security team via SNS.

### EventBridge Rule for Automated Response

```json
{
  "source": ["aws.guardduty"],
  "detail-type": ["GuardDuty Finding"],
  "detail": {
    "severity": [{"numeric": [">=", 7]}]
  }
}
```

This EventBridge rule triggers on GuardDuty findings with severity 7 or higher. The target is the Lambda function that performs automated containment. This ensures that high-severity findings trigger immediate response without human intervention.

### Automation Considerations

Automated response is powerful but risky. A false positive can isolate a legitimate production instance or disable a critical access key. Mitigate this risk by:

- Limiting automated response to severity 7 or higher (high confidence findings)
- Restricting automated response to specific finding types (EC2 isolation, access key disabling)
- Notifying the security team immediately so they can review and reverse if needed
- Logging every automated action to CloudTrail for audit
- Testing the automation regularly with simulated findings
- Having a manual override process for cases where automated response is inappropriate

## Cross-Account Investigation

Organizations often have multiple AWS accounts: production, development, staging, security, logging, and shared services. An incident in one account may require investigation across multiple accounts.

### Centralized Logging

Store CloudTrail logs from all accounts in a central security account. Use CloudTrail organization trails to collect logs from all accounts in the organization automatically. This provides a single location for forensic analysis across all accounts.

**Architecture:**
- Each account has a CloudTrail trail that logs to S3 in the same account
- An organization trail in the management account also logs to S3 in the management account
- The security account has cross-account read access to all trail S3 buckets
- GuardDuty findings from all accounts are aggregated in the security account
- Security Hub in the security account aggregates findings from all accounts

### Cross-Account Role Assumption

When investigating an incident, the incident response team assumes a role in the affected account. This role has read-only permissions for forensic analysis: CloudTrail, VPC Flow Logs, S3 access logs, EC2 describe operations, and IAM credential reports.

**Cross-account investigation role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::security-account-id:role/IncidentResponseRole"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": ["us-east-1", "us-west-2"]
        }
      }
    }
  ]
}
```

This trust policy allows the incident response role in the security account to assume the investigation role in the affected account, but only in specific regions. The investigation role has read-only permissions and cannot modify resources.

### Investigation Workflow

1. Receive alert from GuardDuty or CloudWatch in the security account
2. Assume the investigation role in the affected account
3. Collect CloudTrail logs for the time period of the incident
4. Collect VPC flow logs for the affected instances
5. Collect S3 access logs for affected buckets
6. Build a timeline of the attacker's actions
7. Identify the initial compromise vector
8. Determine the scope of the compromise
9. Document findings and recommend remediation
10. Switch to the remediation role (with write permissions) to implement fixes

## Real Scenario: Responding to Compromised EC2 Instance

In March 2024, a media company detected a compromised EC2 instance through GuardDuty. The finding was UnauthorizedAccess:EC2/TorIPCaller, indicating that the instance was communicating with a Tor exit node.

**Timeline of the response:**

**08:15 UTC:** GuardDuty generates finding UnauthorizedAccess:EC2/TorIPCaller for instance i-0abc123def456789 in the production account. The finding is forwarded to EventBridge.

**08:16 UTC:** EventBridge triggers the automated response Lambda. The Lambda creates an isolation security group and attaches it to the instance, cutting off all network access. The Lambda sends an SNS notification to the security team.

**08:18 UTC:** The on-call security engineer receives the notification and begins investigation. They assume the investigation role in the production account.

**08:25 UTC:** The engineer reviews CloudTrail logs for the instance's IAM role. They find that the instance role made s3:GetObject calls to a bucket containing customer media files between 07:30 and 08:15 UTC. The calls were from IP addresses associated with Tor exit nodes.

**08:35 UTC:** The engineer creates EBS snapshots of all volumes attached to the instance. They copy the snapshots to the forensic account for analysis.

**08:45 UTC:** The engineer reviews VPC flow logs for the instance. They find that the instance initiated outbound connections to several Tor exit node IPs starting at 07:20 UTC. The connections were on port 443, disguised as HTTPS traffic.

**09:00 UTC:** The engineer terminates the compromised instance. They launch a replacement instance from a clean AMI with updated security controls.

**09:15 UTC:** The engineer rotates all credentials that may have been exposed. This includes the instance role's access key (if any), the S3 bucket's access policies, and any application-level credentials stored on the instance.

**09:30 UTC:** The engineer enables S3 access logging on the affected bucket and reviews the access logs to determine which objects were accessed by the attacker. They find that 500 customer media files were downloaded.

**10:00 UTC:** The engineer notifies the legal and compliance teams about the data exposure. The legal team begins the notification process for affected customers.

**10:30 UTC:** The engineer documents the incident, including the timeline, the scope, the root cause, and the remediation steps. The root cause was a vulnerable web application running on the instance that allowed remote code execution. The attacker exploited the vulnerability, installed a reverse shell, and used the instance's IAM role to access S3.

**What worked:**
- GuardDuty detected the compromise within minutes
- Automated response isolated the instance before the attacker could exfiltrate more data
- CloudTrail provided a complete timeline of the attacker's actions
- EBS snapshots preserved the forensic evidence
- Cross-account investigation was fast and did not require direct console access

**What could have been improved:**
- The web application vulnerability should have been patched before the incident
- The instance role should have had more restrictive S3 permissions (only the specific prefixes needed)
- GuardDuty findings should have triggered faster response (the 15-minute gap between finding and notification was due to a misconfigured SNS topic)
- The S3 bucket should have had access logging enabled before the incident, not after

**Post-incident improvements:**
- Enabled VPC traffic mirroring for all production instances
- Implemented automated vulnerability scanning for web applications
- Tightened instance role permissions to specific S3 prefixes
- Fixed the SNS configuration to ensure immediate notification
- Enabled S3 access logging on all buckets containing sensitive data


## IR Team Roles and Responsibilities

Effective incident response requires clear roles and responsibilities. Everyone on the team must know what they are responsible for before an incident occurs.

### Incident Commander

The incident commander leads the response effort. They make decisions about containment, escalation, and communication. They do not perform technical investigation (that is the investigator's job). They coordinate the response, track progress, and ensure the team follows the playbook.

The incident commander is the single point of communication during the incident. All updates go through them. This prevents conflicting information from reaching leadership and stakeholders.

### Technical Investigator

The technical investigator performs the hands-on investigation. They analyze CloudTrail logs, VPC flow logs, and system artifacts. They identify the attack vector, the scope of the compromise, and the indicators of compromise. They work with the incident commander to determine containment actions.

The technical investigator must have access to the affected account and the tools needed for investigation (CloudTrail, GuardDuty, VPC Flow Logs, EBS snapshots). This access should be pre-provisioned through a cross-account role, not requested during the incident.

### Communications Lead

The communications lead handles all internal and external communication during the incident. They draft status updates for leadership, coordinate with legal and compliance teams, and manage customer notifications if data was exposed.

The communications lead does not make technical decisions. They translate technical findings into business language for leadership and regulatory communications.

### Forensics Analyst

The forensics analyst performs deep forensic analysis of affected systems. They analyze EBS snapshots, memory dumps, and network captures. They identify malware, persistence mechanisms, and exfiltration paths. They work closely with the technical investigator to build a complete picture of the incident.

## Incident Response Metrics

Measure your incident response capability to identify areas for improvement.

### Mean Time to Detect (MTTD)

The average time between the start of an incident and its detection. A low MTTD means you detect incidents quickly. A high MTTD means incidents persist undetected for long periods.

Calculate MTTD by subtracting the incident start time from the detection time. The incident start time is often estimated from forensic analysis (the first unauthorized API call or the first anomalous network connection). The detection time is when the alert was generated.

Target MTTD for cloud environments: under 1 hour for high-severity incidents, under 24 hours for medium-severity incidents.

### Mean Time to Respond (MTTR)

The average time between detection and containment. A low MTTR means you stop the bleeding quickly. A high MTTR means the attacker has more time to cause damage.

Calculate MTTR by subtracting the detection time from the containment time. Containment is when the attacker's access is revoked or the affected resource is isolated.

Target MTTR for cloud environments: under 30 minutes for high-severity incidents, under 4 hours for medium-severity incidents.

### Post-Incident Review Completion Rate

The percentage of incidents that have a completed post-incident review within 5 business days. Every incident should have a post-incident review. The review identifies what worked, what did not, and what needs to improve.

Target completion rate: 100 percent. No exceptions.

## IR Automation with Systems Manager

AWS Systems Manager Automations can execute multi-step remediation workflows. Unlike Lambda functions (which execute custom code), SSM Automations use predefined steps that are easier to audit and modify.

### SSM Automation for EC2 Isolation

An SSM Automation document that isolates a compromised EC2 instance:

1. Step 1: Describe the instance to get current security groups
2. Step 2: Create an isolation security group with no rules
3. Step 3: Modify the instance attribute to replace current security groups with the isolation security group
4. Step 4: Create EBS snapshots of all attached volumes
5. Step 5: Send a notification to the security team

Each step has an on-error action (continue or stop). If creating the isolation security group fails, the automation stops. If creating snapshots succeeds but notification fails, the automation continues (the notification is not critical).

### SSM Automation for Access Key Revocation

An SSM Automation document that disables a compromised IAM access key:

1. Step 1: Describe the IAM user to verify the access key exists
2. Step 2: Update the access key status to Inactive
3. Step 3: Create a new access key for the user (so the user can continue working)
4. Step 4: Send the new access key to the user via a secure channel
5. Step 5: Log the action to CloudTrail

The automation preserves the old access key (as Inactive) for forensic analysis. It creates a new key so the user is not completely locked out. The new key is sent through a secure channel, not email.

## Assessment

**Lab Task 1 (60 minutes):** Write a playbook for responding to a compromised IAM user. Include detection, containment, eradication, recovery, and post-incident steps. The playbook should specify exact AWS CLI commands for each step. Test the playbook by simulating a compromised IAM user (create a test user, generate access keys, and practice disabling the keys and reviewing CloudTrail logs).

**Lab Task 2 (60 minutes):** Create a Lambda function that automatically isolates an EC2 instance when triggered by an EventBridge rule. The Lambda should create an isolation security group, attach it to the instance, and send a notification via SNS. Test the Lambda by manually invoking it with a simulated GuardDuty finding. Verify that the instance is isolated and the notification is sent.

**Lab Task 3 (45 minutes):** Set up centralized CloudTrail logging across two AWS accounts (or simulate with a single account and multiple regions). Configure the security account to have read access to CloudTrail logs from the production account. Assume a cross-account investigation role and query CloudTrail logs from the security account. Document the role assumption and the log query process.

**Lab Task 4 (60 minutes):** Create EBS snapshots of an EC2 instance, copy them to a forensic account, and mount the snapshots on an analysis instance. Use forensic tools to examine the file system for indicators of compromise (unexpected files, modified system binaries, suspicious cron jobs). Document the forensic analysis process and findings.

**Grading Criteria:**
- Playbook quality: does the playbook cover all phases with specific commands? (25%)
- Automated response: does the Lambda correctly isolate the instance? (25%)
- Cross-account investigation: does the role assumption work correctly? (25%)
- Forensic analysis: are the snapshots correctly analyzed? (25%)

## Evidence

Save the following as evidence:
1. Playbook document with AWS CLI commands and test results (Task 1)
2. Lambda code, EventBridge rule configuration, and test results (Task 2)
3. Cross-account role configuration and log query results (Task 3)
4. Forensic analysis documentation with findings (Task 4)
