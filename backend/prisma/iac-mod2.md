# Module 2 — Terraform Basics

## What You'll Actually Do

You'll write a Terraform configuration that provisions real cloud resources — a VPC, subnets, and an EC2 instance on AWS (or a模拟 equivalent using LocalStack if you don't have AWS credentials). You'll work with providers, understand what state actually contains, and learn the core workflow commands by heart.

## Providers

A provider is Terraform's plugin for talking to a specific API. AWS, Azure, GCP, GitHub, Cloudflare — they all have providers. You declare which ones you need at the top of your configuration.

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

The `required_providers` block locks the provider version. Without it, a future breaking change could silently break your infrastructure. Always pin versions.

When you run `terraform init`, Terraform downloads the provider binary and sets up the backend. You run this once per project, not every time.

```bash
terraform init
# Initializes the working directory
# Downloads providers
# Sets up state backend
```

## Resources

Resources are the actual infrastructure objects — servers, networks, databases, DNS records. Every resource has a type and a local name.

```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "main-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"

  tags = {
    Name = "public-subnet"
  }
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public.id

  tags = {
    Name = "web-server"
  }
}
```

Notice how `aws_subnet.public` references `aws_vpc.main.id`. Terraform builds a dependency graph automatically. It knows to create the VPC first, then the subnet, then the instance. You rarely need to use `depends_on` explicitly.

## Data Sources

Not everything needs to be created. Sometimes you need to look up existing resources. Data sources let you query your cloud provider for information.

```hcl
data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  owners = ["099720109477"]
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
}
```

Data sources are read-only. They don't create or modify anything. They're how you avoid hardcoding values that might change.

## Output

Outputs are the values Terraform prints after applying. They're also how you pass data between configurations.

```hcl
output "instance_public_ip" {
  value = aws_instance.web.public_ip
}

output "vpc_id" {
  value = aws_vpc.main.id
}
```

```bash
terraform apply
# ...
# Apply complete! Resources: 3 added, 0 changed, 0 destroyed.
#
# Outputs:
#
# instance_public_ip = "52.14.23.101"
# vpc_id = "vpc-0abc123def456"
```

## State

When you run `terraform apply`, Terraform writes a JSON file called `terraform.tfstate`. This file maps your configuration to real-world resource IDs. Without it, Terraform has no idea what it already created.

```bash
terraform state list
# aws_instance.web
# aws_subnet.public
# aws_vpc.main

terraform state show aws_instance.web
# Shows all attributes of the instance
```

Never edit the state file by hand. Use `terraform state` commands to manipulate it if needed. Never commit state files to git — they often contain secrets like passwords and API keys.

## The Core Workflow

```bash
# 1. Initialize
terraform init

# 2. Plan — see what will change
terraform plan

# 3. Apply — make the changes
terraform apply

# 4. Destroy — tear it all down when done
terraform destroy
```

`terraform plan` is your safety net. Always run it before apply. Read the output. Know what's being created, changed, or destroyed.

## Assessment

**Lab Task**: Write a Terraform configuration that provisions a local file structure simulating a production environment: create a `terraform-infra/` directory with three files (`vpc.tf`, `subnet.tf`, `instance.tf`) using `local_file` resources. Each file should contain a comment describing what it represents. Add a `variables.tf` with a variable for the environment name (default: "dev") and an `outputs.tf` that outputs the full path to each created file. Apply, verify, change the variable to "staging", apply again with `terraform plan` to see the differences.

**Time**: 30 minutes

**Grading**:
- Terraform initializes without errors (15 points)
- Three files created in `terraform-infra/` with correct comments (25 points)
- Variables and outputs work correctly (25 points)
- Changing the variable triggers a correct plan showing file changes (35 points)

## Evidence

- `terraform plan` output before variable change
- `terraform plan` output after variable change
- All `.tf` files committed to repository
- Screenshot showing the three created files exist on disk
