# Module 5 — Pulumi

Terraform's HCL is powerful, but it is a domain-specific language with limitations. When you need complex logic like loops over dynamic data, conditional resource creation based on API calls, or integration with your organization's internal systems, HCL starts to feel constraining. You find yourself writing null_resource blocks with local-exec provisioners to do things that would be a three-line function in any programming language.

Pulumi takes a fundamentally different approach: it lets you write infrastructure as code in TypeScript, Python, Go, C#, or Java. You get the full power of a general-purpose programming language. Real loops, real conditionals, real functions, real type checking, and access to the entire package ecosystem of your chosen language. If you need to call an API, parse JSON, query a database, or do any other complex logic as part of your infrastructure deployment, Pulumi makes it straightforward.

This module covers Pulumi's core concepts, how to use the TypeScript and Python SDKs, state management, and a complete deployment scenario.

## Pulumi Concepts

Pulumi shares several concepts with Terraform but implements them differently in ways that matter for real projects.

**Programs vs Templates**: A Pulumi program is code written in your chosen language. It runs and produces a description of the desired infrastructure. A Pulumi template is a starter project that you use to bootstrap new programs. When you run pulumi new, it scaffolds a project with the right directory structure, dependency files, and boilerplate code.

**Resources**: Like Terraform, Pulumi manages resources. But instead of HCL blocks, you instantiate resource objects:

```typescript
// TypeScript
import * as aws from "@pulumi/aws";

const vpc = new aws.ec2.Vpc("main", {
  cidrBlock: "10.0.0.0/16",
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    Name: "production-vpc",
  },
});
```

```python
# Python
import pulumi
import pulumi_aws as aws

vpc = aws.ec2.Vpc("main",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        "Name": "production-vpc",
    })
```

The first argument to every resource constructor is the resource name, a logical identifier used in the state file. The second argument is the resource arguments. The third argument, which is optional, is options that control dependencies, providers, and other metadata.

**Stacks**: A Pulumi stack is an independent instance of a program. Similar to Terraform workspaces, stacks let you deploy the same program to different environments. Each stack has its own state, its own configuration, and its own set of resources. You create stacks with pulumi stack init and switch between them with pulumi stack select.

**Project**: A Pulumi project is a directory containing a Pulumi.yaml file that describes the program and its runtime:

```yaml
# Pulumi.yaml for TypeScript
name: infrastructure
runtime: nodejs
description: Production infrastructure
```

```yaml
# Pulumi.yaml for Python
name: infrastructure
runtime: python
description: Production infrastructure
```

The project file also specifies the main entry point if it is not the default index.ts or __main__.py.

**Components**: Pulumi components are reusable packages of infrastructure. They are classes that extend pulumi.ComponentResource. Components let you encapsulate complex infrastructure patterns into simple, reusable units:

