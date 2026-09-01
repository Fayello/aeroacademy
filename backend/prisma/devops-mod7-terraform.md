# Module 7: Infrastructure as Code with Terraform

## What Terraform Does

Terraform is a tool for provisioning and managing infrastructure. You write configuration files that describe the infrastructure you want: servers, databases, networks, load balancers, DNS records. Terraform figures out how to create that infrastructure in your cloud provider (AWS, GCP, Azure, or dozens of others).

The key insight is that Terraform is declarative. You describe the desired end state, and Terraform figures out the steps to get there. If you have 10 servers and you change the configuration to have 12, Terraform creates 2 new ones. If you change the server type from t3.micro to t3.small, Terraform updates them. If you remove a resource from the configuration, Terraform destroys it.

Terraform tracks the state of your infrastructure. It knows what it created, what configuration those resources have, and how they relate to each other. This state is stored in a state file (or a remote backend) and is the source of truth for what Terraform manages.

## HCL Syntax

Terraform uses HashiCorp Configuration Language (HCL). It is human-readable and designed for infrastructure definition.

### Providers

Providers are plugins that interact with cloud providers, SaaS providers, and other APIs. Each provider offers resources and data sources.

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.5"
}

provider "aws" {
  region = "us-east-1"
  default_tags {
    tags = {
      ManagedBy   = "terraform"
      Environment = var.environment
    }
  }
}
```

The `required_providers` block specifies which providers to use and their versions. The `~> 5.0` version constraint allows any 5.x version but not 6.0. The `provider` block configures the provider with the region and default tags applied to all resources.

### Resources

Resources are the most important element. Each resource block defines an infrastructure object.

```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.web.id]
  subnet_id              = aws_subnet.public.id

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name = "web-server-${var.environment}"
  }
}

