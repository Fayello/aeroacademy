# Module 4: Data Protection in the Cloud

## Why Data Protection Is Different in the Cloud

On-premises, you controlled the physical media. Hard drives stayed in your data center. When they reached end of life, you degaussed or shredded them. You controlled the network. You installed TLS certificates on your web servers and managed your own certificate authority. You generated encryption keys and stored them in hardware security modules that you physically owned.

In the cloud, you do not control the physical media. AWS manages the disks. When you delete an EBS volume, AWS handles the media. When you terminate an EC2 instance, the underlying disk is returned to the pool. You do not control the network as directly. Traffic between AWS services traverses AWS infrastructure. You do not own the HSMs. AWS KMS is a managed service running on FIPS 140-2 validated hardware that AWS operates.

Data protection in the cloud means working with these constraints. You rely on the provider for physical security of media and network security of the backbone. You are responsible for encryption decisions, key management, access controls, and data classification. This module covers the full spectrum of cloud data protection.

## Encryption at Rest

Encryption at rest protects data when it is stored on disk. If someone steals the physical disk, they cannot read the data without the encryption key. In the cloud, encryption at rest means encrypting EBS volumes, S3 objects, RDS databases, and any other persistent storage.

### S3 Server-Side Encryption Options

Amazon S3 offers four server-side encryption options. Each has different security properties and key management characteristics.

**SSE-S3 (Server-Side Encryption with Amazon S3-Managed Keys):**
SSE-S3 uses AES-256 encryption with keys managed entirely by S3. Each object is encrypted with a unique key, and each key is itself encrypted with a master key that S3 rotates regularly. You have no control over the encryption keys and cannot audit key usage.

SSE-S3 has been the default encryption for S3 since January 2023. If you upload an object without specifying encryption, S3 encrypts it with SSE-S3. You can verify this by checking the `x-amz-server-side-encryption` header on the response, which shows `AES256`.

**Limitation:** Since you do not control the keys, you cannot prove to an auditor that the data was encrypted, and you cannot control key rotation. For most compliance requirements (PCI DSS, HIPAA, SOC2), SSE-S3 is insufficient because you need to demonstrate key management.

**SSE-KMS (Server-Side Encryption with AWS KMS-Managed Keys):**
SSE-KMS uses a customer master key (CMK) stored in AWS KMS to encrypt data keys, which in turn encrypt the data. You control the CMK: you define who can use it (key policy), when it is rotated (automatic or manual), and who can administer it.

When you upload an object with SSE-KMS, S3 calls KMS to generate a data encryption key. KMS returns a plaintext copy of the data key and an encrypted copy. S3 uses the plaintext data key to encrypt the object, then stores the encrypted data key with the object. When you read the object, S3 calls KMS to decrypt the encrypted data key, then uses the plaintext data key to decrypt the object.

**Key policy for SSE-KMS:**
```json
{
  "Version": "2012-10-17",
  "Id": "key-consolepolicy-1",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow S3 to use the key",
      "Effect": "Allow",
      "Principal": {
        "Service": "s3.amazonaws.com"
      },
      "Action": [
        "kms:GenerateDataKey",
        "kms:Decrypt"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "kms:EncryptionContext:aws:s3:arn": [
            "arn:aws:s3:::my-bucket"
          ]
        }
      }
    }
  ]
}
```

This key policy allows the root user full control and allows S3 to generate data keys and decrypt them, but only when the encryption context matches a specific bucket. This is a critical security control: it prevents an S3 service from using your key to encrypt or decrypt objects in a different bucket.

**SSE-C (Server-Side Encryption with Customer-Provided Keys):**
SSE-C allows you to provide your own encryption key with each API request. S3 uses this key to encrypt and decrypt the object but does not store the key. You must provide the key with every request to read the object.

**Security implication:** You are responsible for key management, rotation, and secure transmission. The key travels over HTTPS with every request, which means it is exposed in transit. If the key is intercepted, the attacker can decrypt the object. SSE-C is rare in practice and is used only when the organization has a compelling reason to control keys outside of KMS.

