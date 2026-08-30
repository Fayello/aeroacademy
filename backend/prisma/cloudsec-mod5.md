# Module 5 — Logging and Monitoring: CloudTrail, GuardDuty, Config

## What You'll Actually Do

You'll set up CloudTrail across multiple regions, configure GuardDuty to detect real threats, and use AWS Config to track resource compliance. You'll also build a simple detection rule and watch it fire. The goal is visibility — you can't protect what you can't see.

## CloudTrail — Your Audit Trail

CloudTrail records every API call in your AWS account. If it's not turned on, you're flying blind.

```bash
# Create a trail for all regions
aws cloudtrail create-trail \
  --name security-audit-trail \
  --s3-bucket-name my-cloudtrail-logs-123456789012 \
  --is-multi-region-trail \
  --enable-log-file-validation

# Start logging
aws cloudtrail start-logging --name security-audit-trail

# Verify it's active
aws cloudtrail get-trail-status --name security-audit-trail
```

### What to log

By default, CloudTrail logs management events. You also need:
- **Data events** for S3 (who accessed what objects)
- **Lambda data events** (who invoked what function)
- **CloudTrail Insights** to detect unusual API activity

```bash
# Add S3 data event logging
aws cloudtrail put-event-selectors \
  --trail-name security-audit-trail \
  --event-selectors '[
    {
      "ReadWriteType": "All",
      "IncludeManagementEvents": true,
      "DataResources": [
        {
          "Type": "AWS::S3::Object",
          "Values": ["arn:aws:s3:::my-sensitive-bucket/"]
        }
      ]
    }
  ]'
```

## GuardDuty — Threat Detection

GuardDuty analyzes CloudTrail, VPC Flow Logs, and DNS logs to find anomalies. It catches things like:
- API calls from unusual IP addresses
- Instances communicating with known malicious IPs
- Root account usage
- Unauthorized attempts to disable logging

```bash
# Enable GuardDuty
aws guardduty create-detector \
  --enable \
  --finding-publishing-frequency FIFTEEN_MINUTES

# Get the detector ID
aws guardduty list-detectors

# Create a threat intel set (optional - upload your own IOCs)
aws guardduty create-threat-intel-set \
  --detector-id 12345678-1234-1234-1234-123456789012 \
  --format TXT \
  --activate \
  --location s3://my-threat-intel/bad-ips.txt \
  --name known-bad-ips
```

### Generating a Finding (for lab practice)

```bash
# Simulate reconnaissance by querying many APIs
for i in $(seq 1 100); do
  aws iam list-users > /dev/null 2>&1
done

# Wait 5-10 minutes, then check GuardDuty findings
aws guardduty list-findings \
  --detector-id 12345678-1234-1234-1234-123456789012
```

## AWS Config — Compliance Tracking

Config records the state of your resources over time. It answers "when did this change?" and "is this compliant?"

```bash
# Enable Config
aws configservice put-configuration-recorder \
  --configuration-recorder name=default,roleARN=arn:aws:iam::123456789012:role/config-role

# Create an S3 bucket for Config delivery
aws configservice put-delivery-channel \
  --delivery-channel name=default,s3BucketName=my-config-logs-123456789012

# Start recording
aws configservice start-configuration-recorder --configuration-recorder-name default

# Add a managed rule - check if EBS volumes are encrypted
aws configservice put-config-rule \
  --config-rule '{
    "ConfigRuleName": "encrypted-volumes",
    "Source": {
      "Owner": "AWS",
      "SourceIdentifier": "ENCRYPTED_VOLUMES"
    }
  }'

# Check compliance
aws configservice get-compliance-details-by-config-rule \
  --config-rule-name encrypted-volumes
```

## Lab Task — Detection Pipeline

1. **CloudTrail** — Enable a multi-region trail with log file validation. Verify logs are landing in S3. Check one log entry and identify: who made the call, what API was called, from what IP, and when.

2. **GuardDuty** — Enable GuardDuty. Generate at least 3 different findings by:
   - Making many API calls rapidly (reconnaissance)
   - Running an EC2 instance from a Tor exit node (if possible with the lab environment)
   - Accessing S3 from an unusual location

3. **Config** — Enable Config with 3 rules:
   - `encrypted-volumes` — Are all EBS volumes encrypted?
   - `s3-bucket-public-read-prohibited` — Are any S3 buckets public?
   - `root-access-key-check` — Does the root account have access keys?

4. **Correlate** — Write a 1-page summary connecting findings across all three services. What story do the logs tell?

**Time:** 55 minutes

**Grading (10 points):**
- 2 points: CloudTrail configured correctly with data events
- 3 points: GuardDuty enabled and at least 3 findings generated
- 2 points: Config rules active and compliance status documented
- 3 points: Correlation summary that makes sense

**Evidence:** Upload CloudTrail log samples, GuardDuty finding screenshots, Config compliance reports, and the correlation summary.
