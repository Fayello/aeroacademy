# Module 9 — Incident Response in the Cloud

## What You'll Actually Do

You'll build a runbook for cloud incidents, practice isolating a compromised EC2 instance, preserve evidence forensically, and coordinate a response using CloudTrail and GuardDuty findings. When something goes wrong in the cloud, you need to move fast and not destroy evidence.

## Cloud Incident Response Framework

The same incident response phases apply in the cloud, but the tools and techniques change:

1. **Preparation** — Have the tools, access, and runbooks ready before something happens
2. **Identification** — Use CloudTrail, GuardDuty, and VPC Flow Logs to detect and scope the incident
3. **Containment** — Isolate compromised resources without destroying evidence
4. **Eradication** — Remove the attacker's access and persistence mechanisms
5. **Recovery** — Restore clean resources and verify integrity
6. **Lessons Learned** — Document what happened and improve detection

## Preparation — Before Things Go Wrong

### Create an Incident Response Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:StopInstances",
        "ec2:StartInstances",
        "ec2:CreateSnapshot",
        "ec2:CreateImage",
        "ec2:ModifyInstanceAttribute",
        "ec2:CreateNetworkAclEntry",
        "ec2:ReplaceNetworkAclAssociation",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:PutRolePolicy",
        "sts:AssumeRole",
        "cloudtrail:StopLogging",
        "guardduty:ListFindings",
        "guardduty:GetFindings",
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "*"
    }
  ]
}
```

### Incident Response S3 Bucket

```bash
# Create an evidence bucket with object lock
aws s3api create-bucket \
  --bucket incident-evidence-$(date +%s) \
  --region us-east-1

aws s3api put-object-lock-configuration \
  --bucket incident-evidence-123456789012 \
  --object-lock-configuration '{
    "ObjectLockEnabled": "Enabled",
    "Rule": {
      "DefaultRetention": {
        "Mode": "COMPLIANCE",
        "Days": 365
      }
    }
  }'
```

## Containment — Isolating a Compromised Instance

When you find a compromised EC2 instance, don't terminate it. Isolate it for forensics.

```bash
# Step 1: Snapshot the instance volumes (preserve evidence)
INSTANCE_ID="i-0123456789abcdef0"

# Get volume IDs
VOLUMES=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query "Reservations[].Instances[].BlockDeviceMappings[].Ebs.VolumeId" \
  --output text)

# Create snapshots
for vol in $VOLUMES; do
  aws ec2 create-snapshot \
    --volume-id $vol \
    --description "Incident $(date +%Y%m%d) - $INSTANCE_ID" \
    --tag-specifications "ResourceType=snapshot,Tags=[{Key=Purpose,Value=Forensics},{Key=IncidentDate,Value=$(date +%Y-%m-%d)}]"
done

# Step 2: Isolate the instance (change security group)
aws ec2 modify-instance-attribute \
  --instance-id $INSTANCE_ID \
  --groups sg-isolated-forensics

# Step 3: Disconnect from network (alternative to security group change)
# Create a NACL that blocks all traffic
aws ec2 create-network-acl-entry \
  --network-acl-id acl-0123456789abcdef0 \
  --rule-number 100 \
  --protocol -1 \
  --rule-action deny \
  --cidr-block 0.0.0.0/0

# Step 4: Tag everything for evidence tracking
aws ec2 create-tags \
  --resources $INSTANCE_ID \
  --tags \
    Key=Incident,Value=INC-2024-001 \
    Key=IsolatedBy,Value=security-team \
    Key=IsolatedDate,Value=$(date +%Y-%m-%dT%H:%M:%S)
```

## Forensics — Collecting Evidence

### Memory Dump (if possible)

```bash
# Use SSM to run commands without SSH
aws ssm send-command \
  --instance-ids $INSTANCE_ID \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["sudo dd if=/dev/mem of=/tmp/memdump bs=1M count=512", "aws s3 cp /tmp/memdump s3://incident-evidence-bucket/INC-2024-001/memdump-$(date +%s).raw"]'
```

### Disk Forensics

```bash
# Mount the snapshot as a volume in your forensics account
aws ec2 create-volume \
  --snapshot-id snap-0123456789abcdef0 \
  --availability-zone us-east-1a \
  --volume-type gp3

# Attach to your forensics instance
aws ec2 attach-volume \
  --volume-id vol-forensics \
  --instance-id i-forensics-workstation \
  --device /dev/sdf

# On the forensics instance - mount and analyze
sudo mkdir /mnt/evidence
sudo mount /dev/xvdf1 /mnt/evidence
sudo find /mnt/evidence -name "*.log" -exec grep -l "suspicious_pattern" {} \;
```

## Eradication — Removing Attacker Access

```bash
# Find all access keys created by the attacker
aws iam list-access-keys --user-name compromised-user

# Delete unauthorized access keys
aws iam delete-access-key \
  --user-name compromised-user \
  --access-key-id AKIAIOSFODNN7EXAMPLE

# Check for unauthorized IAM users
aws iam list-users --query "Users[?CreateDate>='2024-01-15']"

# Remove unauthorized users
aws iam delete-user --user-name backdoor-user

# Check for unauthorized Lambda functions (persistence)
aws lambda list-functions \
  --query "Functions[?LastModified>='2024-01-15']"

# Delete unauthorized functions
aws lambda delete-function --function-name suspicious-function
```

## Lab Task — Incident Response Exercise

1. **Scenario** — A GuardDuty finding indicates an EC2 instance is communicating with a known command-and-control server. The instance ID is provided.

2. **Investigate** — Using CloudTrail and VPC Flow Logs:
   - Find when the suspicious activity started
   - Identify the source IP and destination IP
   - Check what API calls were made from the instance's IAM role
   - Determine the blast radius (what else could the attacker access?)

3. **Contain** — Isolate the instance:
   - Snapshot all volumes
   - Change the security group to isolate it
   - Tag everything for evidence

4. **Eradicate** — Check for and remove:
   - Backdoor IAM users or roles
   - Unauthorized Lambda functions
   - Modified security groups
   - Suspicious S3 bucket policies

5. **Document** — Write an incident report with:
   - Timeline of events
   - Evidence collected
   - Actions taken
   - Lessons learned

**Time:** 60 minutes

**Grading (10 points):**
- 2 points: Correct investigation using CloudTrail and VPC Flow Logs
- 2 points: Proper containment without destroying evidence
- 3 points: Thorough eradication of persistence mechanisms
- 3 points: Complete incident report with timeline

**Evidence:** CloudTrail query results, VPC Flow Log analysis, evidence snapshots, eradication commands run, and the incident report.
