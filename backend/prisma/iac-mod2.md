# Module 2 — Terraform Basics

Terraform is the tool most infrastructure engineers reach for when they need to provision and manage cloud resources. It is not the only option, but it is the one you will encounter most often in job descriptions, open-source projects, and production environments. Understanding how Terraform works, not just the syntax but the execution model, state management, and resource lifecycle, is essential for doing real infrastructure work.

This module covers HCL syntax in depth, how providers and resources work, the role of state in Terraform's execution model, and a complete walkthrough of creating an AWS VPC from scratch with production-quality configurations.

## HCL Syntax Deep Dive

HashiCorp Configuration Language is Terraform's configuration language. It is designed to be human-readable and writable while being precise enough for machines to parse. HCL looks like JSON's more readable cousin. It uses blocks, arguments, and expressions instead of pure key-value pairs.

**Blocks** group related configuration together. A block has a type, optional labels, and a body:

```hcl
resource "aws_instance" "web" {
  # block body
}
```

Here, resource is the block type, "aws_instance" is the first label, "web" is the second label, and everything between the braces is the body. The labels identify what kind of resource this is and what you are calling it in your configuration. You can reference this resource elsewhere as aws_instance.web.

**Arguments** assign a value to a name:

```hcl
instance_type = "t3.micro"
ami           = "ami-0c55b159cbfafe1f0"
```

The equals sign is required. Strings are in quotes. Numbers are bare. Booleans are true or false.

**Expressions** produce values. They can be simple literals, references to other objects, or function calls:

```hcl
cidr_block = var.vpc_cidr                                    # variable reference
vpc_id     = aws_vpc.main.id                                 # resource attribute reference
name       = "${var.environment}-web-${count.index + 1}"    # string interpolation
az         = data.aws_availability_zones.available.names[0]  # data source + indexing
```

References use dot notation. The resource aws_vpc.main exposes attributes like id, arn, cidr_block, and tags_all. You reference them with aws_vpc.main.id. This creates an implicit dependency: Terraform knows that the resource using this reference depends on aws_vpc.main and will create it first.

**Blocks inside blocks** create nested configuration. This nesting represents the relationship between resources and their sub-components:

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  ebs_block_device {
    device_name = "/dev/sdf"
    volume_size = 20
    volume_type = "gp3"

    tags = {
      Name = "web-data"
    }
  }
}
```

The ebs_block_device block is nested inside the resource block. This tells Terraform that the EBS volume belongs to the EC2 instance. If you remove the instance, the volume goes with it. This relationship is reflected in the Terraform state and in the execution plan.

**Meta-arguments** are special arguments that control how Terraform handles blocks. They are not resource-specific; they apply to any block type.

The count meta-argument creates multiple instances of the same resource:

```hcl
resource "aws_instance" "web" {
  count         = 3
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
}
```

This creates three identical instances. You reference them as aws_instance.web[0], aws_instance.web[1], and aws_instance.web[2]. When count is used, the resource becomes a list rather than a single object.

The for_each meta-argument creates instances from a map or set:

```hcl
resource "aws_instance" "web" {
  for_each = toset(["web-1", "web-2", "web-3"])
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  tags = {
    Name = each.key
  }
}
```

With for_each, you reference resources as aws_instance.web["web-1"], aws_instance.web["web-2"], etc. This is more flexible than count because each instance can have different attributes based on the map values.

The lifecycle meta-argument controls Terraform's behavior during changes:

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  lifecycle {
    create_before_destroy = true
    prevent_destroy       = false
    ignore_changes        = [tags]
    replace_triggered_by  = [aws_security_group.web.id]
  }
}
```

create_before_destroy creates the new resource before destroying the old one, preventing downtime. prevent_destroy prevents Terraform from destroying the resource even if you remove it from the configuration. ignore_changes tells Terraform to ignore specific attributes when planning changes. replace_triggered_by forces recreation when another resource changes.

**Variable types** allow you to parameterize your configurations:

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "staging"
}

variable "instance_count" {
  description = "Number of instances to create"
  type        = number
  default     = 2
}

variable "enable_monitoring" {
  description = "Enable detailed monitoring"
  type        = bool
  default     = true
}

variable "subnets" {
  description = "List of subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "staging"
    ManagedBy   = "terraform"
  }
}

variable "server_config" {
  description = "Server configuration"
  type = object({
    instance_type = string
    volume_size   = number
    ami_id        = string
  })
}
```

Variable validation prevents bad values from reaching your infrastructure:

```hcl
variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "instance_type" {
  type = string
  validation {
    condition     = can(regex("^t3\\.(micro|small|medium|large)$", var.instance_type))
    error_message = "Instance type must be t3.micro, t3.small, t3.medium, or t3.large."
  }
}
```

**Conditional expressions** let you make decisions:

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.environment == "production" ? "m5.large" : "t3.micro"
}

resource "aws_ebs_volume" "data" {
  size = var.environment == "production" ? 100 : 20
}
```

The syntax is condition ? true_value : false_value, similar to most programming languages.

**For expressions** transform collections:

```hcl
locals {
  # Create a map from a list of objects
  subnet_ids = { for s in aws_subnet.public : s.availability_zone => s.id }

  # Filter a list
  public_ips = [for i in aws_instance.web : i.public_ip if i.public_ip != ""]

  # Transform values
  upper_names = [for name in var.names : upper(name)]
}
```

**Dynamic blocks** generate repeated nested blocks:

```hcl
variable "ingress_rules" {
  default = [
    { port = 80, protocol = "tcp", cidr = "0.0.0.0/0" },
    { port = 443, protocol = "tcp", cidr = "0.0.0.0/0" },
  ]
}

resource "aws_security_group" "web" {
  name = "web-sg"
  vpc_id = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = ingress.value.protocol
      cidr_blocks = [ingress.value.cidr]
    }
  }
}
```

## Providers

Providers are plugins that Terraform uses to interact with cloud platforms, SaaS providers, and other APIs. Each provider offers a set of resource types and data sources. When you run terraform init, Terraform downloads the provider plugins you need.

**Configuring providers**:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}
```

The required_providers block tells Terraform which providers you need and what version constraints to use. The provider block configures the provider itself, such as which region to use.

**Multiple provider instances**: You can configure the same provider multiple times with different aliases. This is essential when you need resources in multiple regions or accounts:

```hcl
provider "aws" {
  region = "us-east-1"
  alias  = "primary"
}

provider "aws" {
  region = "us-west-2"
  alias  = "secondary"
}

resource "aws_vpc" "primary" {
  provider   = aws.primary
  cidr_block = "10.0.0.0/16"
}

resource "aws_vpc" "secondary" {
  provider   = aws.secondary
  cidr_block = "10.1.0.0/16"
}
```

Without the provider argument, resources use the default provider configuration, the one without an alias.

**Provider version constraints**: Always pin provider versions. A breaking change in a provider can destroy your infrastructure. Use the pessimistic constraint operator to allow patch updates but prevent minor or major changes:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"    # Allows 5.0, 5.1, 5.2 but not 6.0
    }
  }
}
```

Run terraform init -upgrade occasionally to update provider versions. Always test in staging first.

**Data sources** let Terraform read information from existing resources without managing them:

```hcl
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}
```

Data sources do not create or manage resources. They just read attributes from resources that already exist. This is useful for looking up AMI IDs, availability zones, account IDs, or any other information you need without hardcoding values.

Reference data sources like resources: data.aws_ami.ubuntu.id.

## Resources

Resources are the most important element in a Terraform configuration. Each resource block describes one or more infrastructure objects that Terraform will create, update, or destroy.

**Resource lifecycle**: Understanding how Terraform handles resource changes is critical for avoiding mistakes.

When you create a new resource, Terraform reads the current state, determines that the resource does not exist, plans the creation, creates the resource in the cloud, and updates the state with the new resource's attributes.

When you modify a resource configuration, Terraform reads the current state, compares it to the configuration, plans the necessary changes, applies the changes, and updates the state.

When you remove a resource from your configuration, Terraform detects the resource exists in state but not in configuration, plans the destruction, destroys the resource in the cloud, and removes it from state.

When you change a resource's identifier (like a name), Terraform may need to destroy and recreate it. This depends on whether the change is to an argument that can be updated in-place or one that requires replacement.

**Resource dependencies** are automatically inferred. If resource B references an attribute of resource A, like aws_subnet.main.vpc_id = aws_vpc.main.id, Terraform knows to create the VPC before the subnet. You can add explicit dependencies with depends_on, but this should be rare. If you find yourself using depends_on frequently, it usually means your configuration has a design issue.

**Resource attributes**: After creation, resources expose attributes that you can reference elsewhere:

```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public.id
}

output "instance_public_ip" {
  value = aws_instance.web.public_ip
}
```

Terraform's dependency graph ensures these resources are created in the correct order.

**Importing existing resources**: If you have infrastructure created outside Terraform, you can bring it under management:

```bash
terraform import aws_vpc.main vpc-0123456789abcdef0
```

After importing, you must have a corresponding resource block in your configuration. Terraform imports the resource into state and will then compare it to your configuration. If they do not match, the next terraform plan will show changes needed to make the configuration match the imported resource. If you do not have a resource block, Terraform will remove the resource from state on the next apply.

## State Management

Terraform state is the mechanism that maps your configuration to real-world resources. When Terraform creates a resource, it records the resource's ID and attributes in the state file. When you run terraform plan, Terraform reads the state, compares it to your configuration and the actual cloud resources, and determines what needs to change.

**Why state exists**: Terraform needs state to track which real-world resources correspond to which configuration blocks. Without state, Terraform would have no way to know that aws_instance.web in your configuration corresponds to i-0123456789abcdef0 in AWS. State is the mapping between code and reality.

**Local state**: By default, Terraform stores state in a file called terraform.tfstate in the current directory. This is fine for personal experiments but terrible for team work because only one person can modify infrastructure at a time, if the state file is lost Terraform loses track of all resources, and the state file may contain sensitive data like passwords and API keys that you do not want in version control.

**Remote state**: For real work, always use remote state. The most common setup is S3 with DynamoDB locking:

```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "production/vpc/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

The S3 backend stores state in an S3 bucket. The DynamoDB table provides state locking: when one person runs terraform apply, the state is locked and nobody else can modify it until the apply completes. This prevents concurrent modifications that could corrupt your infrastructure.

**State commands** for inspecting and manipulating state:

```bash
# Show all resources in state
terraform state list

# Show details of a specific resource
terraform state show aws_instance.web

# Move a resource (rename it in state)
terraform state mv aws_instance.web aws_instance.web_server

# Remove a resource from state without destroying it
terraform state rm aws_instance.web

# Import existing resource into state
terraform import aws_vpc.main vpc-0123456789abcdef0
```

**Sensitive data in state**: Terraform state contains all resource attributes, including sensitive ones like database passwords and access keys. If you store state in S3, encrypt the bucket. If you use Terraform Cloud, it encrypts state at rest. Never commit state files to Git. Add *.tfstate to your .gitignore file.

**State locking**: When working with remote state, Terraform automatically locks the state when you run apply or plan. If someone else is already running Terraform, you will see an error about acquiring the state lock. Wait for the other person to finish, or use terraform force-unlock LOCK_ID only if you are certain the lock is stale, for example if a previous apply crashed.

## Creating an AWS VPC: Complete Walkthrough

Let us build a production-ready VPC from scratch. This is not a toy example. It is the kind of VPC you would actually use in production, with proper variable validation, sensible defaults, and comprehensive output.

**Project structure**:

```
vpc/
├── main.tf
├── variables.tf
├── outputs.tf
├── vpc.tf
├── subnets.tf
├── routing.tf
└── terraform.tfvars
```

**variables.tf** — Define all inputs with validation:

```hcl
variable "project_name" {
  description = "Project name used for resource naming"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "Must be a valid CIDR block."
  }
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]

  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least two availability zones are required."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use a single NAT Gateway instead of one per AZ"
  type        = bool
  default     = false
}
```

**vpc.tf** — The VPC and subnets:

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc"
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
    Name        = "${var.project_name}-${var.environment}-public-${var.availability_zones[count.index]}"
    Tier        = "public"
    Environment = var.environment
  }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.project_name}-${var.environment}-private-${var.availability_zones[count.index]}"
    Tier        = "private"
    Environment = var.environment
  }
}
```

**routing.tf** — Internet access and NAT:

```hcl
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-igw"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-${var.environment}-nat-eip-${count.index}"
  }
}

resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.project_name}-${var.environment}-nat-${count.index}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "private" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = var.single_nat_gateway ? aws_nat_gateway.main[0].id : aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-private-rt-${count.index}"
  }
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

**outputs.tf** — Export useful information:

```hcl
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ips" {
  description = "Public IPs of the NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}
```

**terraform.tfvars**:

```hcl
project_name = "myapp"
environment  = "prod"
vpc_cidr     = "10.0.0.0/16"

availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

enable_nat_gateway = true
single_nat_gateway = false
```

**Deploy**:

```bash
terraform init
terraform validate
terraform plan -out=vpc.tfplan
terraform apply vpc.tfplan
```

After apply, Terraform outputs the VPC ID, subnet IDs, and NAT gateway IPs. Other Terraform configurations can reference these outputs to deploy resources into this VPC.

**Destroy** when you are done testing:

```bash
terraform destroy
```

This removes all resources managed by this Terraform configuration. Terraform shows you what it will destroy and asks for confirmation.

## Assessment

**Lab Task 1** (40 minutes): Write a complete Terraform configuration that creates a VPC with three public subnets across three availability zones, an internet gateway, and route tables. Apply it, verify the resources exist in the AWS Console, then destroy everything. Verify destruction.

**Lab Task 2** (35 minutes): Extend the VPC configuration to include three private subnets, NAT gateways (one per AZ), and appropriate route tables. The private subnets should have internet access through the NAT gateways but should not be directly reachable from the internet.

**Lab Task 3** (30 minutes): Configure Terraform remote state using an S3 bucket and DynamoDB table. Migrate your local state to remote state using terraform init -migrate-state. Verify the state file appears in the S3 bucket.

**Grading Criteria**:
- VPC and subnets provisioned correctly with proper CIDR blocks (25 points)
- Routing configuration allows internet access for public subnets (20 points)
- NAT gateways provide outbound internet for private subnets (20 points)
- Remote state properly configured with state locking (15 points)
- All resources properly tagged with project and environment (10 points)
- Code is clean, formatted, and uses variables appropriately (10 points)

**Time Limit**: 105 minutes total

## Evidence

After completing this module, you should be able to:

- Write HCL syntax including blocks, arguments, expressions, and meta-arguments
- Configure multiple provider instances for multi-region deployments
- Use data sources to look up existing resource information
- Explain Terraform's state management model and configure remote state in S3
- Build a production-ready AWS VPC with public and private subnets
- Use conditional logic and loops to create variable numbers of resources
- Apply, plan, and destroy Terraform configurations confidently

**Artifact**: A Git repository with a complete VPC configuration that uses remote state, includes input validation, outputs useful values, and provisions a multi-AZ VPC with public and private subnets.