```typescript
import * as pulumi from "@pulumi/pulumi";

class Vpc extends pulumi.ComponentResource {
  public vpc: aws.ec2.Vpc;
  public publicSubnets: aws.ec2.Subnet[];
  public privateSubnets: aws.ec2.Subnet[];

  constructor(name: string, args: VpcArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:network:Vpc", name, {}, opts);

    this.vpc = new aws.ec2.Vpc(`${name}-vpc`, {
      cidrBlock: args.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    }, { parent: this });

    this.publicSubnets = args.publicSubnets.map((cidr, i) =>
      new aws.ec2.Subnet(`${name}-public-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: args.availabilityZones[i],
        mapPublicIpOnLaunch: true,
      }, { parent: this })
    );

    this.privateSubnets = args.privateSubnets.map((cidr, i) =>
      new aws.ec2.Subnet(`${name}-private-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: args.availabilityZones[i],
      }, { parent: this })
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map(s => s.id),
      privateSubnetIds: this.privateSubnets.map(s => s.id),
    });
  }
}
```

Components are the building blocks for creating your own reusable modules. They are similar to Terraform modules but have the advantage of being real code with proper encapsulation.

## TypeScript SDK

Pulumi's TypeScript support is the most mature. You write standard TypeScript, use the Pulumi SDK packages, and Pulumi handles the infrastructure deployment. The TypeScript SDK provides type safety, autocompletion in your editor, and access to the full Node.js ecosystem.

**Setup**:

```bash
# Install Pulumi CLI
curl -fsSL https://get.pulumi.com | sh

# Create a new project
mkdir infrastructure && cd infrastructure
pulumi new aws-typescript

# Select a stack name (e.g., dev, staging, production)
```

**Complete VPC example in TypeScript**:

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const environment = config.require("environment");
const vpcCidr = config.get("vpcCidr") || "10.0.0.0/16";
const availabilityZones = config.require("availabilityZones").split(",");

const vpc = new aws.ec2.Vpc("main", {
  cidrBlock: vpcCidr,
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    Name: `${environment}-vpc`,
    Environment: environment,
  },
});

const igw = new aws.ec2.InternetGateway("main", {
  vpcId: vpc.id,
  tags: {
    Name: `${environment}-igw`,
  },
});

const publicSubnets: aws.ec2.Subnet[] = [];
const privateSubnets: aws.ec2.Subnet[] = [];

for (let i = 0; i < availabilityZones.length; i++) {
  const publicSubnet = new aws.ec2.Subnet(`public-${i}`, {
    vpcId: vpc.id,
    cidrBlock: `10.0.${i + 1}.0/24`,
    availabilityZone: availabilityZones[i],
    mapPublicIpOnLaunch: true,
    tags: {
      Name: `${environment}-public-${availabilityZones[i]}`,
      Tier: "public",
    },
  });
  publicSubnets.push(publicSubnet);

  const privateSubnet = new aws.ec2.Subnet(`private-${i}`, {
    vpcId: vpc.id,
    cidrBlock: `10.0.${i + 10}.0/24`,
    availabilityZone: availabilityZones[i],
    tags: {
      Name: `${environment}-private-${availabilityZones[i]}`,
      Tier: "private",
    },
  });
  privateSubnets.push(privateSubnet);
}

const publicRt = new aws.ec2.RouteTable("public", {
  vpcId: vpc.id,
  routes: [{
    cidrBlock: "0.0.0.0/0",
    gatewayId: igw.id,
  }],
  tags: {
    Name: `${environment}-public-rt`,
  },
});

for (let i = 0; i < publicSubnets.length; i++) {
  new aws.ec2.RouteTableAssociation(`public-${i}`, {
    subnetId: publicSubnets[i].id,
    routeTableId: publicRt.id,
  });
}

const eip = new aws.ec2.Eip("nat", {
  domain: "vpc",
  tags: {
    Name: `${environment}-nat-eip`,
  },
});

const nat = new aws.ec2.NatGateway("main", {
  allocationId: eip.allocationId,
  subnetId: publicSubnets[0].id,
  tags: {
    Name: `${environment}-nat`,
  },
});

const privateRt = new aws.ec2.RouteTable("private", {
  vpcId: vpc.id,
  routes: [{
    cidrBlock: "0.0.0.0/0",
    natGatewayId: nat.id,
  }],
  tags: {
    Name: `${environment}-private-rt`,
  },
});

for (let i = 0; i < privateSubnets.length; i++) {
  new aws.ec2.RouteTableAssociation(`private-${i}`, {
    subnetId: privateSubnets[i].id,
    routeTableId: privateRt.id,
  });
}

const webSg = new aws.ec2.SecurityGroup("web", {
  vpcId: vpc.id,
  description: "Web server security group",
  ingress: [
    {
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      description: "HTTPS",
    },
    {
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      description: "HTTP",
    },
  ],
  egress: [{
    fromPort: 0,
    toPort: 0,
    protocol: "-1",
    cidrBlocks: ["0.0.0.0/0"],
  }],
  tags: {
    Name: `${environment}-web-sg`,
  },
});

export const vpcId = vpc.id;
export const publicSubnetIds = publicSubnets.map(s => s.id);
export const privateSubnetIds = privateSubnets.map(s => s.id);
```

**Outputs** are exported from the program using the export keyword. Pulumi captures them and stores them in the stack's state. You retrieve them with pulumi stack output vpcId.

**Components** let you encapsulate reusable infrastructure patterns:

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

interface WebAppArgs {
  name: string;
  vpcId: pulumi.Input<string>;
  subnets: pulumi.Input<string>[];
  containerImage: pulumi.Input<string>;
  containerPort: number;
  desiredCount: number;
}

class WebApp extends pulumi.ComponentResource {
  public readonly albDns: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;

  constructor(name: string, args: WebAppArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:app:WebApp", name, {}, opts);

    const sg = new aws.ec2.SecurityGroup(`${name}-sg`, {
      vpcId: args.vpcId,
      ingress: [
        { fromPort: args.containerPort, toPort: args.containerPort, protocol: "tcp", cidrBlocks: ["0.0.0.0/0"] },
      ],
      egress: [{ fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] }],
    }, { parent: this });

    const alb = new aws.elasticloadbalancingv2.LoadBalancer(`${name}-alb`, {
      securityGroups: [sg.id],
      subnets: args.subnets,
    }, { parent: this });

    const tg = new aws.elasticloadbalancingv2.TargetGroup(`${name}-tg`, {
      port: args.containerPort,
      protocol: "HTTP",
      vpcId: args.vpcId,
      targetType: "ip",
    }, { parent: this });

    new aws.elasticloadbalancingv2.Listener(`${name}-listener`, {
      loadBalancerArn: alb.arn,
      port: 80,
      defaultActions: [{ type: "forward", targetGroupArn: tg.arn }],
    }, { parent: this });

    const cluster = new aws.ecs.Cluster(`${name}-cluster`, {}, { parent: this });

    this.albDns = alb.dnsName;
    this.clusterName = cluster.name;

    this.registerOutputs({
      albDns: alb.dnsName,
      clusterName: cluster.name,
    });
  }
}

// Use the component
const app = new WebApp("myapp", {
  name: "myapp",
  vpcId: vpc.id,
  subnets: publicSubnets.map(s => s.id),
  containerImage: "myapp:latest",
  containerPort: 8080,
  desiredCount: 2,
});

export const appUrl = app.albDns;
```

Components are the Pulumi equivalent of Terraform modules. They provide encapsulation, reuse, and a clean interface for complex infrastructure patterns.

**Testing Pulumi programs**:

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as assert from "assert";

// Mock the Pulumi runtime for unit testing
pulumi.runtime.setMocks({
    newResource: (type: string, name: string, inputs: any) => {
        return { id: `${name}-id`, state: inputs };
    },
    call: (token: string, inputs: any) => {
        return inputs;
    },
});

describe("Vpc", () => {
    it("should create VPC with correct CIDR", () => {
        const vpc = new aws.ec2.Vpc("test", {
            cidrBlock: "10.0.0.0/16",
        });
        pulumi.output(vpc.cidrBlock).apply(cidr => {
            assert.equal(cidr, "10.0.0.0/16");
        });
    });
});
```

```typescript
const config = new pulumi.Config();

// Plain config value
const environment = config.require("environment");

// Secret config value (encrypted in state)
const dbPassword = config.requireSecret("dbPassword");

// Use secrets in resources
const db = new aws.rds.Instance("postgres", {
  password: dbPassword,
  // ...
});
```

Set config values from the CLI:

```bash
pulumi config set environment production
pulumi config set --secret dbPassword "supersecret123"
```

Config is stored in Pulumi.<stack-name>.yaml, which should be committed to Git. Secrets in the config file are encrypted.

## Python SDK

Pulumi's Python SDK follows the same patterns as TypeScript but uses Python syntax. It is excellent for teams that already write Python and want to use the same language for infrastructure.

**Setup**:

```bash
pulumi new aws-python
```

**Complete VPC example in Python**:

```python
import pulumi
import pulumi_aws as aws

config = pulumi.Config()
environment = config.require("environment")
vpc_cidr = config.get("vpc-cidr") or "10.0.0.0/16"
availability_zones = config.require("availability-zones").split(",")

vpc = aws.ec2.Vpc("main",
    cidr_block=vpc_cidr,
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        "Name": f"{environment}-vpc",
        "Environment": environment,
    })

