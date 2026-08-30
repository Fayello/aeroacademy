# Module 1 — Who Secures What? The Cloud Responsibility Model

## What You'll Actually Do

You're going to map out exactly who is responsible for what in AWS, Azure, and GCP. No fluff — just figuring out where your job starts and stops when you're building or migrating workloads. You'll audit a real AWS environment and identify every gap where nobody owns the security.

## The Reality of Shared Responsibility

Cloud providers sell you "security of the cloud." You buy "security in the cloud." That split sounds clean in a slide deck, but in practice it's messy. Here's how it actually breaks down:

**Provider owns:**
- Physical datacenter security
- Hypervisor and host OS patches
- Network infrastructure between AZs
- Hardware lifecycle

**You own:**
- Operating system patches on your instances
- Firewall rules on your instances
- IAM policies and access controls
- Data classification and encryption
- Application-level security
- Logging and monitoring

The dangerous zone is the gray area — things like container runtime security, managed database configuration, and serverless function permissions. Providers give you tools, but if you misconfigure them, it's your problem.

## Mapping Responsibility by Service Type

```
IaaS (EC2, Azure VMs)    → You patch OS, configure firewalls, manage IAM
PaaS (RDS, Azure SQL)    → Provider patches engine, you manage data and access
SaaS (S3, DynamoDB)      → Provider manages almost everything, you control who gets in
Serverless (Lambda)       → Provider manages runtime, you manage function code and permissions
```

## Lab Task — AWS Responsibility Audit

You'll be given a running AWS environment with 5 EC2 instances, 2 RDS databases, an S3 bucket, and a Lambda function. Your job:

1. **Classify each resource** — Who patches it? Who configures its access? Who manages its network?
2. **Find the gaps** — List every resource where security responsibility is unclear or nobody is doing it
3. **Document the gaps** in a spreadsheet with columns: Resource, What Provider Handles, What You Handle, Current Gap, Risk Level

**Time:** 45 minutes

**Grading (10 points):**
- 4 points: Correct responsibility classification for all resources
- 3 points: Gap identification (at least 3 real gaps, not made-up ones)
- 2 points: Risk ratings that make sense
- 1 point: Clean, professional output

**Evidence:** Export your spreadsheet as CSV. Screenshot the AWS console showing the resources. Upload both to the course submission portal.
