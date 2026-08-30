# Module 4 — Terraform Workspaces

## What You'll Actually Do

You'll set up separate workspaces for dev, staging, and production. You'll apply the same configuration to each workspace and see how state isolation keeps environments from clobbering each other. You'll also learn when workspaces are the right tool and when they're not.

## The Problem

You have one Terraform configuration for a web application. You need three environments: dev, staging, and production. Each environment needs its own set of resources with different sizes and settings.

The naive approach is three separate directories with copy-pasted code. That's maintenance hell — change the VPC CIDR in one place, remember to change it in the other two.

Workspaces let you use the same configuration with different state files. Each workspace has its own state, so `terraform apply` in the dev workspace touches dev resources, and `terraform apply` in production touches production resources.

## Creating and Switching Workspaces

```bash
# List existing workspaces
terraform workspace list

# Create a new workspace
terraform workspace new dev

# Create another
terraform workspace new staging

# Create production
terraform workspace new production

# Switch between them
terraform workspace select dev
```

## Using Workspace Variables

The `terraform.workspace` variable tells you which workspace is active. Use it to differentiate resources.

```hcl
variable "instance_type" {
  type = map(string)
  default = {
    dev        = "t3.micro"
    staging    = "t3.small"
    production = "t3.large"
  }
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.instance_type[terraform.workspace]

  tags = {
    Name = "web-${terraform.workspace}"
  }
}
```

You can also use workspace-specific variable files.

```bash
# Create variable files for each environment
cat > dev.tfvars <<EOF
instance_type = "t3.micro"
db_size       = "db.t3.micro"
EOF

cat > staging.tfvars <<EOF
instance_type = "t3.small"
db_size       = "db.t3.small"
EOF

cat > production.tfvars <<EOF
instance_type = "t3.large"
db_size       = "db.r5.large"
EOF

# Apply with the right variable file
terraform workspace select dev
terraform apply -var-file=dev.tfvars

terraform workspace select production
terraform apply -var-file=production.tfvars
```

## State Isolation

Each workspace maintains its own state file. This is the key property. When you switch workspaces, Terraform swaps the state file behind the scenes.

```bash
terraform workspace list
# * dev
#   staging
#   production

terraform state list
# Shows resources in the CURRENT workspace only

terraform workspace select production
terraform state list
# Different resources — production's resources
```

This means you can safely `terraform destroy` in dev without touching production.

## When Not to Use Workspaces

Workspaces are convenient for simple cases but have real limitations:

- **No separate access controls**: Anyone who can apply dev can apply production (same state backend, same credentials).
- **No separate variable files by default**: You need external tooling to manage tfvars per workspace.
- **Shared state backend**: A backend failure affects all workspaces.
- **No workspace-level locking**: Two people can't safely work in the same workspace simultaneously without external locking.

For production setups, most teams prefer separate directories or separate state backends per environment. Workspaces work well for personal dev/testing or very small teams.

## Assessment

**Lab Task**: Create three workspaces: `dev`, `staging`, and `production`. Use a configuration that creates local files with workspace-specific content — each workspace should produce a `config/<workspace>.json` file with settings appropriate for that environment (e.g., dev: minimal resources, production: full resources). Apply in each workspace, verify each workspace has its own files, then destroy one workspace without affecting the others.

**Time**: 30 minutes

**Grading**:
- Three workspaces created and selectable (15 points)
- Configuration uses `terraform.workspace` to differentiate environments (30 points)
- Each workspace creates its own set of files (25 points)
- Destroying one workspace leaves the others intact (30 points)

## Evidence

- `terraform workspace list` showing all three workspaces
- `terraform state list` output from each workspace showing different resources
- Screenshot of files created for each workspace
- `terraform destroy` output from dev workspace, followed by state list from production showing resources still exist
