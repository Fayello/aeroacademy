# Module 1: Infrastructure as Code Fundamentals

When you provision infrastructure by hand through a cloud console, you are essentially performing a series of clicks across screens, filling in form fields, selecting dropdown options, and hoping you remember every setting correctly. The first time you do it for a new service, it feels productive. You are building something. The second time you do it for a slightly different environment, it feels redundant. By the fifth time you realize you need to create yet another nearly identical stack of resources, you start wondering why you are doing the same thing over and over when you could just write it down once and let a tool execute it for you.

That is the core idea behind Infrastructure as Code. Instead of treating infrastructure as something you manually configure through dashboards and wizards, you treat it as something you define in text files, store in version control, and apply programmatically. You get the same benefits that software development got from version control years ago: reviewability, repeatability, and the ability to roll back when something breaks.

This module covers what IaC actually is in practice, why it matters in real operational environments, the difference between declarative and imperative approaches, the major tools in the space, and a practical walkthrough of migrating a real infrastructure from manual provisioning to code.

## Why Manual Infrastructure Breaks Down

Consider a typical scenario: you need to deploy a web application with a PostgreSQL database, a Redis cache, an S3 bucket for static assets, and an Application Load Balancer. Doing this through the AWS Console takes somewhere between thirty and sixty clicks across multiple service dashboards. You configure the VPC, create subnets, set up security groups, launch an EC2 instance, install the runtime, configure the database, set up automated backups, create the Redis cluster, upload your application code, configure the load balancer, set up DNS records, and configure health checks.

Now your manager asks you to create an identical staging environment that mirrors production. You could click through all those screens again and hope you don't miss a single setting. Or you could realize that clicking is error-prone, slow, and completely unversionable. There is no way to track what you clicked, no way to review it before it goes live, and no way to roll it back if something goes wrong.

The problems with manual infrastructure compound over time and across teams.

**Configuration drift** is the gradual divergence between what you think your infrastructure looks like and what it actually looks like. You create a staging environment that mirrors production, but over weeks, someone changes a security group rule in staging but not production. Someone else adjusts the instance type in staging to save costs but forgets to document it. Now you have environments that should be identical but are not, and you don't know which one is correct because there is no record of who changed what or when.

**Knowledge silos** form when only the person who set up the infrastructure knows where everything is configured. When they go on vacation, nobody can troubleshoot the load balancer settings because those settings live in their head, not in a document. When they leave the company, the team inherits infrastructure that nobody fully understands. This is not a hypothetical problem. It happens constantly in organizations that rely on manual processes.

**No audit trail** means you cannot answer basic questions about your infrastructure. A compliance auditor asks who authorized the security group change that opened port 22 to the internet. You check CloudTrail, but the event logs are a firehose of API calls with no context. There is no pull request, no approval, no ticket, just someone who clicked a button at 2 AM during an incident. You spend hours reconstructing what happened instead of answering the auditor's question.

**Slow recovery** turns minor incidents into major outages. Your production environment goes down because of a misconfigured resource. You need to recreate several resources, but you are not sure about the exact configuration. You are troubleshooting while your application is offline, clicking through dashboards while your team waits and your customers complain. What should take minutes to fix takes hours because you have no way to reproduce the infrastructure quickly.

These are the daily reality of teams that manage infrastructure manually. The fix is not better documentation, stricter change management processes, or more careful clicking. The fix is treating infrastructure as something that lives in code, goes through a review process, and can be reproduced automatically.

## Declarative vs Imperative

This distinction matters more than almost anything else in IaC because it determines how you think about your infrastructure and how your tools behave. Getting this wrong leads to frustrated teams and broken deployments.

**Declarative** means you describe the desired end state. You write a file that says I want a VPC with three subnets, a security group that allows HTTPS traffic, and two EC2 instances running this specific AMI. The tool reads that file, figures out what currently exists in your cloud account, and makes whatever changes are needed to reach the desired state. You never tell the tool to create a VPC or launch an instance. You tell it what the final result should look like, and the tool handles the how. Terraform, AWS CloudFormation, and Pulumi in its default mode all work this way.

Here is a declarative Terraform example that creates an AWS VPC:

```hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "production-vpc"
  }
}

resource "aws_subnet" "public_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "public-subnet-a"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "public-subnet-b"
  }
}
```

When you run terraform apply, Terraform compares this desired state to what actually exists in your AWS account. If the VPC does not exist, it creates it. If it exists but is missing DNS support, it adds that. If it already matches perfectly, it does nothing. The tool figures out the transition from current state to desired state automatically.