resource "aws_security_group" "web" {
  name        = "web-sg-${var.environment}"
  description = "Allow HTTP and HTTPS"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

The resource `aws_instance.web` creates an EC2 instance. The resource `aws_security_group.web` creates a security group. Notice that `aws_instance.web` references `aws_security_group.web.id`: Terraform automatically determines the creation order based on dependencies.

### Data Sources

Data sources query existing resources. They do not create or modify infrastructure: they read information about resources that already exist.

```hcl
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]  # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

data "aws_vpc" "existing" {
  filter {
    name   = "tag:Name"
    values = ["production-vpc"]
  }
}
```

The `data.aws_ami.ubuntu` data source finds the latest Ubuntu AMI. The `data.aws_vpc.existing` data source finds a VPC by tag. Data sources are useful for referencing resources that Terraform did not create.

### Variables and Outputs

Variables parameterize configurations. Outputs expose values.

```hcl
variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

output "instance_public_ip" {
  description = "Public IP of the web server"
  value       = aws_instance.web.public_ip
}

output "database_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}
```

Variables are defined in `variables.tf` and passed via `terraform.tfvars`, environment variables, or CLI flags. The `sensitive = true` flag prevents the value from appearing in plan output and logs.

Outputs are displayed after `terraform apply` and can be referenced by other Terraform configurations or scripts.

### Locals

Locals are intermediate values computed from other values.

```hcl
locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "aeroacademy"
  }

  name_prefix = "${var.project}-${var.environment}"

  is_production = var.environment == "production"
}

resource "aws_instance" "web" {
  instance_type = local.is_production ? "t3.large" : "t3.micro"
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-web"
  })
}
```

Locals reduce repetition and improve readability. They are computed once and referenced throughout the configuration.

## State Management

Terraform state is the mapping between your configuration and the real infrastructure. The state file records which resources exist, their IDs, and their attributes.

### Local State (Default)

By default, Terraform stores state in a `terraform.tfstate` file in the current directory. This is fine for personal projects but unsuitable for teams because:
- The state file is not shared
- Concurrent modifications can corrupt the state
- The state file may contain secrets

### Remote Backend

For teams, store state remotely:

```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/infrastructure.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

This stores the state in an S3 bucket with encryption enabled. The DynamoDB table provides state locking: only one person can modify the state at a time. Without locking, two people running `terraform apply` simultaneously can corrupt the state.

Other remote backends: Azure Blob Storage, Google Cloud Storage, Consul, Terraform Cloud, and PostgreSQL.

### State Operations

```bash
# Show current state
terraform state list
terraform state show aws_instance.web

# Move resources in state (renaming)
terraform state mv aws_instance.web aws_instance.app

# Remove resources from state (without destroying them)
terraform state rm aws_instance.web

# Import existing infrastructure into state
terraform import aws_instance.web i-0123456789abcdef0

# Refresh state (check for external changes)
terraform refresh
```

The `import` command is essential for adopting existing infrastructure. It adds resources that were created manually to Terraform management without recreating them.

### State Best Practices

1. **Never edit state manually.** The `terraform.tfstate` file is a JSON file, and it is tempting to open it and make changes. Do not. Use `terraform state` commands instead. Manual edits can corrupt the state and cause Terraform to destroy and recreate resources.

2. **Use remote state for teams.** Local state is for personal experiments only. Any shared infrastructure must use remote state with locking.

3. **Separate state by environment.** Each environment (development, staging, production) should have its own state file. This prevents a `terraform destroy` in development from affecting production.

4. **Separate state by component.** For large infrastructures, split resources into separate state files by component: networking, compute, database, monitoring. This reduces the blast radius of state corruption and makes `terraform plan` faster.

5. **Enable state encryption.** State files often contain secrets (database passwords, API keys). Enable encryption at rest for remote backends.

6. **Version your state.** Use S3 versioning or equivalent to keep historical state files. If state gets corrupted, you can restore a previous version.

## Terraform Workflow

The standard Terraform workflow has three phases: write, plan, and apply.

### Write

Write the configuration in HCL files. Organize by concern: `main.tf` for primary resources, `variables.tf` for inputs, `outputs.tf` for outputs, `providers.tf` for provider configuration, `versions.tf` for version constraints.

```
terraform/
  main.tf
  variables.tf
  outputs.tf
  providers.tf
  versions.tf
  terraform.tfvars
```

### Plan

Run `terraform plan` to preview changes. The plan shows what Terraform will create, modify, or destroy. Always review the plan before applying.

```bash
# Standard plan
terraform plan

# Plan with specific variable values
terraform plan -var="instance_type=t3.large"

# Plan using a variable file
terraform plan -var-file="production.tfvars"

# Save plan to a file
terraform plan -out=tfplan

# Show saved plan
terraform show tfplan
```

The plan output is the most important Terraform artifact. It tells you exactly what will happen. Read every line. A `terraform plan` that says it will destroy your database when you only intended to change a tag is a red flag.

### Apply

Run `terraform apply` to execute the plan. Always review the plan before confirming.

```bash
# Apply with confirmation prompt
terraform apply

# Apply a saved plan
terraform apply tfplan

# Apply without confirmation (use in CI/CD only)
terraform apply -auto-approve

# Target specific resources
terraform apply -target=aws_instance.web

# Apply with parallelism (default is 10)
terraform apply -parallelism=5
```

The `-target` flag is useful for applying changes to specific resources without affecting others. Use it sparingly: targeted applies can cause state drift.

### Destroy

Run `terraform destroy` to remove all resources. Use it for teardown, cleanup, or starting over.

```bash
# Destroy with confirmation
terraform destroy

# Destroy specific resources
terraform destroy -target=aws_instance.web

# Destroy without confirmation (dangerous)
terraform destroy -auto-approve
```

### Terraform in CI/CD

Integrate Terraform into your CI/CD pipeline:

```yaml
# GitHub Actions workflow for Terraform
name: Terraform
on:
  pull_request:
    paths:
      - 'terraform/**'
  push:
    branches: [main]
    paths:
      - 'terraform/**'

jobs:
  terraform:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: terraform
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        run: terraform init

      - name: Terraform Format Check
        run: terraform fmt -check

      - name: Terraform Validate
        run: terraform validate

      - name: Terraform Plan
        run: terraform plan -no-color
        id: plan

      - name: Terraform Apply (main branch only)
        if: github.ref == 'refs/heads/main'
        run: terraform apply -auto-approve
```

The pipeline runs `terraform plan` on pull requests and `terraform apply` on merges to main. The plan output is posted as a PR comment for review. This ensures all infrastructure changes are reviewed before they reach production.

## Modules

Modules are reusable Terraform configurations. They encapsulate common patterns and promote consistency.

### Creating a Module

```
modules/
  vpc/
    main.tf
    variables.tf
    outputs.tf
  ec2/
    main.tf
    variables.tf
    outputs.tf
```

```hcl
# modules/vpc/variables.tf
variable "cidr_block" {
  description = "VPC CIDR block"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

# modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.environment}-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.cidr_block, 8, 1)
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment}-public-subnet"
  }
}