**Dual-Server Side Encryption (DSSE-KMS):**
DSSE-KMS applies SSE-KMS encryption twice to an object, using two different CMKs. This provides encryption at two layers, useful for compliance requirements that mandate independent key management for different stages of the data lifecycle.

### EBS Encryption

EBS volumes can be encrypted at rest. When you create an encrypted EBS volume, AWS encrypts the data blocks, the snapshot, and any clones of the volume. Encryption is handled by the hypervisor using keys managed by KMS.

**Default EBS encryption:** AWS accounts created after January 2024 have default EBS encryption enabled. All new EBS volumes are encrypted with SSE-S3 unless you specify otherwise. Older accounts may not have this enabled; enable it by default in the account settings.

**Encryption vs performance:** Historically, EBS encryption had a performance penalty on older instance types. Modern instance types (m5, c5, r5, and later) use hardware acceleration for encryption, and the performance impact is negligible. Do not disable encryption for performance reasons on modern instance types.

### RDS Encryption

RDS encryption protects data at rest in Amazon RDS databases. When you enable encryption for an RDS instance, the underlying storage, automated backups, read replicas, and snapshots are encrypted.

**Critical constraint:** You must enable encryption when you create the RDS instance. You cannot add encryption to an existing unencrypted RDS instance. To encrypt an existing instance, you must create an encrypted snapshot, then restore the snapshot to a new encrypted instance. This is a one-way operation; you cannot unencrypt an encrypted RDS instance.

**TDE (Transparent Data Encryption):** For Oracle and SQL Server on RDS, TDE encrypts data at the database page level. For PostgreSQL and MySQL, AWS provides storage-level encryption through EBS encryption. Both approaches are transparent to the application.

## Encryption in Transit

Encryption in transit protects data as it moves between components. In the cloud, this means TLS for application traffic, IPSec for VPN connections, and encryption for service-to-service communication.

### TLS Configuration

**TLS versions:** Always use TLS 1.2 or later. TLS 1.0 and 1.1 are deprecated and should not be used. Configure your load balancers, API gateways, and application servers to accept only TLS 1.2 and TLS 1.3 connections.

**Cipher suites:** Use strong cipher suites. The recommended cipher suites for TLS 1.2 are:
- TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
- TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
- TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
- TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256

For TLS 1.3, cipher suite configuration is simpler as TLS 1.3 only supports strong cipher suites by default.

### Certificate Management

AWS Certificate Manager (ACM) provides free TLS/SSL certificates for use with AWS services. ACM handles certificate issuance, renewal, and deployment to ALBs, CloudFront distributions, and API Gateways.

**ACM best practices:**
- Use ACM for all public-facing TLS certificates
- Enable automatic renewal (ACM renews certificates 60 days before expiration)
- Use DNS validation for certificate issuance (more reliable than email validation)
- Monitor certificate expiration using CloudWatch metrics on the ACM certificate

**Private certificates:** For internal services that need TLS, use ACM Private Certificate Authority. This creates a private CA that can issue certificates for internal services. These certificates are trusted only within your organization, not by public browsers.

### Service-to-Service Encryption

Within a VPC, traffic between services should be encrypted. AWS provides several mechanisms:

- **ALB to backend:** TLS termination at the ALB, with re-encryption to the backend (HTTPS between ALB and instances)
- **Service mesh:** AWS App Mesh or Istio on EKS can encrypt all service-to-service traffic with mTLS (mutual TLS)
- **VPC endpoints:** Traffic to AWS services through VPC endpoints stays on the AWS backbone and is encrypted in transit
- **NACLs do not encrypt:** Network ACLs filter traffic but do not encrypt it. They are not a substitute for TLS.

## Key Management

Key management is the most critical and most complex aspect of data protection. If you lose control of your encryption keys, you lose control of your data. If you rotate keys properly, you limit the blast radius of a key compromise.

### Customer Master Keys (CMKs)

A CMK in AWS KMS is a logical representation of an encryption key. The CMK contains metadata (key ID, description, creation date, key policy) and the cryptographic material used to encrypt and decrypt data.

