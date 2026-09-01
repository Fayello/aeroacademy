# Module 2 — IAM and Least Privilege

## The Security Layer That Controls Everything Else

Identity and Access Management is the single most critical security control in any cloud environment. Every resource, every API call, every data access flows through IAM. A misconfigured S3 bucket gets attention in the news, but the misconfigured IAM policy that allowed the attacker to reach that bucket? That is where the real failure happened.

IAM is not a set-and-forget service. It is a living system that requires constant attention. Policies evolve as applications change. Roles get created and forgotten. Users accumulate permissions they no longer need. The difference between a secure cloud environment and a compromised one is almost always IAM configuration.

This module covers IAM policies in depth: how they are written, how they are evaluated, how to design them for least privilege, and how real attackers exploit IAM weaknesses.

## IAM Policy Fundamentals

Every AWS IAM policy is a JSON document. The document has two required elements: a version identifier and a list of statements. Each statement has an effect (Allow or Deny), a set of actions (what the statement applies to), a set of resources (what the actions apply to), and optionally a set of conditions (when the statement applies).

A minimal IAM policy looks like this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
```

This policy allows the GetObject action on all objects in a specific S3 bucket. Nothing else. This is what least privilege looks like in practice: the minimum permissions needed for a specific task.

The version field is always `2012-10-17`. This is not a version of the policy content; it is the version of the IAM policy language syntax. Do not change it.

### Policy Size Limits

IAM policies have a size limit of 6,144 characters for inline policies. Managed policies (standalone policy objects that can be attached to multiple entities) have a limit of 6,144 characters as well. If you need to express more permissions than fit in a single policy, you split them across multiple policies. Multiple policies attached to the same entity are evaluated together and their effects are merged.

## Policy Evaluation Logic

Understanding how AWS evaluates IAM policies is critical for writing effective policies. The evaluation process follows a specific order:

**Step 1: Deny by default.** If no policy explicitly allows an action, the action is denied. This is the foundation of least privilege.

**Step 2: Check all applicable policies.** AWS evaluates every policy that applies to the entity making the request. This includes identity-based policies (attached to the user or role), resource-based policies (attached to the resource being accessed), permission boundaries (which limit the maximum permissions), session policies (which further restrict what a role session can do), and SCPs (which limit what an entire AWS account can do).

**Step 3: Explicit Deny always wins.** If any applicable policy contains an explicit Deny statement for the requested action, the request is denied regardless of any Allow statements in other policies.

**Step 4: Explicit Allow required.** If no policy contains an explicit Allow statement for the requested action, the request is denied. An implicit deny (absence of an Allow) is the same as an explicit Deny.

**Step 5: Permission boundary check.** If a permission boundary is set, the effective permissions are the intersection of the identity-based policies and the permission boundary. The entity cannot exceed the permissions defined in the boundary, even if the identity-based policies grant broader access.

**Step 6: SCP check.** For an IAM principal in an account that belongs to an AWS Organization with SCPs, the effective permissions are further restricted by the SCPs. An SCP can only deny permissions; it cannot grant permissions that the identity-based policies have not already granted.

This evaluation order has practical implications. For example, if you have an SCP that denies all access to the us-east-1 region, no user or role in that account can access us-east-1, regardless of what their individual IAM policies say. If you have a permission boundary that limits access to read-only operations, a user with an IAM policy granting full administrator access is still limited to read-only.

### The Implicit Deny Trap

The implicit deny is the most misunderstood concept in IAM. Many engineers write policies that explicitly allow broad access because they think they need to. They do not. If a user has no policy attached that mentions S3, they cannot access S3. Period. The implicit deny handles this automatically.

The mistake is attaching policies like `AdministratorAccess` or `PowerUserAccess` to users who need limited access. These policies grant almost everything. The user does not need almost everything. They need specific things. Write policies that grant those specific things and nothing more.

## IAM Users, Groups, and Roles

AWS provides three mechanisms for managing IAM identities: users, groups, and roles. Understanding when to use each is fundamental to IAM design.

### IAM Users

IAM users represent individual people or service accounts. Each user has a unique name and can have a password for console access and access keys for programmatic access.

Users should be used sparingly. AWS recommends creating IAM users only when you need to maintain a long-term credential for a specific individual. For most workloads, roles are preferred because roles provide temporary credentials that expire automatically.

**Best practice for users:**
- Enable MFA for all users, especially console access
- Rotate access keys every 90 days
- Use access key best practices: one key at a time, deactivate rather than delete
- Set a password policy: minimum 14 characters, require uppercase, lowercase, numbers, and symbols
- Attach policies directly to users rather than using groups when possible, for clarity

### IAM Groups

IAM groups are collections of users. Policies attached to a group apply to all users in that group. Groups cannot be nested (a group cannot contain another group).

Groups are useful for role-based access: all developers get one set of permissions, all operations staff get another, all finance staff get read-only access to billing. But groups become unwieldy when users need a unique combination of permissions. A developer who also needs access to a specific billing report needs permissions from the developer group plus additional permissions from a custom policy. This leads to policy sprawl.

**The modern approach:** Use IAM roles and attribute-based access control (ABAC) instead of groups where possible. Tags on IAM principals can drive policy decisions, reducing the number of policies you need to manage.

### IAM Roles

IAM roles are the most important IAM construct. A role is not a user and not a group. It is a set of permissions that can be assumed by a trusted entity. When assumed, the role provides temporary security credentials that are valid for a limited time (default one hour, configurable up to 12 hours).

Roles are used for:
- **EC2 instances:** An EC2 instance assumes a role to access other AWS services. No access keys needed on the instance.
- **Lambda functions:** A Lambda function assumes a role to access DynamoDB, S3, or other services.
- **Cross-account access:** An IAM role in Account A can be assumed by a principal in Account B.
- **Federated identities:** Users authenticated by an external identity provider can assume a role to get temporary AWS credentials.
- **AWS services:** Services like CloudFormation, CodeDeploy, and Elastic Beanstalk assume roles to perform their tasks on your behalf.

Roles are superior to users for almost every use case. The temporary credentials reduce the blast radius of a credential leak. The trust relationship defines exactly who can assume the role. The session duration limits how long the credentials are valid.

**Role trust policy example:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

This trust policy allows the EC2 service to assume the role. Only EC2 instances with this role attached can use it. An IAM user cannot assume this role directly (unless the trust policy also allows it).

## Service Control Policies (SCPs)

SCPs are organization-level policies that limit what IAM users and roles can do in member accounts of an AWS Organization. SCPs do not grant permissions; they restrict permissions. An SCP can deny actions but cannot grant them.

If an SCP denies an action, no user or role in the affected account can perform that action, regardless of their IAM policies. If no SCP applies to an account (or if the OU has the default `FullAWSAccess` SCP), the account's IAM policies operate normally.

SCPs are powerful for enforcing organization-wide security guardrails:

**Deny access to specific regions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyNonApprovedRegions",
      "Effect": "Deny",
      "NotAction": [
        "iam:*",
        "sts:*",
        "cloudfront:*",
        "organizations:*",
        "route53:*",
        "route53domains:*",
        "route53-recovery-cluster:*",
        "route53-recovery-control-config:*",
        "route53-recovery-readiness:*",
        "s3:*",
        "budgets:*",
        "aws-marketplace:*",
        "aws-marketplace-management:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": [
            "us-east-1",
            "us-east-2",
            "us-west-2"
          ]
        }
      }
    }
  ]
}
```

