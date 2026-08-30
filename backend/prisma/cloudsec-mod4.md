# Module 4 — Data Protection: Encryption at Rest and in Transit

## What You'll Actually Do

You'll configure encryption for S3 buckets, EBS volumes, and RDS databases. You'll set up TLS for services in transit. You'll audit existing resources to find unencrypted data and figure out what to do about it. The point is making sure your data is encrypted when it should be and that you control the keys.

## Encryption at Rest

### S3 Bucket Encryption

```bash
# Enable default encryption on an existing bucket
aws s3api put-bucket-encryption \
  --bucket my-secure-bucket \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "aws:kms",
          "KMSMasterKeyID": "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012"
        },
        "BucketKeyEnabled": true
      }
    ]
  }'

# Block unencrypted uploads with a bucket policy
aws s3api put-bucket-policy \
  --bucket my-secure-bucket \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "DenyUnencryptedObjectUploads",
        "Effect": "Deny",
        "Principal": "*",
        "Action": "s3:PutObject",
        "Resource": "arn:aws:s3:::my-secure-bucket/*",
        "Condition": {
          "StringNotEquals": {
            "s3:x-amz-server-side-encryption": "aws:kms"
          }
        }
      }
    ]
  }'
```

### EBS Volume Encryption

```bash
# Enable default EBS encryption for the account
aws ec2 enable-ebs-encryption-by-default

# Verify it's on
aws ec2 get-ebs-encryption-by-default

# Create an encrypted volume
aws ec2 create-volume \
  --availability-zone us-east-1a \
  --encrypted \
  --kms-key-id alias/secure-ebs-key \
  --size 100 \
  --volume-type gp3
```

### RDS Encryption

Encryption for RDS is set at creation time. You can't enable it on an existing unencrypted instance — you have to snapshot, copy with encryption, and restore.

```bash
# Create encrypted RDS instance
aws rds create-db-instance \
  --db-instance-identifier secure-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password 'UseSomethingStrong123!' \
  --storage-encrypted \
  --kms-key-id alias/rds-key
```

## Encryption in Transit

TLS everywhere. No exceptions.

```bash
# Enforce S3 to only accept HTTPS
aws s3api put-bucket-policy \
  --bucket my-secure-bucket \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "DenyNonHTTPS",
        "Effect": "Deny",
        "Principal": "*",
        "Action": "s3:*",
        "Resource": [
          "arn:aws:s3:::my-secure-bucket",
          "arn:aws:s3:::my-secure-bucket/*"
        ],
        "Condition": {
          "Bool": {
            "aws:SecureTransport": "false"
          }
        }
      }
    ]
  }'

# Force RDS to require TLS
aws rds modify-db-instance \
  --db-instance-identifier secure-db \
  --ca-certificate-identifier rds-ca-rsa2048-g1 \
  --apply-immediately
```

## KMS Key Management

You control the keys, you control the data. Lose the keys, lose the data.

```bash
# Create a customer-managed KMS key
aws kms create-key \
  --description "S3 bucket encryption key" \
  --tags TagKey=Purpose,TagValue=S3Encryption

# Create an alias for easier reference
aws kms create-alias \
  --alias-name alias/s3-encryption \
  --target-key-id 12345678-1234-1234-1234-123456789012

# Enable key rotation
aws kms enable-key-rotation \
  --key-id 12345678-1234-1234-1234-123456789012
```

## Lab Task — Encryption Audit and Remediation

1. **Audit** — You'll receive access to an AWS account with:
   - 3 S3 buckets (some encrypted, some not)
   - 5 EBS volumes (mixed encryption status)
   - 2 RDS instances (one encrypted, one not)

   For each resource, document: current encryption status, encryption algorithm, key type (AWS-managed vs. customer-managed)

2. **Remediate** — For each unencrypted resource:
   - Enable encryption where possible
   - For RDS: document why you can't enable it on an existing instance and plan the migration
   - Write bucket policies to deny unencrypted uploads

3. **Validate** — Run `aws s3api get-bucket-encryption` and `aws ec2 describe-volumes` to confirm your changes

**Time:** 50 minutes

**Grading (10 points):**
- 3 points: Correct audit of all resources
- 3 points: Proper remediation steps taken
- 2 points: Bucket policies and KMS configuration
- 2 points: Clear documentation of RDS encryption limitation and migration plan

**Evidence:** Upload audit spreadsheet, policy files, CLI output screenshots, and a short remediation report.