CMKs can be:
- **AWS-managed:** Created and managed by AWS on your behalf. Used for AWS service integrations (S3 default encryption, EBS encryption). You control access through the key policy but cannot export the key material.
- **Customer-managed:** Created and managed by you. You control the key policy, rotation schedule, and deletion. You can export the key material if you choose.
- **Asymmetric:** Used for public key operations (encrypt/decrypt, sign/verify). The private key never leaves KMS.

**CMK lifecycle states:**
- `Enabled`: The CMK can be used for cryptographic operations
- `Disabled`: The CMK cannot be used but can be re-enabled
- `Pending import`: The CMK exists but key material has not been imported yet
- `Pending deletion`: The CMK is scheduled for deletion (7-30 day waiting period)
- `Unavailable`: The CMK key material is not accessible (hardware failure or deletion in progress)

### Key Rotation

KMS supports automatic annual key rotation for symmetric customer-managed CMKs. When you enable automatic rotation, KMS creates new key material annually while keeping the same key ID. The old key material is retained so you can still decrypt data encrypted with previous versions.

**Manual rotation:** For asymmetric CMKs or when you need more frequent rotation, create a new CMK and update your applications to use the new key. The old CMK can be disabled but should not be deleted until all data encrypted with it has been re-encrypted or is no longer needed.

**Key rotation best practices:**
- Enable automatic rotation for all symmetric CMKs
- Do not delete CMKs until you have verified that no data depends on them
- Use CloudTrail to audit key usage and detect unusual patterns
- Implement a key rotation runbook that includes re-encrypting existing data with the new key

### Key Policies

Key policies are resource-based policies attached to CMKs. They define who can use the key and how. A key policy can grant access to IAM users, roles, other AWS accounts, and AWS services.