This SCP denies all actions except IAM, STS, and a few other global services in regions outside us-east-1, us-east-2, and us-west-2. Users in the affected accounts cannot create resources in eu-west-1 or ap-southeast-1, even if their IAM policies allow it.

**Deny leaving the organization:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyLeaveOrganization",
      "Effect": "Deny",
      "Action": [
        "organizations:LeaveOrganization"
      ],
      "Resource": "*"
    }
  ]
}
```

This prevents any user or role in a member account from leaving the organization. Without this SCP, a compromised account could leave the organization and escape all organizational guardrails.

**SCP evaluation follows the same logic as IAM policies:** explicit Deny wins. If an SCP denies an action and an IAM policy allows it, the action is denied. If no SCP mentions the action, the IAM policy decides.

## Identity Federation

Identity federation allows users authenticated by an external identity provider (IdP) to access AWS resources. Instead of creating IAM users for every person in your organization, you configure federation with your existing identity system and use IAM roles to grant access.

### SAML 2.0 Federation

SAML (Security Assertion Markup Language) 2.0 is the standard protocol for exchanging authentication and authorization data between an IdP and a service provider (AWS in this case).

The flow:
1. User attempts to access AWS Management Console
2. AWS redirects the user to the configured IdP
3. User authenticates with the IdP
4. IdP sends a SAML assertion to AWS
5. AWS validates the assertion and creates temporary credentials
6. User is logged into the AWS Console with the permissions defined by the IAM role specified in the SAML assertion

**Benefits:**
- Centralized identity management through your existing IdP
- No IAM users to manage for human access
- MFA enforced by the IdP
- Automatic credential rotation (temporary credentials)
- Single sign-on across multiple AWS accounts

### Web Identity Federation (OIDC)

For web and mobile applications, OpenID Connect (OIDC) provides a similar federation mechanism. Providers like Google, Facebook, and Apple support OIDC. AWS Cognito acts as an OIDC provider for your own applications.

The flow for OIDC federation:
1. Application redirects user to the IdP
2. User authenticates and receives an OIDC token
3. Application requests temporary AWS credentials from AWS STS using the OIDC token
4. AWS STS validates the token and returns temporary credentials
5. Application uses temporary credentials to access AWS resources

**Common use case:** A mobile application that needs to upload photos to S3. The user authenticates with Google, the application gets temporary S3 credentials, and the upload proceeds with no IAM user or access keys involved.

### AWS IAM Identity Center (SSO)

AWS IAM Identity Center (formerly AWS SSO) is the recommended way to manage federation for AWS Organizations. It integrates with common IdPs (Azure AD, Okta, Google Workspace) and provides single sign-on to multiple AWS accounts and applications.

IAM Identity Center manages permission sets that define what users can do in each account. When a user authenticates, Identity Center assumes a role in the target account with the permissions defined by the permission set.

**Best practice:** Use IAM Identity Center for all human access to AWS. Create IAM users only for service accounts that cannot use roles.

## The 2023 Uber IAM Breach

In September 2023, an attacker compromised an Uber employee's account through a social engineering attack. The attacker purchased the employee's credentials on the dark web (obtained through a previous malware infection) and then repeatedly sent push notifications to the employee's MFA device until the employee approved one.

The attacker gained access to Uber's internal network and then discovered an PowerShell script on a network share that contained hardcoded admin credentials for Uber's Thycotic access management system. Thycotic provided access to Uber's AWS infrastructure, including the AWS console for multiple accounts.

The attacker accessed S3 buckets containing financial data, data from Uber's vulnerability reporting system, and Slack messages from the engineering team.

**IAM failures in this incident:**
- The compromised employee had access to internal network shares containing hardcoded credentials. Least privilege was not enforced on what employees could access.
- MFA was in place but could be bypassed through fatigue attacks (repeated push notifications). Uber did not have number matching or other advanced MFA controls.
- The Thycotic system had admin-level access to AWS infrastructure. No permission boundaries limited what the Thycotic role could do.
- No monitoring detected the unusual access pattern: a single user account accessing credentials, then Thycotic, then AWS console access from an unfamiliar location, all within minutes.

**What would have helped:**
- Permission boundaries on all roles, limiting the blast radius of any compromised credential
- Conditional access policies that required device-based verification, not just push approval
- Network segmentation that prevented lateral movement from a single compromised account
- Anomalous access detection that flagged the unusual combination of activities

## Designing for Least Privilege

Least privilege means granting the minimum permissions needed for a specific task. In practice, this means writing IAM policies that are narrow, specific, and reviewable.

### Step 1: Determine What the Principal Needs to Do

Start with the task. What API calls does the principal need to make? For a Lambda function that reads from an S3 bucket and writes to a DynamoDB table, the permissions needed are:

- `s3:GetObject` on the specific bucket and prefix
- `dynamodb:PutItem` on the specific table

That is it. No `s3:*`, no `dynamodb:*`, no `iam:*`. Just those two actions on those two resources.

### Step 2: Write the Policy with Resource ARNs

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowReadFromSpecificBucket",
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-app-data/uploads/*"
    },
    {
      "Sid": "AllowWriteToSpecificTable",
      "Effect": "Allow",
      "Action": "dynamodb:PutItem",
      "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/UploadMetadata"
    }
  ]
}
```