# modules/vpc/outputs.tf
output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_id" {
  value = aws_subnet.public.id
}
```

### Using a Module

```hcl
module "vpc" {
  source = "./modules/vpc"

  cidr_block  = "10.0.0.0/16"
  environment = var.environment
}

module "web_server" {
  source = "./modules/ec2"

  instance_type = "t3.micro"
  subnet_id     = module.vpc.public_subnet_id
  vpc_id        = module.vpc.vpc_id
}
```

Modules can come from local paths, Git repositories, Terraform Registry, or HTTP URLs. The Terraform Registry has thousands of modules for common infrastructure patterns.

### Module Composition

```hcl
module "production" {
  source = "./modules/environment"

  environment    = "production"
  instance_type  = "t3.large"
  vpc_cidr       = "10.0.0.0/16"
  db_instance_class = "db.r5.large"
}

module "staging" {
  source = "./modules/environment"

  environment    = "staging"
  instance_type  = "t3.small"
  vpc_cidr       = "10.1.0.0/16"
  db_instance_class = "db.t3.medium"
}
```

This pattern creates identical environments with different configurations. The module encapsulates the entire stack (VPC, EC2, RDS, etc.), and each instance uses different variables.

## Workspaces

Workspaces allow multiple state files in the same configuration. Each workspace has its own state.

```bash
# Create workspaces
terraform workspace new development
terraform workspace new staging
terraform workspace new production

# Switch workspaces
terraform workspace select production

# List workspaces
terraform workspace list

# Show current workspace
terraform workspace show
```

Workspaces are useful for managing the same infrastructure across environments. However, many teams prefer separate directories or separate state files because workspaces are easy to confuse. The risk with workspaces is that you forget which workspace you are in and apply changes to the wrong environment. Separate directories with separate state files are safer because the context switch is explicit.

```hcl
# Environment-specific configuration using workspace
locals {
  env = terraform.workspace

  instance_type = {
    development = "t3.micro"
    staging     = "t3.small"
    production  = "t3.large"
  }
}

resource "aws_instance" "web" {
  instance_type = local.instance_type[local.env]
}
```

The `terraform.workspace` variable returns the current workspace name. Use it to select environment-specific values.

## Plan, Apply, Destroy Workflow

The Terraform workflow has three main commands:

```bash
# Initialize (download providers, configure backend)
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply

# Destroy everything
terraform destroy
```

`terraform plan` shows what Terraform will do without making changes. Always review the plan before applying. The plan shows resources to add, modify, and destroy.

`terraform apply` executes the plan. It asks for confirmation unless you pass `-auto-approve`. The plan is saved to a file, and you can apply a saved plan:

```bash
terraform plan -out=tfplan
terraform apply tfplan
```

`terraform destroy` removes all resources managed by the configuration. Use it for teardown or to start fresh.

The workflow for changes:

1. Write configuration
2. Run `terraform plan` to preview
3. Review the plan carefully
4. Run `terraform apply` to execute
5. Verify the infrastructure

## Real Story: Importing Existing Infrastructure into Terraform

A company had been running infrastructure for three years without IaC. Servers were created manually, configured with shell scripts, and documented in a wiki (when anyone bothered to update it). The wiki was two years out of date.

The team decided to adopt Terraform. The challenge was that all the infrastructure already existed. They could not just write Terraform configurations and `terraform apply`: that would create duplicate resources.

The import process started with the most critical resources: the VPC, subnets, and security groups.

First, they documented the existing infrastructure:

```bash
# List all EC2 instances
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,Tags[?Key==`Name`].Value|[0],PrivateIpAddress]' --output table