**Key policy structure:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Allow administration",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:role/KMSAdminRole"
      },
      "Action": [
        "kms:Create*",
        "kms:Describe*",
        "kms:Enable*",
        "kms:List*",
        "kms:Put*",
        "kms:Update*",
        "kms:Revoke*",
        "kms:Disable*",
        "kms:Get*",
        "kms:Delete*",
        "kms:TagResource",
        "kms:UntagResource",
        "kms:ScheduleKeyDeletion",
        "kms:CancelKeyDeletion"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Allow use of the key",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:role/AppRole"
      },
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey"
      ],
      "Resource": "*"
    }
  ]
}
```

This policy separates administration from usage. The KMSAdminRole can manage the key. The AppRole can use the key for encryption and decryption but cannot modify the key policy or delete the key.

### CloudHSM

For organizations that need dedicated hardware security modules, AWS CloudHSM provides single-tenant HSMs that are FIPS 140-2 Level 3 validated. CloudHSM gives you direct control of the HSM, including the ability to generate and store your own encryption keys.

**When to use CloudHSM:**
- Compliance requirements mandate dedicated HSMs (PCI DSS, certain government standards)
- You need to use specific cryptographic algorithms not supported by KMS
- You need to generate and store certificates for your own CA
- You need control over the HSM that goes beyond what KMS provides

**When to use KMS instead:**
- Most use cases: KMS is simpler, cheaper, and well-integrated with AWS services
- You do not need dedicated hardware
- You want managed key rotation and lifecycle management

## Data Classification in the Cloud

Data classification is the process of categorizing data based on sensitivity. Without classification, you cannot determine what encryption, access controls, and monitoring to apply.

### AWS Classification Framework

AWS recommends a four-tier classification:

**Public:** Data intended for public consumption. No encryption required (though encrypting public data does not hurt). Access controls are irrelevant for the data itself (though you still control who can publish it).

**Internal:** Data for internal use only. Not sensitive but should not be publicly accessible. Basic encryption (SSE-S3 for S3, default EBS encryption). Access controls restrict to authenticated employees.

**Confidential:** Sensitive business data. Customer PII, financial data, intellectual property. Strong encryption (SSE-KMS with customer-managed keys). Strict access controls with least privilege. Detailed audit logging.

**Restricted:** Highly sensitive data regulated by law or contract. Payment card data (PCI DSS), health information (HIPAA), government-classified data. Highest encryption standards (DSSE-KMS or CloudHSM). Tightest access controls. Real-time monitoring and alerting.

### Data Classification Tools

AWS does not provide a native data classification tool. Third-party tools and custom solutions are needed:

- **Amazon Macie:** Monitors S3 for sensitive data (PII, financial data) using machine learning. Macie generates findings for sensitive data discovered in S3 buckets, including the type of data, the location, and the current access permissions.
- **AWS Glue:** Can be used to scan data stores and classify data based on content patterns.
- **Custom classifiers:** Lambda functions that scan data stores and tag resources based on classification.

### Data Classification in Practice

Start with a data inventory. Identify where sensitive data lives, who has access to it, and what controls protect it. Then apply classification labels (tags on AWS resources) and enforce controls based on classification.

Example tagging strategy:
- `data-classification: public`
- `data-classification: internal`
- `data-classification: confidential`
- `data-classification: restricted`

Use SCPs or IAM policies that restrict actions based on these tags. For example, a SCP that prevents anyone from setting an S3 bucket's ACL to public-read if the bucket has the tag `data-classification: confidential`.

## Real Scenario: Encrypted Data Breach Due to Key Mismanagement

In 2021, a healthcare technology company experienced a data breach that exposed protected health information (PHI) for over 600,000 patients. The data was encrypted at rest using SSE-KMS with a customer-managed CMK. The encryption was properly configured. The breach happened because of how the keys were managed.

**What happened:**

The company stored patient records in S3 buckets encrypted with a single CMK. The key was created when the company first adopted AWS and was used for all data across all environments (development, staging, production).

The key policy granted access to the `DataEngineers` IAM group. When a data engineer left the company, their IAM user was deleted. But the IAM group still contained other members. The key was not rotated, and the key policy was not reviewed.

A former contractor had created an IAM access key for themselves while they had access. The contractor's IAM user was deleted when they left, but the access key was never deactivated because the company did not have a process for revoking access keys when employees left. The contractor used the access key to assume a role that had access to the KMS key.

The contractor used the KMS key to decrypt data from the S3 bucket. They exfiltrated patient records and attempted to sell them on a dark web marketplace.

**What failed:**

1. **Single key for all environments:** One CMK was used for development, staging, and production data. The contractor should never have had access to production data, but the same key was used everywhere.

2. **No key rotation:** The key had been created three years earlier and was never rotated. If it had been rotated when the contractor left, the old key material would have been retired.

3. **No key usage monitoring:** The company did not monitor CloudTrail logs for KMS API calls. The contractor's decrypt operations went undetected for two weeks.

4. **No access key revocation process:** When employees left, their IAM users were deleted but access keys were not always deactivated. The contractor had an active access key for six months after leaving.

5. **Overly permissive key policy:** The key policy allowed the entire `DataEngineers` group to decrypt. A more restrictive policy would have limited access to specific roles used by specific applications.

**What would have prevented it:**

- Separate CMKs for each environment (dev, staging, production)
- Automatic key rotation enabled
- Monitoring of KMS Decrypt and GenerateDataKey calls in CloudTrail
- Automated process for deactivating access keys when employees leave
- Application-specific roles instead of group-based key access
- A policy that only allowed KMS access from specific VPC endpoints


## AWS KMS Key Policies in Practice

Understanding key policies is essential for controlling who can use encryption keys. A poorly designed key policy either blocks legitimate access or grants excessive access.

### Key Policy Best Practices

**Separate administration from usage.** Create one IAM role or group for key administrators and another for key users. Administrators manage the key policy, enable and disable the key, and schedule key deletion. Users encrypt and decrypt data using the key. This separation of duties prevents a developer from accidentally deleting a production encryption key.

**Use conditions to limit key usage.** IAM conditions in key policies restrict when and how the key can be used. Common conditions include:

- aws:SourceIp: Restrict key usage to specific IP ranges (VPN endpoints, on-premises networks)
- aws:RequestedRegion: Restrict key usage to specific regions
- kms:EncryptionContext: Restrict key usage to specific encryption contexts (S3 bucket ARNs, RDS instance ARNs)
- aws:PrincipalTag: Restrict key usage based on tags on the calling principal

**Encrypt with context.** Encryption context is additional authenticated data that is included in the encryption operation. It is not encrypted but is authenticated (any change to the context causes decryption to fail). Use encryption context to bind encrypted data to a specific context. For S3, the encryption context includes the bucket ARN. For RDS, it includes the database ARN. This prevents an attacker who obtains a data key from using it to decrypt data from a different resource.

### Key Policy for Cross-Account Access

When you need to share encrypted data across AWS accounts, you must update the key policy to allow the other account to use the key. The key policy grants the other account's IAM principals permission to use the key.

**Key policy for cross-account decryption:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Allow cross-account decryption",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::partner-account-id:root"
      },
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "s3.us-east-1.amazonaws.com"
        }
      }
    }
  ]
}
```