igw = aws.ec2.InternetGateway("main",
    vpc_id=vpc.id,
    tags={
        "Name": f"{environment}-igw",
    })

public_subnets = []
private_subnets = []

for i, az in enumerate(availability_zones):
    public_subnet = aws.ec2.Subnet(f"public-{i}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i + 1}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={
            "Name": f"{environment}-public-{az}",
            "Tier": "public",
        })
    public_subnets.append(public_subnet)

    private_subnet = aws.ec2.Subnet(f"private-{i}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i + 10}.0/24",
        availability_zone=az,
        tags={
            "Name": f"{environment}-private-{az}",
            "Tier": "private",
        })
    private_subnets.append(private_subnet)

public_rt = aws.ec2.RouteTable("public",
    vpc_id=vpc.id,
    routes=[{
        "cidr_block": "0.0.0.0/0",
        "gateway_id": igw.id,
    }],
    tags={
        "Name": f"{environment}-public-rt",
    })

for i, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(f"public-{i}",
        subnet_id=subnet.id,
        route_table_id=public_rt.id)

eip = aws.ec2.Eip("nat",
    domain="vpc",
    tags={
        "Name": f"{environment}-nat-eip",
    })

nat = aws.ec2.NatGateway("main",
    allocation_id=eip.allocation_id,
    subnet_id=public_subnets[0].id,
    tags={
        "Name": f"{environment}-nat",
    })

