# Module 7 — Infrastructure as Code with Terraform

**Course:** DevOps & Platform Engineering | **Path:** DevOps (7 of 10)

---

## What You'll Actually Do

You'll provision cloud infrastructure with code — servers, networks, databases — version controlled, repeatable, and destroyable.

---

## Terraform Basics

```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "eu-west-1"
  }
}

provider "aws" {
  region = "eu-west-1"
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  tags = { Name = "web-server" }
}

resource "aws_security_group" "web" {
  name = "web-sg"
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

---

## Commands

```bash
terraform init      # Download providers
terraform plan      # Preview changes
terraform apply     # Apply changes
terraform destroy   # Destroy infrastructure
terraform state list  # List managed resources
```

---

## State Management

```text
State tracks what resources exist
Store state remotely (S3, Terraform Cloud)
Never commit state to git
Use workspaces for environments
```

---

## Modules

```hcl
module "vpc" {
  source = "./modules/vpc"
  cidr_block = "10.0.0.0/16"
}

module "web" {
  source = "./modules/ec2"
  vpc_id = module.vpc.vpc_id
}
```

---

## Assessment

**Lab task (25 min):**

1. Write Terraform to create an EC2 instance
2. Add a security group
3. Use variables and outputs
4. Create a module
5. Destroy infrastructure

**Grading:**
- EC2 created: 20%
- Security group: 20%
- Variables/outputs: 20%
- Module created: 20%
- Destroy working: 20%

---

## Evidence

- **OutcomeEvidence:** `DEV-LO7 — Infrastructure as Code`
