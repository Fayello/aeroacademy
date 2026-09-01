# Module 3 — Terraform Modules

After writing Terraform configurations for a while, you notice patterns. Every project needs a VPC. Every environment needs a set of security groups. Every application needs an S3 bucket with specific policies and lifecycle rules. You could copy-paste these blocks between projects, but that is exactly the kind of repetition that causes problems. You update the VPC configuration in one project and forget to update it in five others. You fix a security group rule in one place but not the others. The inconsistencies multiply until nobody is sure which configuration is correct.

Terraform modules solve this by letting you package reusable infrastructure into composable building blocks. A module is just a directory with Terraform files that you can call from other configurations. It takes inputs, creates resources, and produces outputs. Think of it like a function in programming: you define it once and call it wherever you need it.

This module covers how to structure modules properly, define inputs and outputs with validation, publish and consume modules from registries, and build a reusable VPC module that you will use across multiple projects.

## Module Structure

A Terraform module is any directory that contains .tf files. The simplest module might look like this:

```
modules/
└── vpc/
    ├── main.tf
    ├── variables.tf
    ├── outputs.tf
    └── README.md
```

There is no special declaration needed. Any directory with Terraform files is a module. The convention is to separate your modules directory from your root configuration so that the module code is distinct from the configuration that uses it:

```
infrastructure/
├── main.tf              # Root module — calls child modules
├── variables.tf
├── outputs.tf
└── modules/
    ├── vpc/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── ecs-cluster/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── rds-postgres/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

The main.tf at the root is the entry point. It calls modules from the modules/ directory. Each module encapsulates a specific piece of infrastructure. The root module defines what goes into each child module and how they connect to each other.

**Why separate files?** Terraform does not care whether you put everything in one file or split it across many. But readability matters. When you are debugging a module at 3 AM during an incident, you want to find the resource definition quickly. Separate files by concern: resources in main.tf, inputs in variables.tf, outputs in outputs.tf, data sources in data.tf. This makes it obvious where to look when something goes wrong.

**Module sources**: When you call a module, you specify where it comes from. There are several options:

```hcl
# Local module (relative path from the root configuration)
module "vpc" {
  source = "./modules/vpc"
  # ...
}

# Remote module (Git URL with ref for version pinning)
module "vpc" {
  source = "git::https://github.com/company/terraform-modules.git//modules/vpc?ref=v1.2.0"
  # ...
}

# Terraform Registry module (public or private)
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"
  # ...
}

# S3 bucket (for distributing modules internally)
module "vpc" {
  source = "s3::https://my-bucket.s3.amazonaws.com/modules/vpc.zip"
  # ...
}
```

For most teams, the pattern is: private modules in a Git repository, consumed by path reference for internal modules or by Git URL for cross-team sharing. The Terraform Registry is excellent for public community modules.

## Inputs and Outputs

Modules communicate through inputs (variables) and outputs. A well-designed module has a clean interface. It accepts specific inputs and returns specific outputs without leaking internal details. The module user should not need to know which resources the module creates internally.

**Module variables** define what the caller must or can provide:

```hcl
# modules/vpc/variables.tf

variable "name" {
  description = "Name prefix for all VPC resources"
  type        = string

  validation {
    condition     = length(var.name) > 0 && length(var.name) <= 64
    error_message = "Name must be between 1 and 64 characters."
  }
}

variable "cidr_block" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.cidr_block, 0))
    error_message = "Must be a valid CIDR block."
  }
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)

  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least two availability zones are required for high availability."
  }
}

