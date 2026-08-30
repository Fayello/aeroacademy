# Module 5 — Pulumi

## What You'll Actually Do

You'll write infrastructure using TypeScript or Python instead of HCL. You'll create a Pulumi project, define resources with real programming constructs (loops, conditionals, functions), and deploy it. The goal is to see when a general-purpose language beats a DSL.

## Why Pulumi

Terraform's HCL is powerful but limited. When you need complex logic — dynamic resource creation based on input, string manipulation, conditional resource creation based on computed values — HCL gets awkward. Pulumi lets you use TypeScript, Python, Go, or C# instead.

```hcl
# Terraform — limited logic
dynamic "ingress" {
  for_each = var.ports
  content {
    from_port = ingress.value
    to_port   = ingress.value
    protocol  = "tcp"
  }
}
```

```typescript
// Pulumi — full programming language
const ports = [80, 443, 8080];
ports.forEach(port => {
  new aws.ec2.SecurityGroupRule(`ingress-${port}`, {
    type: "ingress",
    fromPort: port,
    toPort: port,
    protocol: "tcp",
    cidrBlocks: ["0.0.0.0/0"],
    securityGroupId: sg.id,
  });
});
```

## Getting Started

```bash
# Install Pulumi CLI
curl -fsSL https://get.pulumi.com | sh

# Create a new project
pulumi new aws-typescript

# Or with Python
pulumi new aws-python
```

## Defining Resources

Pulumi resources look like regular code because they are.

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Create a VPC
const vpc = new aws.ec2.Vpc("main", {
  cidrBlock: "10.0.0.0/16",
  tags: { Name: "main-vpc" },
});

// Create subnets using array iteration
const subnetCidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"];

const subnets = subnetCidrs.map((cidr, i) =>
  new aws.ec2.Subnet(`subnet-${i + 1}`, {
    vpcId: vpc.id,
    cidrBlock: cidr,
    availabilityZone: `us-east-1${String.fromCharCode(97 + i)}`,
    tags: { Name: `subnet-${i + 1}` },
  })
);

// Export outputs
export const vpcId = vpc.id;
export const subnetIds = subnets.map(s => s.id);
```

## Loops and Conditionals

This is where Pulumi shines. Real loops, real conditionals, no workarounds.

```typescript
// Conditional resource creation
const enableMonitoring = true;

if (enableMonitoring) {
  new aws.cloudwatch.MetricAlarm("cpu-high", {
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "CPUUtilization",
    namespace: "AWS/EC2",
    period: 300,
    statistic: "Average",
    threshold: 80,
  });
}

// Loop with dynamic values
const environments = {
  dev: { instanceType: "t3.micro", count: 1 },
  staging: { instanceType: "t3.small", count: 2 },
  production: { instanceType: "t3.large", count: 3 },
};

Object.entries(environments).forEach(([name, config]) => {
  for (let i = 0; i < config.count; i++) {
    new aws.ec2.Instance(`web-${name}-${i + 1}`, {
      instanceType: config.instanceType,
      ami: "ami-0c55b159cbfafe1f0",
      tags: { Name: `web-${name}-${i + 1}`, Environment: name },
    });
  }
});
```

## Stack References

Pulumi projects can reference outputs from other projects.

```typescript
import * as pulumi from "@pulumi/pulumi";

// Reference a stack that was deployed separately
const networkStack = new pulumi.StackReference("organization/networking/production");

const vpcId = networkStack.getOutput("vpcId");
const subnetIds = networkStack.getOutput("subnetIds");
```

## Pulumi vs Terraform

| Aspect | Terraform | Pulumi |
|--------|-----------|--------|
| Language | HCL (DSL) | TypeScript, Python, Go, C# |
| Logic | Limited dynamic blocks | Full programming language |
| Testing | `terraform validate` | Language-native test frameworks |
| Ecosystem | Massive provider library | Growing, uses Terraform providers |
| Learning curve | HCL syntax | Already know the language |
| State | File or remote backend | Pulumi Cloud or self-managed |

Use Terraform when your team knows HCL and the infrastructure is straightforward. Use Pulumi when you need complex logic, dynamic resource creation, or your team prefers writing code over DSLs.

## Assessment

**Lab Task**: Create a Pulumi project (TypeScript or Python) that generates a file-based "infrastructure" representing a three-tier application. Create directories for web, api, and db tiers. Each tier should have a config file whose contents vary based on environment variables or program logic (e.g., web tier gets 2 servers in dev, 5 in production). Use loops to generate the resources. Export the full file paths as stack outputs.

**Time**: 40 minutes

**Grading**:
- Pulumi project initializes and `pulumi up` succeeds (20 points)
- Three tier directories created with correct config files (25 points)
- Resource counts vary based on logic (30 points)
- Stack outputs show all created file paths (25 points)

## Evidence

- `pulumi up` output showing resources created
- Stack outputs showing file paths
- The Pulumi project files (`Pulumi.yaml`, `index.ts` or `__main__.py`) committed
