# Module 4 — Terraform Workspaces

You have got a Terraform configuration that provisions a VPC, some instances, and a database. It works perfectly in development. Now you need the same infrastructure in staging and production. You could copy the configuration three times, but then you are maintaining three copies of the same code and updating all three whenever something changes. You could use variable files, but that does not solve the state isolation problem. All three environments would share the same state file, and a terraform destroy in development could accidentally wipe out production.

Terraform workspaces solve this by letting you maintain multiple state files from the same configuration. Each workspace is an independent instance of your infrastructure with its own state. The code is identical. The state is separate.

This module covers how workspaces function internally, practical patterns for environment isolation, the limitations of workspaces compared to directory-based isolation, and a complete scenario of managing dev, staging, and production environments.

## How Workspaces Work

When you run terraform init, Terraform creates a default workspace called default. Every terraform plan and terraform apply runs against this workspace unless you specify otherwise.

```bash
# List workspaces
terraform workspace list

# Create a new workspace
terraform workspace new staging

# Switch between workspaces
terraform workspace select default

# Show current workspace
terraform workspace show

# Delete a workspace (must not be the active one)
terraform workspace delete old-workspace
```

When you create a workspace, Terraform creates a separate state file for it. The default workspace has its own state, staging has its own state, and production has its own state. They all use the same configuration, but the state files are completely independent.

With a remote backend like S3, the state files are stored at different keys:

```
s3://my-terraform-state/env:/default/terraform.tfstate
s3://my-terraform-state/env:/staging/terraform.tfstate
s3://my-terraform-state/env:/production/terraform.tfstate
```

**Workspace-specific values**: Terraform provides a built-in variable terraform.workspace that contains the current workspace name. You can use this to parameterize your infrastructure:

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = terraform.workspace == "production" ? "m5.large" : "t3.micro"

  tags = {
    Name        = "${terraform.workspace}-web-server"
    Environment = terraform.workspace
  }
}

resource "aws_db_instance" "postgres" {
  instance_class = terraform.workspace == "production" ? "db.r5.large" : "db.t3.micro"
  multi_az       = terraform.workspace == "production" ? true : false
  # ...
}
```

This lets you use the same configuration for all environments while varying resource sizes, counts, and other parameters based on the workspace. The ternary operator checks the workspace name and selects the appropriate value.

**Conditional resource creation**: You can use count with workspace names to create resources only in certain environments:

```hcl
# Only create a NAT gateway in production and staging
resource "aws_nat_gateway" "main" {
  count  = terraform.workspace != "dev" ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id
}

# More instances in production
resource "aws_instance" "web" {
  count = terraform.workspace == "production" ? 4 : 2
  # ...
}

# Database backups only in production
resource "aws_db_instance" "postgres" {
  backup_retention_period = terraform.workspace == "production" ? 30 : 0
  # ...
}
```

This is useful for environment-specific differences that cannot be expressed through variables alone.

## Environment Isolation Patterns

There are three main patterns for organizing multi-environment Terraform, each with tradeoffs that matter in practice.

**Pattern 1: Workspaces with conditional logic**

The same configuration behaves differently based on which workspace is active:

```hcl
locals {
  environment_config = {
    dev = {
      instance_type    = "t3.micro"
      instance_count   = 1
      database_class   = "db.t3.micro"
      enable_multi_az  = false
      enable_nat       = false
      backup_retention = 0
    }
    staging = {
      instance_type    = "t3.small"
      instance_count   = 2
      database_class   = "db.t3.small"
      enable_multi_az  = false
      enable_nat       = true
      backup_retention = 7
    }
    production = {
      instance_type    = "m5.large"
      instance_count   = 4
      database_class   = "db.r5.large"
      enable_multi_az  = true
      enable_nat       = true
      backup_retention = 30
    }
  }

  config = local.environment_config[terraform.workspace]
}

resource "aws_instance" "web" {
  count         = local.config.instance_count
  instance_type = local.config.instance_type
  # ...
}

resource "aws_db_instance" "postgres" {
  instance_class      = local.config.database_class
  multi_az            = local.config.enable_multi_az
  backup_retention_period = local.config.backup_retention
  # ...
}
```

This pattern is clean for simple differences but gets unwieldy when environments have fundamentally different architectures. If dev has one subnet and production has three across three AZs, the conditional logic becomes a mess.

**Pattern 2: Workspace with variable files**

Use workspace-specific variable files to keep differences out of the code:

```
environments/
├── dev.tfvars
├── staging.tfvars
└── production.tfvars
```

```hcl
# dev.tfvars
instance_type    = "t3.micro"
instance_count   = 1
database_class   = "db.t3.micro"
enable_multi_az  = false
enable_nat       = false