# List all security groups
aws ec2 describe-security-groups --query 'SecurityGroups[*].[GroupId,GroupName,VpcId]' --output table
```

Then they wrote Terraform configurations that matched the existing resources:

```hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "production-vpc"
  }
}
```

And imported them:

```bash
terraform import aws_vpc.main vpc-0123456789abcdef0
```

The import command added the existing VPC to Terraform state. Now Terraform knew about the VPC and would manage it going forward.

The hardest part was security groups. They had 47 security groups with complex rules. The team wrote Terraform configurations for each, imported them, and ran `terraform plan` to check for discrepancies. The plan revealed 12 security group rules that had been added manually without updating the wiki. Terraform now serves as the documentation.

The most painful discovery was that 3 of their EC2 instances were not in any security group: they were open to the internet. This was a security vulnerability that had existed for months. Terraform caught it because the plan showed that the instances would need security groups attached.

The import process took two weeks for 200+ resources. The team used a spreadsheet to track which resources were imported and which were pending. The final step was enabling `terraform plan` in CI to detect drift: any manual changes to the infrastructure would be caught by the next pull request.

The biggest lesson from the import project was that Terraform forced the team to document their infrastructure. Before Terraform, the wiki said "there are some servers in AWS." After Terraform, the code said exactly which servers existed, what configuration they had, and how they related to each other. The code was the documentation, and it was always up to date because it was the source of truth.

Another unexpected benefit was cost visibility. The Terraform configuration listed every resource and its type. The team could estimate costs by looking at the configuration instead of logging into the AWS console. They added a `cost估算` comment block to each resource module, making cost awareness part of the infrastructure definition.

## Drift Detection

Drift occurs when the real infrastructure diverges from the Terraform configuration. Someone manually changes a security group, adds a tag, or modifies a setting. Terraform does not detect this automatically: it only knows about changes made through `terraform apply`.

Drift detection compares the real infrastructure with the state file:

```bash
terraform plan -detailed-exitcode
```

The `-detailed-exitcode` flag returns exit code 2 if there are changes. This is useful in CI pipelines:

```yaml
- name: Check for drift
  run: terraform plan -detailed-exitcode
  continue-on-error: true
  id: plan

- name: Report drift
  if: steps.plan.outcome == 'failure'
  run: echo "Infrastructure drift detected!"
```

## Terraform Best Practices

### File Organization

Keep Terraform configurations organized by concern:

```
terraform/
  modules/
    vpc/
      main.tf
      variables.tf
      outputs.tf
    ec2/
      main.tf
      variables.tf
      outputs.tf
    rds/
      main.tf
      variables.tf
      outputs.tf
  environments/
    production/
      main.tf
      variables.tf
      terraform.tfvars
      backend.tf
    staging/
      main.tf
      variables.tf
      terraform.tfvars
      backend.tf