private_rt = aws.ec2.RouteTable("private",
    vpc_id=vpc.id,
    routes=[{
        "cidr_block": "0.0.0.0/0",
        "nat_gateway_id": nat.id,
    }],
    tags={
        "Name": f"{environment}-private-rt",
    })

for i, subnet in enumerate(private_subnets):
    aws.ec2.RouteTableAssociation(f"private-{i}",
        subnet_id=subnet.id,
        route_table_id=private_rt.id)

pulumi.export("vpc_id", vpc.id)
pulumi.export("public_subnet_ids", [s.id for s in public_subnets])
pulumi.export("private_subnet_ids", [s.id for s in private_subnets])
```

Python advantage: If your team already writes Python, Pulumi's Python SDK is immediately accessible. You can use standard Python testing frameworks, linters, and type checkers. You can import your organization's existing Python libraries for API calls, data processing, or configuration management.

## State Management

Pulumi manages state similarly to Terraform but uses a different architecture.

**Pulumi Cloud**: The default state backend. Free for individual use, paid for teams. State is stored encrypted in Pulumi's cloud service. You can also self-host with Pulumi Cloud.

**Self-hosted backends**: Use AWS S3, Azure Blob Storage, Google Cloud Storage, or any S3-compatible object store:

```yaml
# Pulumi.yaml
backend:
  url: s3://my-pulumi-state?region=us-east-1
```

**State commands**:

```bash
# Show current stack's state
pulumi stack

# List all stacks
pulumi stack ls

# Import existing resources
pulumi import aws:vpc:Vpc main vpc-0123456789abcdef0

# Move resources
pulumi state mv aws:ec2:Instance/web aws:ec2:Instance/web-server