### Step 3: Use Conditions to Add Constraints

IAM condition keys allow you to add constraints beyond just action and resource. Common useful conditions:

- `aws:SourceIp`: Restrict access to specific IP addresses or ranges
- `aws:RequestedRegion`: Restrict actions to specific AWS regions
- `aws:PrincipalTag`: Use tags on the calling principal for ABAC
- `s3:prefix`: For S3 ListBucket, restrict which prefixes can be listed
- `dynamodb:LeadingKeys`: For DynamoDB, restrict access to specific partition keys

### Step 4: Use Permission Boundaries for Delegated Administration

When you allow a developer to create IAM roles for Lambda functions, you need a permission boundary. Without it, the developer can create a Lambda role with `AdministratorAccess`, and the Lambda function has full access to the account.

Permission boundaries define the maximum permissions a role can have. If the boundary allows only S3 and DynamoDB actions, the role's actual permissions are limited to S3 and DynamoDB, regardless of what policies are attached to the role.

### Step 5: Monitor and Iterate

IAM Access Analyzer generates findings for resources that are accessible from outside your AWS account. IAM Credential Reports show unused credentials. CloudTrail logs show what actions each principal is taking. Use these tools to identify over-permissioned policies and tighten them.


## IAM Access Analyzer

IAM Access Analyzer is a tool that helps you identify resources in your IAM policies that are accessible from outside your AWS account. It analyzes resource-based policies (S3 bucket policies, IAM role trust policies, KMS key policies, Lambda resource policies, SQS queue policies, and VPC endpoint policies) to find unintended external access.