```

Each module encapsulates a single concern (networking, compute, database). Each environment uses the modules with different variables. This structure promotes reuse and consistency.

### Naming Conventions

Follow consistent naming conventions:

- Resources: `aws_instance_web`, `aws_security_group_web` (lowercase, underscores)
- Variables: `instance_type`, `db_password` (lowercase, underscores)
- Outputs: `instance_public_ip`, `database_endpoint` (lowercase, underscores)
- Modules: `vpc`, `web_server`, `database` (lowercase, underscores)

### Variable Validation

Validate variables at plan time to catch errors early:

```hcl
variable "environment" {
  type = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "instance_type" {
  type = string
  validation {
    condition     = can(regex("^t[23]\\.", var.instance_type))
    error_message = "Instance type must be a t2 or t3 family instance."
  }
}
```

Validation prevents typos and invalid values from reaching production. An invalid instance type caught at plan time is a 2-second fix. An invalid instance type caught at apply time might destroy infrastructure.

To fix drift, you have two options:

1. **Apply the Terraform configuration**: `terraform apply` brings the infrastructure in line with the configuration. This is the correct approach when the configuration is the source of truth.

2. **Update the state**: `terraform refresh` updates the state to match the real infrastructure. This is useful when someone made a legitimate manual change that should be reflected in Terraform.

The best practice is to prevent drift by making all changes through Terraform. Use IAM policies to restrict manual changes, and use `terraform plan` in CI to catch any drift that occurs.

## Assessment

**Lab Task 1: Build a VPC and EC2 Instance (60 minutes)**

Create a Terraform configuration that provisions:
1. A VPC with CIDR block 10.0.0.0/16
2. Two public subnets in different availability zones
3. An internet gateway
4. A route table for public subnets
5. A security group allowing HTTP, HTTPS, and SSH
6. An EC2 instance running Ubuntu 22.04
7. An Elastic IP for the EC2 instance

Use variables for environment, instance type, and SSH key. Output the public IP and DNS name.

Grading criteria: All 7 resources created correctly (40%), variables and outputs properly defined (20%), security group rules are appropriate (15%), configuration is well-organized (15%), documentation explains design decisions (10%).

**Lab Task 2: Module Development (60 minutes)**

Create a reusable Terraform module for an RDS PostgreSQL database that includes:
1. DB instance with configurable instance class
2. Subnet group across multiple availability zones
3. Security group allowing access from specified CIDR blocks
4. Parameter group with PostgreSQL-specific settings
5. Automated backups with configurable retention
6. Encryption at rest

The module should be usable with a single `module` block.

Grading criteria: Module works correctly (35%), all resources properly configured (25%), inputs and outputs well-documented (20%), module is reusable (20%).

**Lab Task 3: State Management (45 minutes)**

Configure remote state for a Terraform configuration:
1. Set up S3 backend with DynamoDB locking
2. Migrate local state to remote backend
3. Demonstrate state locking by running two applies simultaneously
4. Show how to import an existing resource into state
5. Demonstrate drift detection

Document each step and explain why remote state is necessary for teams.

Grading criteria: Remote backend configured correctly (30%), state migration works (25%), locking demonstrated (15%), import works (15%), documentation (15%).

**Lab Task 4: Drift Detection and Reconciliation (45 minutes)**

1. Create infrastructure with Terraform
2. Manually modify a resource (add a tag, change a setting)
3. Run `terraform plan` to detect the drift
4. Decide whether to apply Terraform config or update state
5. Document the drift detection and reconciliation process

Grading criteria: Drift correctly detected (30%), reconciliation decision is appropriate (30%), documentation explains drift detection (20%), process is reproducible (20%).

## Evidence

Terraform is developed by HashiCorp and documented in the official Terraform documentation (terraform.io). HCL syntax, providers, resources, data sources, variables, outputs, and locals are documented in the Terraform language documentation.

The remote state configuration uses AWS S3 and DynamoDB, which are documented in the Terraform S3 backend documentation. State locking with DynamoDB is a standard pattern recommended by HashiCorp for team environments.

The module system is documented in the Terraform modules documentation. The Terraform Registry (registry.terraform.io) hosts thousands of modules and providers. The module composition pattern is documented in the Terraform best practices guide.

The import workflow is documented in the Terraform import documentation. The `terraform import` command adds existing resources to Terraform state without modifying the infrastructure. The drift detection workflow uses `terraform plan -detailed-exitcode`, which is documented in the Terraform plan documentation.

The real-world import story is based on common patterns observed in organizations that adopt Terraform for existing infrastructure. The challenges (outdated documentation, undiscovered resources, security vulnerabilities) are typical of manual infrastructure management and are addressed by the Terraform adoption process.