**Imperative** means you describe the steps to reach a state. You write the exact sequence of actions: create this resource, then use its ID to create that resource, then attach this policy. Shell scripts, Ansible playbooks, and Pulumi in its programmatic mode work this way. You are writing a recipe, and the tool follows your instructions step by step.

Here is an imperative Ansible approach to the same infrastructure:

```yaml
- name: Create production VPC
  amazon.aws.ec2_vpc_net:
    name: production-vpc
    cidr_block: 10.0.0.0/16
    dns_support: true
    dns_hostnames: true
    region: us-east-1
    state: present
  register: vpc

- name: Create public subnet A
  amazon.aws.ec2_vpc_subnet:
    vpc_id: "{{ vpc.vpc.id }}"
    cidr: 10.0.1.0/24
    az: us-east-1a
    state: present

- name: Create public subnet B
  amazon.aws.ec2_vpc_subnet:
    vpc_id: "{{ vpc.vpc.id }}"
    cidr: 10.0.2.0/24
    az: us-east-1b
    state: present
```

With Ansible, you are defining a sequence of actions. If you run it twice, it checks whether each resource exists and creates it if not, but the logic is in your head. You decided the order, you decided what to check, you decided what to do.

The practical difference shows up when things change. With declarative tools, you edit the file to reflect the desired state and the tool figures out the transition. With imperative tools, you edit the steps and hope the new steps work correctly in all cases. Declarative is generally simpler for infrastructure provisioning because the tool handles the state transitions. Imperative gives you more control when the steps matter, like running a database migration before deploying the new application version, or rebooting a server in a specific order during a maintenance window.

In practice, most teams use a combination. Terraform provisions the cloud resources declaratively. Ansible configures the operating systems imperatively. The two approaches complement each other rather than competing.

## IaC Benefits in Practice

The textbook benefits of IaC, consistency, version control, repeatability, sound nice in a slide deck. Here is what they actually look like in day-to-day operations when you are managing real infrastructure under real pressure.

**Consistency across environments** means your Terraform configuration defines what a VPC looks like, and you run it against your development account, your staging account, and your production account. All three get the same architecture, the same security groups, the same subnet layout. When you need to add a NAT gateway, you edit the file once and apply it everywhere. No more discovering that staging has different DNS settings than production because someone forgot to configure them last month. No more spending hours debugging a networking issue only to find that the staging VPC has a different CIDR block than production.

**Version control as a change management system** transforms how teams work. Every infrastructure change becomes a commit in Git. When someone adds a new security group rule, there is a pull request with a description of what changed and why, reviewers who approved the change, and a merge commit with a timestamp. When something breaks at 3 AM, you can run git log to see exactly when the breaking change was introduced and git revert to roll it back in seconds. This is dramatically better than trying to piece together CloudTrail events, guessing which API call caused the problem, and manually undoing changes while the system is down.

**Reproducibility** means you need to create a disaster recovery environment in a different region. Instead of clicking through dashboards for hours, you run terraform apply with a different region variable and twenty minutes later you have an identical environment. When your staging environment gets corrupted by a bad test, you destroy it and recreate it in minutes. When you need to spin up a temporary environment for a proof of concept, you create a new variable file and apply. The infrastructure becomes disposable and reproducible rather than precious and fragile.

**Collaboration** changes how teams work together. Two engineers can work on different parts of the infrastructure in separate Git branches. One is adding a new monitoring stack, the other is updating the networking configuration. They merge their changes through pull requests, run automated tests, and deploy with confidence. Code reviews catch mistakes before they hit production. This is how modern teams work with application code, and IaC brings the same workflow to infrastructure.

**Documentation that never goes stale** is perhaps the most underappreciated benefit. The Terraform files ARE the documentation. If someone asks what security groups exist, you look at the Terraform files. If someone asks how the load balancer is configured, you read the configuration. There is no separate wiki page that was written six months ago and has not been updated since. There is no spreadsheet tracking which resources exist in which accounts. The code is the single source of truth, and it is always current because it is what creates the infrastructure.

## The IaC Tool Landscape

There are three categories of IaC tools you will encounter in practice, and each serves a different purpose. Understanding when to use which tool is as important as knowing how to use them.

**Terraform** by HashiCorp is the most widely used IaC tool in the industry. It uses HCL, HashiCorp Configuration Language, to define infrastructure declaratively. Terraform supports hundreds of providers including AWS, Azure, GCP, Cloudflare, GitHub, Kubernetes, Datadog, PagerDuty, and many more. It manages state internally so it knows what resources exist, tracks resource dependencies to determine the correct creation order, and creates execution plans before making any changes so you can review what will happen. Terraform is the tool you will use most often for provisioning cloud infrastructure, and it is what most job descriptions mean when they ask for IaC experience.