variable "enable_nat_gateway" {
  description = "Whether to create NAT gateways"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use a single NAT gateway (cost savings for non-production)"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

The default values make parameters optional. The validation blocks catch bad inputs before Terraform tries to create resources and produces cryptic errors. The description helps callers understand what each variable does and how to set it.

**Module outputs** expose information that the caller needs:

```hcl
# modules/vpc/outputs.tf

output "vpc_id" {
  description = "The ID of the created VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "The ID of the internet gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ips" {
  description = "Public IPs of the NAT gateways"
  value       = aws_eip.nat[*].public_ip
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "List of private route table IDs"
  value       = aws_route_table.private[*].id
}
```

Outputs are how the module communicates back to the caller. The caller accesses them with module.vpc.vpc_id, the module name prefixed with module. followed by the output name. Outputs are also displayed at the end of terraform apply, making it easy to see what was created.

**Calling a module** in a root configuration:

```hcl
# root main.tf

module "vpc" {
  source = "./modules/vpc"

  name               = "production"
  cidr_block         = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
  enable_nat_gateway = true
  single_nat_gateway = false

  tags = {
    Environment = "production"
    Team        = "platform"
  }
}

module "database" {
  source = "./modules/rds"

  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  instance_class     = "db.r5.large"
  engine             = "postgres"
  engine_version     = "15.4"
  allocated_storage  = 100
  multi_az           = true
}
```

The flow is: module vpc creates resources and outputs their IDs, module database receives those IDs as inputs and creates resources inside the VPC. This is how you compose infrastructure from building blocks. The modules do not need to know about each other. They communicate through their inputs and outputs.

## Module Composition Patterns

Real-world modules follow specific patterns that make them useful across projects.

**The wrapper pattern** is when you create a thin module that wraps a community or internal module, adding your organization's defaults:

```hcl
# modules/company-vpc/main.tf

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = var.name
  cidr = var.cidr_block

  azs             = var.availability_zones
  private_subnets = [for i, az in var.availability_zones : cidrsubnet(var.cidr_block, 8, i + 10)]
  public_subnets  = [for i, az in var.availability_zones : cidrsubnet(var.cidr_block, 8, i + 1)]

  enable_nat_gateway = var.enable_nat_gateway
  single_nat_gateway = var.single_nat_gateway

  # Company defaults that apply everywhere
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    ManagedBy   = "terraform"
    Company     = "acme"
  })
}
```

This gives your team a curated experience: the community module handles the complexity, your wrapper adds consistency. When the community module updates, you update the wrapper once and all teams benefit.

**The environment module pattern** creates a module that represents a complete environment:

```hcl
# modules/environment/main.tf

module "vpc" {
  source = "../vpc"
  name   = var.environment_name
  # ...
}

module "database" {
  source = "../rds"
  # ...
}

module "app_cluster" {
  source = "../ecs"
  # ...
}

module "monitoring" {
  source = "../monitoring"
  # ...
}
```

Now creating a complete environment is one module call:

```hcl
module "staging" {
  source = "./modules/environment"

  environment_name = "staging"
  vpc_cidr         = "10.1.0.0/16"
  # ...
}

module "production" {
  source = "./modules/environment"

  environment_name = "production"
  vpc_cidr         = "10.0.0.0/16"
  # ...
}
```

This pattern is powerful for organizations that want to standardize their infrastructure. Every team gets the same architecture, just with different parameters.

**The platform module pattern** is for organizations that have a single standard stack:

```hcl
# modules/platform/variables.tf

variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "container_image" {
  type = string
}

variable "container_port" {
  type    = number
  default = 8080
}

variable "desired_count" {
  type    = number
  default = 2
}
```

```hcl
# modules/platform/main.tf

locals {
  name_prefix = "${var.project}-${var.environment}"
}

module "networking" {
  source = "../vpc"
  name   = local.name_prefix
  # ...
}

module "cluster" {
  source = "../ecs"
  name   = local.name_prefix
  vpc_id = module.networking.vpc_id
  # ...
}

module "service" {
  source          = "../ecs-service"
  cluster_id      = module.cluster.id
  subnets         = module.networking.private_subnet_ids
  container_image = var.container_image
  container_port  = var.container_port
  desired_count   = var.desired_count
  # ...
}
```

## Module Registry

The Terraform Registry is a public directory of modules. Community modules are published there, and you can publish your own private modules using Terraform Cloud or a private registry.

**Using registry modules**:

```hcl
# AWS VPC module from the registry
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "my-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
}
```

Registry modules follow the standard interface. source specifies the module, version pins the version. The module documentation on the registry describes all inputs, outputs, and examples.

**Version pinning strategy**: Use pessimistic version constraints for safety:

```hcl
# Good: allows patch updates, prevents breaking changes
version = "~> 5.0"

# Good: exact version for critical infrastructure
version = "= 5.0.0"

# Bad: no version constraint means you will get breaking changes eventually
# version = "5.0.0"  # This pins to exactly 5.0.0, which is actually fine

# Bad: "latest" means you WILL get breaking changes
# version = "latest"
```

**Publishing private modules**: If your organization has internal modules, you can publish them to a private registry. Terraform Cloud supports this natively. For self-hosted setups, you can use a Git repository as a module source:

```hcl
module "internal-tool" {
  source = "git::ssh://git@github.com/company/terraform-modules.git//modules/internal-tool?ref=v2.1.0"
}
```

The ref parameter pins to a specific Git ref (tag, branch, or commit). Without it, you get the default branch, which is unpredictable and dangerous.

## Building a Reusable VPC Module

Let us build a complete, production-quality VPC module that you can use across projects. This module handles VPC creation, subnets, routing, NAT gateways, flow logs, and DNS.

**Directory structure**:

```
modules/vpc/
├── main.tf
├── variables.tf
├── outputs.tf
├── versions.tf
└── README.md
```

**versions.tf** — Required providers:

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}
```

**variables.tf** — All inputs with validation:

```hcl
variable "name" {
  description = "Name prefix for all resources"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.name))
    error_message = "Name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "cidr_block" {
  description = "CIDR block for the VPC"
  type        = string

  validation {
    condition     = can(cidrhost(var.cidr_block, 0))
    error_message = "Must be a valid CIDR block."
  }
}

variable "secondary_cidr_blocks" {
  description = "Additional CIDR blocks for the VPC"
  type        = list(string)
  default     = []
}

variable "availability_zones" {
  description = "Availability zones to use"
  type        = list(string)

  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least two AZs required for high availability."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in the VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in the VPC"
  type        = bool
  default     = true
}

variable "enable_nat_gateway" {
  description = "Enable NAT gateways for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use a single NAT gateway (cost savings)"
  type        = bool
  default     = false
}