# Remove resources from state
pulumi state rm aws:ec2:Instance/web
```

**Secrets management**: Pulumi encrypts secrets in state by default. When you use config.requireSecret(), the value is encrypted before storage. Pulumi supports multiple encryption providers:

- Default: Pulumi Cloud-managed encryption
- AWS KMS: Use a KMS key you control
- GCP KMS: Use a Cloud KMS key
- Azure Key Vault: Use an Azure Key Vault key
- passphrase: Local passphrase-based encryption for self-managed backends

## Real Scenario: Deploying with Pulumi

Let us build a complete web application stack: VPC, ECS cluster, RDS database, and an application load balancer.

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const environment = config.require("environment");
const containerImage = config.require("containerImage");
const dbPassword = config.requireSecret("dbPassword");

const vpc = new aws.ec2.Vpc("main", {
  cidrBlock: "10.0.0.0/16",
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: { Name: `${environment}-vpc` },
});

const publicSubnet = new aws.ec2.Subnet("public", {
  vpcId: vpc.id,
  cidrBlock: "10.0.1.0/24",
  availabilityZone: "us-east-1a",
  mapPublicIpOnLaunch: true,
  tags: { Name: `${environment}-public` },
});

const igw = new aws.ec2.InternetGateway("main", {
  vpcId: vpc.id,
  tags: { Name: `${environment}-igw` },
});

const publicRt = new aws.ec2.RouteTable("public", {
  vpcId: vpc.id,
  routes: [{ cidrBlock: "0.0.0.0/0", gatewayId: igw.id }],
  tags: { Name: `${environment}-public-rt` },
});

new aws.ec2.RouteTableAssociation("public", {
  subnetId: publicSubnet.id,
  routeTableId: publicRt.id,
});

const albSg = new aws.ec2.SecurityGroup("alb", {
  vpcId: vpc.id,
  ingress: [
    { fromPort: 80, toPort: 80, protocol: "tcp", cidrBlocks: ["0.0.0.0/0"] },
    { fromPort: 443, toPort: 443, protocol: "tcp", cidrBlocks: ["0.0.0.0/0"] },
  ],
  egress: [{ fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] }],
  tags: { Name: `${environment}-alb-sg` },
});

const ecsSg = new aws.ec2.SecurityGroup("ecs", {
  vpcId: vpc.id,
  ingress: [{ fromPort: 8080, toPort: 8080, protocol: "tcp", securityGroups: [albSg.id] }],
  egress: [{ fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] }],
  tags: { Name: `${environment}-ecs-sg` },
});

const dbSg = new aws.ec2.SecurityGroup("db", {
  vpcId: vpc.id,
  ingress: [{ fromPort: 5432, toPort: 5432, protocol: "tcp", securityGroups: [ecsSg.id] }],
  tags: { Name: `${environment}-db-sg` },
});

const alb = new aws.elasticloadbalancingv2.LoadBalancer("main", {
  securityGroups: [albSg.id],
  subnets: [publicSubnet.id],
  tags: { Name: `${environment}-alb` },
});

const targetGroup = new aws.elasticloadbalancingv2.TargetGroup("app", {
  port: 8080,
  protocol: "HTTP",
  vpcId: vpc.id,
  targetType: "ip",
  healthCheck: {
    path: "/health",
    interval: 30,
    timeout: 5,
    healthyThreshold: 3,
    unhealthyThreshold: 3,
  },
});

new aws.elasticloadbalancingv2.Listener("http", {
  loadBalancerArn: alb.arn,
  port: 80,
  defaultActions: [{
    type: "forward",
    targetGroupArn: targetGroup.arn,
  }],
});

const subnetGroup = new aws.rds.SubnetGroup("main", {
  subnetIds: [publicSubnet.id],
  tags: { Name: `${environment}-db-subnet-group` },
});

const database = new aws.rds.Instance("postgres", {
  identifier: `${environment}-postgres`,
  engine: "postgres",
  engineVersion: "15.4",
  instanceClass: "db.t3.micro",
  allocatedStorage: 20,
  dbName: "myapp",
  username: "admin",
  password: dbPassword,
  dbSubnetGroupName: subnetGroup.name,
  vpcSecurityGroupIds: [dbSg.id],
  skipFinalSnapshot: environment !== "production",
  tags: { Name: `${environment}-postgres` },
});

const cluster = new aws.ecs.Cluster("main", {
  name: `${environment}-cluster`,
  settings: [{
    name: "containerInsights",
    value: "enabled",
  }],
});

export const albDns = alb.dnsName;
export const dbEndpoint = database.address;
export const clusterName = cluster.name;
```

**Deploy and manage**:

```bash
pulumi up       # Deploy
pulumi destroy  # Teardown
pulumi stack    # Show state
```

## Assessment

**Lab Task 1** (45 minutes): Set up a Pulumi project in TypeScript that creates a VPC with public subnets, an internet gateway, and route tables. Use pulumi.Config to parameterize the environment name and VPC CIDR. Deploy to a stack called dev and verify resources in the AWS Console.

**Lab Task 2** (30 minutes): Add a security group and an EC2 instance to the Pulumi program. Use TypeScript for loops to create multiple subnets and instances. Deploy and verify.

**Lab Task 3** (30 minutes): Create a second stack called production with different configuration values. Deploy both stacks and verify they create separate infrastructure. Export the VPC IDs from both stacks.

**Grading Criteria**:
- VPC and subnets created correctly with proper CIDR blocks (25 points)
- TypeScript code uses loops and conditionals for dynamic resource creation (20 points)
- Configuration is parameterized with pulumi.Config (20 points)
- Multiple stacks create independent infrastructure (20 points)
- Code is clean, properly typed, and outputs are exported (15 points)

**Time Limit**: 105 minutes total

## Evidence

After completing this module, you should be able to:

- Set up Pulumi projects in TypeScript and Python
- Use Pulumi's resource model to create and manage AWS infrastructure
- Parameterize deployments using pulumi.Config and secrets
- Create and manage multiple stacks for environment isolation
- Use programming language features for dynamic infrastructure
- Export and retrieve stack outputs
- Understand Pulumi's state management and encryption model

**Artifact**: A Pulumi TypeScript project that deploys a VPC with subnets, a security group, and EC2 instances across two stacks with different configurations.
