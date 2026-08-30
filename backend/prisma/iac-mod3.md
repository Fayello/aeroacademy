# Module 3 — Terraform Modules

## What You'll Actually Do

You'll refactor a flat Terraform configuration into reusable modules. You'll build a module that creates a VPC with subnets, call it twice for different environments, and publish it to a local registry. The goal is to stop copy-pasting infrastructure code.

## Why Modules

After about 200 lines of Terraform, your `main.tf` becomes a wall of text. Modules let you break it into logical pieces with clear interfaces.

Think of a module as a function. It takes inputs (variables), produces outputs, and encapsulates complexity. You don't need to know how the VPC module works — you just call it with a CIDR block and get a VPC back.

```hcl
# Without modules — everything in one file
resource "aws_vpc" "main" { ... }
resource "aws_subnet" "public_a" { ... }
resource "aws_subnet" "public_b" { ... }
resource "aws_subnet" "private_a" { ... }
resource "aws_subnet" "private_b" { ... }
resource "aws_internet_gateway" "main" { ... }
resource "aws_nat_gateway" "main" { ... }
# ... 200 more lines

# With modules — clean and composable
module "vpc" {
  source = "./modules/vpc"

  cidr_block = "10.0.0.0/16"
  env        = "production"
}
```

## Writing a Module

A module is just a directory with `.tf` files. The directory structure:

```
modules/
  vpc/
    main.tf
    variables.tf
    outputs.tf
```

```hcl
# modules/vpc/variables.tf
variable "cidr_block" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "env" {
  description = "Environment name"
  type        = string
}

variable "enable_nat" {
  description = "Whether to create a NAT gateway"
  type        = bool
  default     = false
}
```

```hcl
# modules/vpc/main.tf
resource "aws_vpc" "this" {
  cidr_block = var.cidr_block

  tags = {
    Name        = "${var.env}-vpc"
    Environment = var.env
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.cidr_block, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.env}-public-${count.index + 1}"
  }
}
```

```hcl
# modules/vpc/outputs.tf
output "vpc_id" {
  value = aws_vpc.this.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}
```

## Calling Modules

From your root configuration, you call the module by its source path.

```hcl
module "vpc_production" {
  source = "./modules/vpc"

  cidr_block = "10.0.0.0/16"
  env        = "production"
  enable_nat = true
}

module "vpc_staging" {
  source = "./modules/vpc"

  cidr_block = "10.1.0.0/16"
  env        = "staging"
  enable_nat = false
}
```

Access module outputs with `module.<name>.<output>`:

```hcl
output "prod_vpc_id" {
  value = module.vpc_production.vpc_id
}
```

## Module Sources

Modules can come from multiple places:

```hcl
# Local path
source = "./modules/vpc"

# Terraform Registry
source = "terraform-aws-modules/vpc/aws"
version = "5.1.0"

# Git repository
source = "git::https://github.com/org/terraform-modules.git//vpc?ref=v1.2.0"

# HTTP URL
source = "https://example.com/modules/vpc.zip"
```

For team work, start with local paths. Move to a private registry or Git repo when you need to share across projects.

## Composition

The real power of modules is composition — building complex infrastructure from simple pieces.

```hcl
module "networking" {
  source = "./modules/vpc"
  # ...
}

module "compute" {
  source = "./modules/ecs-cluster"

  vpc_id         = module.networking.vpc_id
  subnet_ids     = module.networking.public_subnet_ids
}

module "database" {
  source = "./modules/rds"

  vpc_id         = module.networking.vpc_id
  subnet_ids     = module.networking.private_subnet_ids
}
```

Each module does one thing. The root configuration wires them together.

## Assessment

**Lab Task**: Create a module called `file-generator` in `modules/file-generator/` that takes a `files` variable (map of filename to content) and creates local files for each entry. Write a root `main.tf` that calls this module twice — once for a `config/` directory (3 config files) and once for a `docs/` directory (2 documentation files). Use `terraform plan` to verify both module calls produce the expected resources.

**Time**: 35 minutes

**Grading**:
- Module directory structure is correct with variables.tf, main.tf, outputs.tf (20 points)
- Module correctly creates files from map variable (25 points)
- Root configuration calls module twice with different inputs (25 points)
- `terraform plan` shows all 5 files from both module calls (30 points)

## Evidence

- Directory listing showing `modules/file-generator/` structure
- `terraform plan` output showing all 5 resources (files)
- The root `main.tf` and `modules/file-generator/` files committed