### How Access Analyzer Works

Access Analyzer examines resource-based policies and uses automated reasoning to determine whether they grant cross-account access. It identifies the external principals that can access each resource and generates findings for each one.

The analysis is not a simple string match. Access Analyzer understands the full IAM policy language including condition keys, resource ARNs, and principal specifications. It can determine that a policy granting access to Principal "*" with a Condition limiting access to a specific AWS account is not truly public, even though the principal is a wildcard.

### Access Analyzer Findings

Each finding identifies a resource that is accessible from outside your account. The finding includes the resource ARN, the type of access granted, and the external principals that can access it.

Review each finding and determine whether the access is intentional. A cross-account S3 bucket policy that grants read access to a partner account is intentional. An S3 bucket policy that grants public read access because someone used Principal "*" without a Condition is unintentional and must be remediated.

### Access Analyzer Usage

Enable Access Analyzer in every region where you have resources. The analyzer is free to run, though it generates findings only for regions where it is enabled. Create an analyzer per account and region, or use an organization analyzer that covers all accounts in your AWS Organization.

Access Analyzer also supports zone of trust analysis. Define your zone of trust (your AWS accounts, your organization, and your network CIDR ranges). Findings outside the zone of trust are flagged as potential issues.

## IAM Permission Boundaries

Permission boundaries are an advanced IAM feature that limits the maximum permissions an IAM entity can have. They are essential for delegated administration scenarios where you allow developers to create IAM roles and policies.

### How Permission Boundaries Work

A permission boundary is a managed policy that defines the maximum permissions for an IAM role or user. The effective permissions are the intersection of the identity-based policies and the permission boundary.

If the identity-based policy allows s3:GetObject and the permission boundary allows s3:PutObject, the effective permissions are empty (the intersection is empty). If the identity-based policy allows s3:GetObject and s3:PutObject, and the permission boundary allows only s3:GetObject, the effective permission is s3:GetObject.

### When to Use Permission Boundaries

Permission boundaries are most useful when:

1. You allow developers to create IAM roles for Lambda functions or EC2 instances. Without a permission boundary, a developer can create a role with AdministratorAccess. With a permission boundary, the developer's maximum permissions are limited by the boundary.

2. You delegate IAM administration to a team. The delegated administrator can create users and policies but cannot exceed the permissions defined in the boundary.

3. You implement a multi-account strategy where a central security team defines the maximum permissions for all accounts.

### Permission Boundary Example

A permission boundary for Lambda execution roles that allows only S3, DynamoDB, and CloudWatch Logs access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

When a developer creates a Lambda execution role, the role's permissions are limited by this boundary. Even if the developer attaches an AdministratorAccess policy to the role, the effective permissions are limited to S3, DynamoDB, and CloudWatch Logs actions.

## IAM Conditions Deep Dive

IAM condition keys provide fine-grained control over when policies take effect. Understanding condition keys is the difference between a policy that works and a policy that is secure.

### Commonly Used Condition Keys

**aws:SourceIp:** Restricts access to specific IP addresses or CIDR ranges. Useful for restricting administrative access to office IPs or VPN endpoints.

**aws:RequestedRegion:** Restricts actions to specific AWS regions. Prevents resource creation in unauthorized regions.

**aws:PrincipalTag:** Uses tags on the calling principal to drive policy decisions. Essential for attribute-based access control (ABAC).

**aws:CurrentTime:** Restricts access to specific times of day. Useful for limiting maintenance windows.

**aws:MultiFactorAuthPresent:** Requires MFA for specific actions. Enforce MFA for sensitive operations like IAM policy changes or S3 bucket deletion.

**s3:prefix:** For S3 ListBucket, restrict which prefixes can be listed. Prevents enumeration of bucket contents.

**dynamodb:LeadingKeys:** For DynamoDB, restrict access to items with specific partition keys. Enables row-level security.

**ec2:ResourceTag:** Restricts access to resources with specific tags. Enables tag-based access control.