# production.tfvars
instance_type    = "m5.large"
instance_count   = 4
database_class   = "db.r5.large"
enable_multi_az  = true
enable_nat       = true
```

Apply with:

```bash
terraform workspace select production
terraform apply -var-file="environments/production.tfvars"
```

The workspace controls state isolation. The var file controls configuration differences. This is cleaner than embedding all environment differences in the code because the configuration file stays simple and the differences are explicit in the var files.

**Pattern 3: Directory-based isolation**

Separate directories for each environment, each with its own state:

```
environments/
├── dev/
│   ├── main.tf       # imports shared module
│   ├── variables.tf
│   ├── outputs.tf
│   ├── terraform.tfvars
│   └── terraform.tfstate
├── staging/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── terraform.tfvars
│   └── terraform.tfstate
└── production/
    ├── main.tf
    ├── variables.tf
    ├── outputs.tf
    ├── terraform.tfvars
    └── terraform.tfstate
```

Each directory's main.tf calls the same shared module:

```hcl
# environments/dev/main.tf
module "infrastructure" {
  source = "../../modules/platform"

  environment        = "dev"
  instance_type      = "t3.micro"
  instance_count     = 1
  # ...
}
```

```hcl
# environments/production/main.tf
module "infrastructure" {
  source = "../../modules/platform"

  environment        = "production"
  instance_type      = "m5.large"
  instance_count     = 4
  # ...
}
```

**Workspaces vs directories**: Workspaces are convenient for simple environments with minor differences. Directories provide better isolation and are more explicit about what each environment contains. In practice, most teams use directories because code reviews are clearer and you see exactly which environment is changing, different Git branches can modify different environments without conflict, CI/CD pipelines can target specific environments by directory, and there is no risk of accidentally running Terraform in the wrong workspace.

Workspaces make sense when environments are truly identical except for sizing, like development instances that are the same architecture but smaller.

**When to use workspaces**:

Workspaces work well for:
- Quick prototyping where you want to test infrastructure in a separate state
- Simple environments that differ only in sizing (instance type, count)
- Personal development environments that are disposable
- Learning and experimentation

Directories work better for:
- Production environments that need strict isolation
- Teams where different people own different environments
- Environments with fundamentally different architectures
- CI/CD pipelines that need clear, explicit targeting
- Environments with different provider configurations (different accounts, regions)

**Workspace best practices**:

1. Always run terraform workspace show before terraform plan or apply to verify you are in the right workspace.
2. Use meaningful workspace names that match your environment naming convention.
3. Never create a workspace named default for production.
4. Set up remote state with locking to prevent concurrent modifications.
5. Document which workspaces exist and what they are used for.

**Workspace naming conventions**:

```
terraform workspace new dev
terraform workspace new staging
terraform workspace new production
terraform workspace new feature-branch-123
```

Use lowercase, hyphenated names that match your team's naming convention. Avoid names that could be confused with Git branches or other identifiers.

## State Isolation

The whole point of separating environments is state isolation. When you run terraform destroy in development, you should never touch production resources. Workspaces provide this isolation at the state level.

**How state isolation works**: Each workspace maintains a completely independent state file. Terraform uses the state to map configuration blocks to real resources. When you are in the dev workspace, Terraform only knows about resources in the dev state. Resources in staging and production do not exist as far as the dev workspace is concerned.

```
terraform.workspace = "dev"
state = {
  aws_vpc.main = vpc-abc123    # dev VPC
  aws_instance.web = i-def456  # dev instance
}

terraform.workspace = "production"
state = {
  aws_vpc.main = vpc-xyz789    # production VPC
  aws_instance.web = i-ghi012  # production instance
}
```

**Cross-workspace references**: Sometimes you need to reference resources from another workspace. For example, a shared DNS zone that all environments use. Use terraform_remote_state:

```hcl
data "terraform_remote_state" "production" {
  backend = "s3"
  config = {
    bucket = "my-terraform-state"
    key    = "env:/production/terraform.tfstate"
    region = "us-east-1"
  }
}

output "production_vpc_id" {
  value = data.terraform_remote_state.production.outputs.vpc_id
}
```

This is useful for things like shared DNS zones or monitoring infrastructure that all environments need to reference. But use it sparingly because creating dependencies between workspaces reduces isolation. If the production state is damaged, environments that reference it will also fail.

**State locking**: With remote state, Terraform locks the workspace's state file during operations. Two people can work on different workspaces simultaneously. Two people cannot work on the same workspace simultaneously without coordination. This is a safety mechanism that prevents concurrent modifications from corrupting your infrastructure.

## Real Scenario: Managing Dev/Staging/Prod

Let us build a complete multi-environment setup using directories for isolation.

**Project structure**:

```
infrastructure/
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── ecs/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── rds/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── envs/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── terraform.tfvars
```

**The shared VPC module** (modules/vpc/main.tf):

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.name}-vpc"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.name}-public-${var.availability_zones[count.index]}"
    Environment = var.environment
  }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.name}-private-${var.availability_zones[count.index]}"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.name}-igw"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? 1 : 0
  domain = "vpc"

  tags = {
    Name = "${var.name}-nat-eip"
  }
}

resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "${var.name}-nat"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[0].id
    }
  }

  tags = {
    Name = "${var.name}-private-rt"
  }
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
```

