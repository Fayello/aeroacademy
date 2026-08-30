# Module 2 — Least Privilege in the Cloud: IAM Policies

## What You'll Actually Do

You'll write IAM policies from scratch, audit existing ones for over-permissioning, and use AWS Access Analyzer to find policies that are wider than they need to be. By the end, you'll stop writing `*` in Resource fields and start thinking in terms of "exactly what does this role need to do, and nothing else."

## IAM Fundamentals That Actually Matter

IAM isn't just about users and passwords. It's the control plane for everything in your cloud. Every API call goes through IAM. Every SDK operation is an IAM decision. Get this wrong and nothing else matters.

### Policy Structure

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ReadOnly",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-app-bucket",
        "arn:aws:s3:::my-app-bucket/*"
      ],
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "us-east-1"
        }
      }
    }
  ]
}
```

That `Condition` block is where most people stop. It's also where you prevent cross-region data exfiltration.

### The Scary Permissions

These permissions are essentially root access. Never grant them in normal policies:

```json
{
  "Effect": "Allow",
  "Action": [
    "iam:CreateUser",
    "iam:CreateAccessKey",
    "iam:AttachUserPolicy",
    "sts:AssumeRole",
    "iam:PassRole"
  ],
  "Resource": "*"
}
```

`iam:PassRole` is the one that gets people. An attacker with this can assign any role to any resource, escalating privileges across your entire account.

## Writing Policies That Follow Least Privilege

The trick is starting broad, then narrowing down. Here's a real-world example for a CI/CD pipeline:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DeployOnly",
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition"
      ],
      "Resource": "*"
    },
    {
      "Sid": "PassRoleToECS",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::123456789012:role/myapp-ecs-task-role"
    }
  ]
}
```

Notice: `ec2:Describe*` is broad but read-only. The `PassRole` is scoped to exactly one role.

## Lab Task — IAM Policy Audit and Rewrite

1. **Audit** — You'll receive 5 IAM policies (downloaded as JSON). For each one:
   - Identify over-permissioned actions
   - Find `Resource: *` usages and scope them down
   - Check for missing condition blocks
   - Rate each policy: Critical, High, Medium, Low risk

2. **Rewrite** — Pick the 2 worst policies and rewrite them following least privilege

3. **Validate** — Use the IAM Policy Simulator to confirm your rewritten policies still allow the intended actions and block the unintended ones

**Time:** 50 minutes

**Grading (10 points):**
- 3 points: Correct identification of over-permissions in all 5 policies
- 3 points: Rewritten policies that actually follow least privilege
- 2 points: Validated with IAM Policy Simulator
- 2 points: Clear risk rationale for each policy

**Evidence:** Upload the annotated policy files and Policy Simulator screenshots. Include a summary document explaining your risk ratings.
