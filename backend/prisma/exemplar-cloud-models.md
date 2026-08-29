# Cloud Service Models & Shared Responsibility

## Learning Objectives

> By the end of this lesson, you will be able to:
> 1. **Distinguish** the security ownership boundaries for IaaS, PaaS, and SaaS across AWS, Azure, and GCP with service-level precision
> 2. **Diagnose** the leading cloud misconfigurations using CSPM tooling
> 3. **Design** network and IAM controls that enforce least privilege
> 4. **Evaluate** organizational posture against NIST SP 800-210 and CSA CCM v4

## Prerequisites

> Completion of Cloud Fundamentals and Networking & Security. Familiarity with virtualization, TCP/IP, and IAM.

---

## 1. Theoretical Foundations

Cloud computing redefines security ownership. NIST SP 800-210 defines cloud essentials. The shared responsibility model partitions controls: provider secures *of* the cloud, customer secures *in* the cloud.

| Dimension | On-Premises | IaaS (EC2/GCE/VM) | PaaS (RDS/Cloud SQL) | SaaS (S3 Managed) |
|-----------|-------------|-------------------|----------------------|-------------------|
| Physical | Customer | Provider | Provider | Provider |
| Host | Customer | Provider | Provider | Provider |
| Guest OS | Customer | Customer | Provider | Provider |
| Data/IAM | Customer | Customer | Customer | Customer |

Provider secures physical/host/network; customer secures data, IAM, app, OS, network config.

Authorization chain: Authentication (MFA, SAML) → Authorization (Explicit Deny → Allow → Implicit Deny) → Condition (aws:SecureTransport, RequestedRegion) → Audit (CloudTrail, GuardDuty).

## 2. Deep Technical Analysis

Overly permissive: Action s3:* Resource * . Hardened: Action GetObject/PutObject Resource arn:aws:s3:::corp-data-lake-prod/* Condition Bool SecureTransport true and StringEquals RequestedRegion eu-west-1.

Validate via aws iam simulate-principal-policy.

Network: SG stateful allowlist vs NACL stateless order. Flow Logs to S3 + Athena for forensics. WAF rate limit 1000/5m + Shield Advanced.

Logging: CloudTrail all regions with validation, GuardDuty ML, Config rules.

## 3. Real-World Case Studies

**Capital One 2019:** SSRF via WAF to 169.254.169.254 metadata, IAM * on s3*, 100M records, $80M fine. Fix: IMDSv2, least privilege, SCP, CSPM.

**Code Spaces 2014:** Single account deletion, no backup account. Fix: isolated backup with MFA delete, transit gateway.

**Uber 2016:** GitHub key hardcoded, 57M. Fix: KMS, Secrets Manager, git-secrets.

## 4. Hands-On Laboratory

1. Create permissive policy, simulate, observe allow
2. Harden, resimulate, curl http (403) vs https (200)
3. Run ScoutSuite and Prowler, expect 0 critical after hardening
4. Verify SG/NACL and flow logs

Success: 0 critical, simulate allowed only for scoped resource over TLS.

## 5. Common Misconceptions

1. Provider encrypts by default — False, enable bucket encryption.
2. SG 0.0.0.0/0 on 443 safe if NACL denies 22 — Misunderstood, need both.
3. MFA for console only — Must gate IAM/KMS via BoolIfExists.
4. Flow logs expensive — $0.50/TB vs $4.45M breach cost.

## 6. Assessment Preparation

Maps to quiz on who patches guest OS in PaaS, leading cause of breaches (misconfig), CSPM, SaaS responsibility. Interview: walk through Capital One chain.

## Further Reading

- NIST SP 800-210
- CSA CCM v4
- AWS Well-Architected Security Pillar
- CISA AA19-264A

*Harvard-level rigor: primary sources, quantitative benchmarks, live hardening to 0 critical.*