**Pulumi** takes a fundamentally different approach. Instead of a custom language like HCL, it uses general-purpose programming languages. You write infrastructure in TypeScript, Python, Go, C#, or Java. You get real loops, real conditionals, real functions, real type checking, and access to the entire package ecosystem of your chosen language. Pulumi manages state similarly to Terraform but gives you the full power of a programming language for complex logic. If you need to call an API, parse JSON, query a database, or do any other complex operation as part of your infrastructure deployment, Pulumi makes it straightforward.

**Ansible** is an imperative configuration management tool. It uses YAML playbooks to describe steps that should be run on remote servers. Ansible is agentless, meaning it SSHes into machines, pushes small Python scripts, runs them, and removes them when done. There is no daemon to install, no agent to manage, no special port to open. Ansible excels at configuring operating systems, installing packages, managing configuration files, deploying applications, and running commands. It is less suited for provisioning cloud infrastructure but excels at everything that happens after the infrastructure exists.

Other tools in the space include AWS CloudFormation, Amazon's native IaC tool that uses JSON or YAML templates, Crossplane, which extends Kubernetes to manage external infrastructure, OpenTofu, the open-source fork of Terraform after HashiCorp changed its license, and Packer, which builds machine images.

In practice, most teams use a combination of tools. Terraform provisions the cloud infrastructure, the VPCs, instances, databases, load balancers, and DNS records. Ansible configures the operating systems on those instances, installing packages, managing users, configuring services, and deploying applications. Pulumi or custom scripts handle complex logic that is hard to express in HCL. The tools are complementary, not competing.

## Real Scenario: Migrating from Manual to IaC

Let us walk through a realistic migration. You are on a team that has been managing AWS infrastructure manually for two years. The production environment includes a VPC, several EC2 instances running a Node.js application, an RDS PostgreSQL database, an S3 bucket for static assets, and an Application Load Balancer. Everything was set up through the AWS Console. Your task is to migrate all of this to Terraform without disrupting the running production environment.

**Step 1: Discover what exists**

Before you can write any Terraform, you need to know what is actually deployed. Use the AWS Console, the AWS CLI, or tools like terraformer to inventory your resources. You need to know every resource, its configuration, its tags, and its relationships to other resources.

```bash
# List all VPCs
aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,CidrBlock,Tags[?Key==`Name`].Value|[0]]' --output table

# List all EC2 instances with their details
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,SubnetId,VpcId,Tags[?Key==`Name`].Value|[0]]' --output table

# List all RDS instances
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceClass,Engine,VpcSecurityGroups]' --output json

# List all security groups with their rules
aws ec2 describe-security-groups --query 'SecurityGroups[*].[GroupId,GroupName,IpPermissions]' --output json

# List S3 buckets
aws s3api list-buckets --query 'Buckets[*].[Name,CreationDate]' --output table
```

Document everything. Create a spreadsheet with resource types, IDs, configurations, dependencies, and tags. This inventory becomes your source of truth for the Terraform migration. You will reference it constantly as you write the Terraform configuration.

**Step 2: Set up the Terraform project**

Create a repository structure that separates concerns logically:

```
infrastructure/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars
├── vpc.tf
├── ec2.tf
├── rds.tf
├── s3.tf
├── alb.tf
└── security_groups.tf
```

Initialize the project with a remote backend:

```bash
mkdir infrastructure && cd infrastructure
terraform init
```

Create a main.tf that configures the AWS provider and remote state:

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}
```

The S3 backend stores your Terraform state remotely so the whole team can access it. The DynamoDB table provides state locking so two people cannot apply changes simultaneously. Set this up on day one. Storing state locally on your laptop is a recipe for disaster.

**Step 3: Import existing resources**

This is the critical step that many teams skip, leading to broken infrastructure. Terraform does not know about resources that were created manually through the console. You need to tell it about them using terraform import.

```hcl
# vpc.tf: define the resource block first, matching the current configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "production-vpc"
  }
}
```

```bash
# Then import the existing VPC using its actual ID
terraform import aws_vpc.main vpc-0123456789abcdef0
```

Repeat this process for every resource. This is tedious but essential. For each resource, you write the Terraform configuration that matches the current state as closely as possible, then import it. After importing, run terraform plan to verify that Terraform sees zero changes. This means your configuration matches reality. If it shows changes, your configuration does not match and you need to fix it before proceeding.

```bash
terraform plan
# If the output says "No changes. Infrastructure is up-to-date.", you are good.
# If it shows changes, something in your configuration does not match reality.
```

**Step 4: Validate and test**

Before applying anything to production, validate your configuration thoroughly:

```bash
# Check syntax
terraform validate