**Environment configs**:

```hcl
# environments/dev/terraform.tfvars
name               = "myapp-dev"
environment        = "dev"
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a"]
public_subnet_cidrs  = ["10.0.1.0/24"]
private_subnet_cidrs = ["10.0.11.0/24"]
enable_nat_gateway = false

# environments/staging/terraform.tfvars
name               = "myapp-staging"
environment        = "staging"
vpc_cidr           = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24"]
enable_nat_gateway = true

# environments/production/terraform.tfvars
name               = "myapp-production"
environment        = "production"
vpc_cidr           = "10.2.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
private_subnet_cidrs = ["10.2.11.0/24", "10.2.12.0/24", "10.2.13.0/24"]
enable_nat_gateway = true
```

**CI/CD pipeline** that applies based on the branch:

```yaml
# .github/workflows/terraform.yml
name: Terraform
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  plan:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [dev, staging, production]
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        run: terraform init
        working-directory: envs/${{ matrix.environment }}

      - name: Terraform Plan
        run: terraform plan -no-color
        working-directory: envs/${{ matrix.environment }}

  apply:
    needs: plan
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    strategy:
      max-parallel: 1
      matrix:
        environment: [dev, staging, production]
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3

      - name: Terraform Apply
        run: terraform apply -auto-approve
        working-directory: envs/${{ matrix.environment }}
```

The max-parallel: 1 ensures environments deploy sequentially, dev first, then staging, then production. This prevents a breaking change from hitting all environments simultaneously.

## Workspace-Specific S3 Backend Configuration

When using workspaces with S3 backend, you need to configure the key path:

```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

Terraform automatically prepends env:/<workspace>/ to the key. So the default workspace uses env:/default/infrastructure/terraform.tfstate, staging uses env:/staging/infrastructure/terraform.tfstate, and production uses env:/production/infrastructure/terraform.tfstate.

## Limitations and Gotchas

**Workspace-specific values are limited**: terraform.workspace only gives you the workspace name. You cannot store arbitrary per-workspace configuration in the workspace itself. You still need variable files or local maps for complex configuration differences.

**No workspace-level locking**: Two people can work on the same workspace if they are using different machines with local state. Remote state with locking prevents this, but only if everyone uses the same backend.

**Destroy is workspace-scoped**: terraform destroy only destroys resources in the current workspace. This is the safety mechanism. You can destroy dev without touching production. But make sure you are in the right workspace before running it. Always run terraform workspace show first.

**State migration is manual**: If you need to move a resource from one workspace to another, you must use terraform state mv and specify the source and destination workspaces.

**Workspaces do not provide configuration isolation**: All workspaces use the same .tf files. If you need different provider configurations per environment, like different regions or different AWS accounts, you need directory-based separation or provider aliases.

## Assessment

**Lab Task 1** (35 minutes): Set up Terraform workspaces for three environments. Create a VPC configuration that uses terraform.workspace to vary instance types and subnet counts. Apply to all three workspaces and verify each workspace has independent state.

**Lab Task 2** (35 minutes): Convert the workspace-based setup to directory-based isolation. Create three separate directories with their own terraform.tfvars files. Each directory should call the same shared VPC module. Apply all three and verify they create separate VPCs with different CIDR blocks.

**Lab Task 3** (30 minutes): Write a GitHub Actions workflow that runs terraform plan for all three environments on pull requests and terraform apply sequentially on pushes to main. The workflow should use working-directory to target the correct environment directory.

**Grading Criteria**:
- Workspaces create independent state for each environment (20 points)
- Configuration correctly varies resource sizing based on workspace (20 points)
- Directory-based isolation produces separate VPCs with distinct CIDR blocks (20 points)
- Shared module is correctly referenced from all environment directories (20 points)
- CI/CD pipeline applies environments sequentially with proper working directories (20 points)

**Time Limit**: 100 minutes total

## Evidence

After completing this module, you should be able to:

- Create and switch between Terraform workspaces
- Use terraform.workspace to parameterize infrastructure per environment
- Configure workspace-specific variable files for environment differences
- Set up directory-based environment isolation as an alternative to workspaces
- Use terraform_remote_state to reference resources across workspaces
- Design CI/CD pipelines that deploy environments sequentially
- Understand the tradeoffs between workspace-based and directory-based isolation

**Artifact**: A Git repository with directory-based environment isolation (dev, staging, production), a shared VPC module, environment-specific variable files, and a CI/CD workflow that deploys environments in order with proper safeguards.