This policy allows the partner account to decrypt data using the key, but only when the decryption is performed through S3 (not directly through the KMS API). This limits the blast radius if the partner account is compromised.

## Data Backup and Recovery

Data protection includes backup and recovery. Encrypted data is useless if you cannot restore it after a disaster.

### Backup Strategy

**3-2-1 rule:** Maintain at least three copies of your data, on at least two different media types, with at least one copy stored offsite. In AWS, this translates to: the original data in S3, a cross-region replication copy, and a backup in a separate account.

**AWS Backup:** Centralize backup management across AWS services. AWS Backup supports EBS, RDS, DynamoDB, EFS, FSx, and Storage Gateway. Define backup policies in AWS Backup and apply them to resources using tags.

**Cross-region replication:** For S3, enable cross-region replication to copy objects to a bucket in another region. This provides disaster recovery if the primary region is unavailable.

**Cross-account backup:** Copy backups to a separate AWS account. This protects against account compromise. An attacker who gains access to your primary account cannot delete backups in the separate account if the backup account has appropriate access controls.

### Restore Testing

Backups are only useful if you can restore them. Test your restore process regularly. A backup that has never been tested is not a backup; it is a hope.

Schedule quarterly restore tests. Restore a production database from backup to a test environment. Verify data integrity. Measure the time to restore. Document any issues. This process ensures that when you need to restore, you can.

## Assessment

**Lab Task 1 (45 minutes):** Configure SSE-KMS encryption for an S3 bucket. Create a customer-managed CMK with a key policy that allows a specific IAM role to decrypt and a different IAM role to administer. Upload objects with the key, verify encryption by checking the object metadata, and attempt to access the encrypted objects from a role that does not have KMS access (verify denial). Enable key rotation and verify it is enabled.

**Lab Task 2 (45 minutes):** Set up Amazon Macie on an S3 bucket. Upload sample data containing PII (names, Social Security numbers, email addresses, phone numbers). Run a Macie classification job and review the findings. For each finding, determine whether the sensitive data was intentionally public or a misconfiguration. Document the findings and your assessment.

**Lab Task 3 (60 minutes):** Create a data classification scheme for a hypothetical healthcare application. Document four data classification tiers (public, internal, confidential, restricted), the encryption requirements for each tier, the access control requirements, the logging requirements, and the retention requirements. Then implement the scheme for the "restricted" tier: create a KMS key with a restrictive key policy, encrypt an S3 bucket with it, configure bucket access to allow only a specific role, and set up CloudWatch alarms for KMS key usage.

**Grading Criteria:**
- KMS configuration: is the key policy correct and the encryption working? (30%)
- Macie analysis: are findings correctly identified and assessed? (25%)
- Classification scheme: is it realistic and does it cover all four tiers? (25%)
- Practical implementation: does the restricted tier implementation enforce all requirements? (20%)

## Evidence

Save the following as evidence:
1. KMS key policy, S3 bucket encryption configuration, and test results (Task 1)
2. Macie findings report and your assessment document (Task 2)
3. Data classification scheme document and restricted tier implementation screenshots (Task 3)