variable "enable_flow_logs" {
  description = "Enable VPC flow logs"
  type        = bool
  default     = false
}

variable "flow_log_retention_days" {
  description = "CloudWatch log group retention in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}
```

**main.tf** — Resource definitions:

```hcl
locals {
  common_tags = merge(var.tags, {
    ManagedBy = "terraform"
    Module    = "vpc"
  })
}

resource "aws_vpc" "main" {
  cidr_block               = var.cidr_block
  secondary_cidr_blocks    = var.secondary_cidr_blocks
  enable_dns_hostnames     = var.enable_dns_hostnames
  enable_dns_support       = var.enable_dns_support

  tags = merge(local.common_tags, {
    Name = "${var.name}-vpc"
  })
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.name}-public-${var.availability_zones[count.index]}"
    Tier = "public"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.name}-private-${var.availability_zones[count.index]}"
    Tier = "private"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.name}-igw"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.name}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.name}-nat-eip-${count.index}"
  })
}

resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.name}-nat-${count.index}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "private" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = var.enable_nat_gateway ? (var.single_nat_gateway ? aws_nat_gateway.main[0].id : aws_nat_gateway.main[count.index].id) : null
  }

  tags = merge(local.common_tags, {
    Name = "${var.name}-private-rt-${count.index}"
  })
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Flow Logs (optional)
resource "aws_flow_log" "main" {
  count                = var.enable_flow_logs ? 1 : 0
  vpc_id               = aws_vpc.main.id
  traffic_type         = "ALL"
  iam_role_arn         = aws_iam_role.flow_log[0].arn
  log_destination      = aws_cloudwatch_log_group.flow_log[0].arn
  log_destination_type = "cloud-watch-logs"

  tags = merge(local.common_tags, {
    Name = "${var.name}-flow-log"
  })
}

resource "aws_cloudwatch_log_group" "flow_log" {
  count             = var.enable_flow_logs ? 1 : 0
  name              = "/aws/vpc/flow-log/${var.name}"
  retention_in_days = var.flow_log_retention_days
  tags              = local.common_tags
}

resource "aws_iam_role" "flow_log" {
  count = var.enable_flow_logs ? 1 : 0
  name  = "${var.name}-flow-log-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "flow_log" {
  count = var.enable_flow_logs ? 1 : 0
  name  = "${var.name}-flow-log-policy"
  role  = aws_iam_role.flow_log[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Effect   = "Allow"
      Resource = "*"
    }]
  })
}
```

**outputs.tf** — Export everything callers need:

```hcl
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "The primary CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_cidrs" {
  description = "CIDR blocks of public subnets"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "CIDR blocks of private subnets"
  value       = aws_subnet.private[*].cidr_block
}

output "internet_gateway_id" {
  description = "The ID of the internet gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ips" {
  description = "Public IPs of the NAT gateways"
  value       = aws_eip.nat[*].public_ip
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "List of private route table IDs"
  value       = aws_route_table.private[*].id
}
```

**Using the module** from a root configuration:

```hcl
# root main.tf

module "vpc" {
  source = "./modules/vpc"

  name               = "myapp-production"
  cidr_block         = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false
  enable_flow_logs   = true

  tags = {
    Environment = "production"
    Team        = "platform"
    CostCenter  = "engineering"
  }
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  subnet_id     = module.vpc.public_subnet_ids[0]
}
```

## Assessment

**Lab Task 1** (45 minutes): Create a reusable VPC module with variables for name, CIDR, availability zones, and subnet CIDRs. The module should create a VPC, public and private subnets, an internet gateway, NAT gateways, and route tables. Apply it with test values and verify all resources are created correctly.

**Lab Task 2** (30 minutes): Create a second module for an RDS PostgreSQL database that accepts a VPC ID and subnet IDs as inputs, creates a subnet group, security group, and the database instance. Call it from a root configuration that passes the VPC module's outputs.

**Lab Task 3** (30 minutes): Write a root configuration that uses both modules together. Apply it, verify the database is accessible from within the VPC, and confirm that the module outputs are referenced correctly using module.<name>.<output>.

**Grading Criteria**:
- Module accepts all required inputs with proper validation (20 points)
- Module creates all expected resources (VPC, subnets, gateways, route tables) (25 points)
- Module outputs expose all necessary attributes for other modules (20 points)
- Database module correctly uses VPC module outputs as inputs (20 points)
- Root configuration is clean, uses modules correctly, and applies without errors (15 points)

**Time Limit**: 105 minutes total

## Evidence

After completing this module, you should be able to:

- Structure Terraform modules with separate files for resources, variables, and outputs
- Define module inputs with types, descriptions, defaults, and validation rules
- Expose resource attributes through module outputs
- Call local and registry modules from a root configuration
- Reference module outputs using module.<name>.<attribute> syntax
- Build a reusable VPC module that works across multiple projects
- Understand when to use wrappers, environment modules, and platform modules

**Artifact**: A Git repository containing a reusable VPC module, an RDS module, and a root configuration that composes them together. The modules should have input validation, proper outputs, and apply successfully to create a working VPC with a database.