### ABAC with IAM Conditions

Attribute-Based Access Control (ABAC) uses tags on IAM principals and resources to drive access decisions. Instead of creating separate policies for each role, you create one policy that uses conditions to match tags.

Example: A policy that allows developers to manage EC2 instances only if the instance has a tag `team` that matches the developer's `team` tag:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:RebootInstances"
      ],
      "Resource": "arn:aws:ec2:*:*:instance/*",
      "Condition": {
        "StringEquals": {
          "aws:ResourceTag/team": "${aws:PrincipalTag/team}"
        }
      }
    }
  ]
}
```

This single policy works for every team. If a developer has the tag `team=frontend`, they can manage only EC2 instances with the tag `team=frontend`. If they have the tag `team=backend`, they can manage only backend instances. No separate policies are needed for each team.

ABAC scales much better than role-based access control in environments with many teams. You write one policy instead of N policies (one per team). When a new team joins, you add tags to the team members and the existing policy works automatically.

## Real Scenario: Overly Permissive IAM Policy Exploited (Expanded)

In 2020, a technology startup experienced a data breach that exposed customer data for 10,000 users. The root cause was an overly permissive IAM policy attached to a Lambda function.

The Lambda function was designed to process customer uploads to S3. The developer who created the function used the AWS Management Console and selected the AmazonS3FullAccess managed policy because they were not sure which specific S3 permissions the function needed. The function was supposed to read and write objects in a specific bucket.

The vulnerability was discovered when a security researcher found that the Lambda function's trigger (an API Gateway endpoint) was not properly authenticated. The researcher could invoke the Lambda function with arbitrary input, including a crafted S3 event that referenced a different bucket.

The attack chain was:
1. Researcher invoked the Lambda function with a crafted event referencing the customer-data bucket
2. Lambda function assumed the execution role with AmazonS3FullAccess
3. Lambda function read objects from the customer-data bucket (it was designed to read from uploads bucket, but the event injection specified customer-data bucket)
4. Researcher extracted customer PII from the response

The fix required:
1. Replacing AmazonS3FullAccess with a scoped policy that allowed only the specific bucket and prefix
2. Adding API Gateway authentication
3. Adding event validation in the Lambda function to check the bucket name
4. Enforcing permission boundaries for all Lambda execution roles
5. Implementing a policy that prevents attaching managed policies with wildcards to Lambda roles

The total exposure was 10,000 customer records. The startup was required to notify all affected customers and report the breach to the relevant data protection authority. The incident cost approximately 200,000 dollars in remediation, legal fees, and customer notification.

**Key takeaway:** Always scope IAM policies to specific resources. Never use managed policies like AmazonS3FullAccess or AdministratorAccess for Lambda execution roles. If you are unsure which permissions are needed, start with no permissions and add them as the function development reveals what is needed.

## Assessment

**Lab Task 1 (45 minutes):** Create an IAM policy for a web application backend that needs to: read objects from an S3 bucket named `prod-uploads-<your-account-id>`, write logs to CloudWatch Logs group `/app/backend`, read configuration from SSM Parameter Store at path `/prod/backend/*`, and put metrics to CloudWatch. Write the policy with explicit resource ARNs, include at least three conditions (source IP restriction, region restriction, and a tag-based condition), and explain your reasoning for each condition.

**Lab Task 2 (60 minutes):** Set up AWS IAM Access Analyzer in your account. Run an analysis for S3 buckets and IAM roles. Review the findings. For each finding, determine whether the access is intentional or a misconfiguration. For misconfigured findings, write the corrected policy or bucket policy that would remove the unintended access. Document each finding, your assessment, and your fix.

**Lab Task 3 (45 minutes):** Configure IAM Identity Center with a test permission set. Create two permission sets: one for read-only access to S3 and CloudWatch, and one for full access to Lambda and API Gateway. Test both by assuming roles through the Identity Center console. Verify that the read-only permission set cannot create or modify resources, and the Lambda permission set can manage Lambda functions but cannot access S3.

**Grading Criteria:**
- Policy precision: are resource ARNs specific and not wildcarded? (25%)
- Condition usage: are conditions meaningful and correctly implemented? (25%)
- Access Analyzer findings: are findings correctly assessed and remediated? (25%)
- Permission boundary/Identity Center: do the permission sets enforce correct least privilege? (25%)

## Evidence

Save the following as evidence:
1. Your IAM policy JSON and a written explanation of each condition (Task 1)
2. Access Analyzer findings report and your remediation notes (Task 2)
3. Screenshots of Identity Center permission sets and role assumption test results (Task 3)