# Format code consistently
terraform fmt -recursive

# Plan without applying to see what would change
terraform plan -out=tfplan
```

Review the plan carefully. Every resource that Terraform wants to create, modify, or destroy should be expected. If Terraform wants to destroy your production database, something is fundamentally wrong with your configuration. Never apply a plan you have not reviewed.

**Step 5: Apply to a non-production environment first**

Create a staging environment using the same Terraform configuration with different variable values:

```bash
cd staging/
terraform apply -var-file="staging.tfvars"
```

Verify that the staging environment works correctly. Deploy your application to it. Run your test suite against it. Only after staging is fully validated should you touch production.

**Step 6: Apply to production**

Once staging is validated:

```bash
cd production/
terraform plan -out=tfplan
# Review the plan one more time
terraform apply tfplan
```

**Step 7: Establish the ongoing workflow**

After the initial migration, all future changes go through Terraform and follow a consistent process:

1. Create a Git branch for the change
2. Edit the Terraform files
3. Run terraform plan and include the output in your commit message
4. Open a pull request
5. Get review and approval from a team member
6. Merge to main
7. Apply automatically through CI/CD or manually with approval

## Common Pitfalls in Early IaC Adoption

**State file mismanagement**: The Terraform state file contains everything Terraform manages. If you lose it, Terraform loses track of your resources and may try to recreate them, creating duplicates and breaking your infrastructure. Store state remotely with locking. Never commit state files to Git. Never run Terraform from multiple machines without remote state.

**Over-permissioned providers**: Your Terraform AWS provider needs enough permissions to create, modify, and delete the resources it manages. But it should not have admin access to everything. Create an IAM role specifically for Terraform with the minimum permissions needed. This follows the principle of least privilege and limits the blast radius if your state file is compromised.

**Not importing existing resources**: The biggest mistake teams make is creating new Terraform resources instead of importing existing ones. This results in Terraform trying to create duplicates while the old manual resources still exist. You end up with double the resources, confused networking, and potential IP address conflicts. Always import first.

**Skipping the plan step**: Running terraform apply without reviewing the plan is like deploying code without reviewing the diff. Always run terraform plan first and understand what changes Terraform intends to make. The plan is your safety net.

**No remote state**: Storing Terraform state locally on your laptop means nobody else can work on the infrastructure, and if your laptop dies or is stolen, the state is gone. Set up remote state on day one, before you create your first resource.

**Ignoring team coordination**: Without a process, two engineers can make conflicting changes to the same Terraform configuration. Establish branch strategies, pull request workflows, and locking mechanisms to prevent conflicts.

## Assessment

**Lab Task 1** (45 minutes): Given an existing AWS environment with a VPC, two subnets, a security group, and an EC2 instance, all created manually through the console, write Terraform configuration files that match the existing state. Import all resources using terraform import. Verify with terraform plan that no changes are detected.

**Lab Task 2** (30 minutes): Create a new Terraform project from scratch that provisions a VPC with public and private subnets across two availability zones, an internet gateway, and route tables. Apply it to a test account and verify the resources exist in the AWS Console.

**Lab Task 3** (30 minutes): Write a GitHub Actions workflow that runs terraform fmt -check, terraform validate, and terraform plan on every pull request. Push the repository and verify the workflow runs on a test PR.

**Grading Criteria**:
- Resources import correctly with zero plan changes (30 points)
- New VPC configuration is syntactically valid and provisions successfully (30 points)
- CI/CD pipeline runs all three checks without errors (20 points)
- Code is properly formatted with consistent naming conventions (10 points)
- No hardcoded secrets or credentials in any Terraform file (10 points)

**Time Limit**: 105 minutes total

## Evidence

After completing this module, you should be able to:

- Explain the difference between declarative and imperative IaC approaches and when to use each
- Set up a Terraform project with remote state management in S3
- Import manually-created AWS resources into Terraform state
- Read and interpret a Terraform plan to understand proposed changes
- Write a basic CI/CD pipeline for Terraform validation
- Identify the common pitfalls that cause IaC migrations to fail

**Artifact**: A Git repository containing a Terraform project that imports an existing AWS environment, a new VPC configuration, and a GitHub Actions workflow. The repository should have a clean commit history showing the migration process from manual to code-managed infrastructure.
