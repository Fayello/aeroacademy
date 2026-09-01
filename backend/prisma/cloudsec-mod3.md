# Module 3: Network Security in the Cloud

## Why Traditional Network Security Thinking Fails in the Cloud

On-premises, you had a clear network perimeter. The firewall sat at the edge. Traffic coming in went through it. Traffic going out went through it. Inside the perimeter, you had a flat or segmented network, and you relied on internal firewalls, VLANs, and access control lists for east-west traffic. The mental model was castle and moat.

Cloud networking obliterates that model. There is no perimeter in the traditional sense. Every AWS service is an API endpoint accessible over the internet. Your VPC (Virtual Private Cloud) is a logical isolation boundary, not a physical one. Traffic between AWS services can stay entirely on the AWS backbone, never touching the public internet. The "inside" and "outside" distinction is gone.

Effective cloud network security requires a fundamentally different approach. You do not protect a perimeter. You protect every individual resource with layered controls. You assume the network is hostile. You encrypt everything. You verify every request. This module covers the network security controls available in cloud environments and how to use them properly.

## VPC Architecture: The Foundation of Cloud Network Security

A VPC is your private network in the cloud. It has an IP address range (CIDR block), subnets, route tables, internet gateways, and optional VPN connections to your on-premises network. How you design your VPC determines your security posture.

### VPC Design Principles

**Principle 1: Start with a /16 CIDR block.** A /16 gives you 65,536 IP addresses across 256 possible /24 subnets. Even if you do not need them all now, running out of IP space in a VPC is painful. AWS allows you to add secondary CIDR blocks to a VPC, but it is simpler to start with enough space.

**Principle 2: Use separate subnets for each function.** At minimum, you need:
- Public subnets (for resources that need internet access, like load balancers)
- Private subnets (for application servers, databases, internal services)
- Isolated subnets (for resources that should have no internet connectivity, like database replicas used for disaster recovery)

**Principle 3: One subnet equals one Availability Zone.** Each subnet exists in exactly one AZ. Designing for multi-AZ means deploying subnets in at least two AZs for redundancy.

**Principle 4: Spread subnets across AZs.** If you have three AZs in a region, deploy subnets in all three. Use an Application Load Balancer or Network Load Balancer to distribute traffic across AZs. This gives you fault tolerance: if one AZ goes down, traffic shifts to the remaining AZs.

### Route Tables

Route tables control traffic routing within your VPC. Each subnet is associated with a route table. A route table contains routes that match destination CIDR ranges to targets (internet gateways, NAT gateways, VPC peering connections, Transit Gateways).

**Public subnet route table:**
| Destination | Target |
|-------------|--------|
| 10.0.0.0/16 | local |
| 0.0.0.0/0 | igw-xxxxxxxxxxxx |

The `local` route is always present and cannot be modified. It enables communication within the VPC. The 0.0.0.0/0 route sends all internet-bound traffic to the internet gateway, making the subnet public.

**Private subnet route table:**
| Destination | Target |
|-------------|--------|
| 10.0.0.0/16 | local |
| 0.0.0.0/0 | nat-xxxxxxxxxxxx |

The NAT gateway allows instances in private subnets to reach the internet (for updates, API calls) without allowing inbound connections from the internet.

**Important:** NAT gateways are not free. They cost roughly $32/month plus data processing charges. If you do not need outbound internet access for a private subnet, do not create a NAT gateway route.

### Internet Gateways and NAT Gateways

An internet gateway is a horizontally scaled, redundant, and highly available VPC component that allows communication between your VPC and the internet. It is attached to your VPC and provides a target for 0.0.0.0/0 routes in your public subnet route tables.

A NAT gateway enables instances in private subnets to initiate outbound connections to the internet while preventing inbound connections from the internet. NAT gateways are regional resources; a NAT gateway in us-east-1 can serve private subnets in us-east-1 but not in us-west-2.

### Network ACLs vs Security Groups

AWS provides two levels of network filtering: Security Groups (stateful) and Network ACLs (stateless). Understanding the difference and when to use each is fundamental to cloud network security.

**Security Groups** operate at the instance (ENI) level. They are stateful: if you allow inbound traffic on port 443, the return traffic is automatically allowed outbound, regardless of outbound rules. Security groups reference other security groups as sources or destinations, which is useful for tiered architectures.

**Network ACLs** operate at the subnet level. They are stateless: if you allow inbound traffic on port 443, you must also explicitly allow the return traffic on the ephemeral port range (1024-65535). NACLs use numbered rules processed in order (lowest number first). Once a rule matches, evaluation stops.

**Best practice:** Use security groups as your primary firewall. Security groups are stateful, easier to manage, and support references to other security groups. Use NACLs only for explicit deny rules (blocking specific IP addresses or CIDR ranges) or for subnet-level controls that apply to all instances in a subnet.

### Security Group Design Patterns

**Pattern 1: Service-oriented security groups.** Create a security group for each service. An ALB security group allows inbound 443 from 0.0.0.0/0 and outbound to the application security group. An application security group allows inbound 8080 from the ALB security group and outbound to the database security group. A database security group allows inbound 5432 from the application security group only.

**Pattern 2: Least privilege per service.** Each security group should allow only the traffic that service needs. The application needs to reach port 5432 on the database, not port 22, not port 80, not port 8080.

**Pattern 3: Reference security groups instead of IP addresses.** When possible, use security group references as the source in another security group rule. This is more maintainable than IP-based rules and automatically updates when instances are added or removed.

## VPC Peering and Transit Gateway

### VPC Peering

VPC peering connects two VPCs via a private connection. Traffic between peered VPCs stays on the AWS private network. VPC peering can connect VPCs in the same account or different accounts, and in the same or different regions.

**Limitations of VPC peering:**
- No transitive routing: if VPC A is peered with VPC B, and VPC B is peered with VPC C, VPC A cannot reach VPC C through VPC B
- Non-overlapping CIDR blocks: peered VPCs cannot have overlapping IP ranges
- No edge-to-edge routing through an internet gateway or VPN: traffic from a VPC peering connection cannot be routed through a VPN connection to on-premises

**When to use peering:** Simple topologies where a small number of VPCs need to communicate. Two or three VPCs, direct connections, no complex routing requirements.

### Transit Gateway

Transit Gateway is a network hub that connects VPCs and on-premises networks through a single gateway. Instead of creating individual peering connections between VPCs (which becomes unmanageable at scale), you attach each VPC to the Transit Gateway and configure routing at the Transit Gateway level.

**Advantages over peering:**
- Transitive routing: if VPC A and VPC B are both attached to a Transit Gateway, they can communicate through it
- Centralized routing: route tables on the Transit Gateway control traffic flow
- Simplified management: one attachment per VPC instead of N-1 peering connections
- Support for VPN connections to on-premises networks

**When to use Transit Gateway:** More than three VPCs, hybrid architectures with on-premises connectivity, or when you need transitive routing between VPCs.

**Security consideration:** Transit Gateway route tables can restrict which VPCs can communicate. Create separate route tables for different security zones. For example, a "production" route table that only includes production VPC attachments, and a "development" route table that only includes development VPC attachments. Do not use the default route table (which allows communication between all attachments) in production.

## PrivateLink and VPC Endpoints

PrivateLink enables private connectivity between VPCs and AWS services (or your own services) without exposing traffic to the public internet. VPC endpoints use PrivateLink under the hood.

### Gateway Endpoints

Gateway endpoints are free and provide a target for routes to specific AWS services. You can create gateway endpoints for S3 and DynamoDB. When a gateway endpoint is configured, traffic to S3 or DynamoDB from your VPC stays on the AWS network.

**Configuration:**
1. Create a gateway endpoint in your VPC
2. Add a route to your route table: destination is the service's IP prefix, target is the endpoint
3. Optionally, attach a endpoint policy that restricts which resources can use the endpoint

**Endpoint policy example (restricting to a specific bucket):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAccessToSpecificBucket",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::my-private-bucket",
        "arn:aws:s3:::my-private-bucket/*"
      ]
    }
  ]
}
```

### Interface Endpoints

Interface endpoints create an Elastic Network Interface (ENI) in your subnet with a private IP address. Traffic to the endpoint's private DNS name routes to this ENI instead of the public internet. Interface endpoints are available for most AWS services (EC2 Systems Manager, ECR, Secrets Manager, SQS, SNS, KMS, etc.).

**Interface endpoint policy:** Similar to gateway endpoints, you can attach a policy that restricts which actions can be performed through the endpoint.

**Cost consideration:** Interface endpoints cost approximately $7/month per AZ, plus data processing charges. If you are using many AWS services, the cost adds up. Use gateway endpoints for S3 and DynamoDB (they are free) and selectively deploy interface endpoints for services where private connectivity is critical.

### AWS PrivateLink for Your Own Services

If you have services that need to be shared across VPCs or accounts, you can publish them using AWS PrivateLink. This involves creating a Network Load Balancer in front of your service and registering it as a PrivateLink endpoint. Consumers in other VPCs or accounts can then access your service privately without VPC peering.

## Real Scenario: Network Segmentation Preventing Lateral Movement

In 2022, a financial services company running on AWS experienced a breach where an attacker gained initial access through a compromised developer workstation. The attacker obtained AWS credentials from the developer's local machine (credentials stored in plaintext in `~/.aws/credentials`) and began reconnaissance.

The attacker discovered the developer's IAM user had access to an EC2 instance running a development application in the dev account. The attacker assumed the developer's credentials and began interacting with the dev environment.

However, the company's network architecture prevented lateral movement:

**VPC Design:**
- Production VPC (10.0.0.0/16): three AZs, private subnets only for application and database tiers
- Development VPC (10.1.0.0/16): separate VPC with public subnets for developer access
- No peering between production and development VPCs
- Transit Gateway with route tables that prevent development-to-production routing

**Security Group Architecture:**
- Dev ALB security group: allows inbound 443 from 0.0.0.0/0, outbound to dev-app only
- Dev application security group: allows inbound 8080 from dev-alb only, outbound to dev-db only
- Dev database security group: allows inbound 5432 from dev-app only, no outbound
- Production security groups: completely separate, no references to dev security groups

**What the attacker tried:**
1. Accessed the dev application via the developer's credentials: succeeded
2. Attempted to scan production VPC from the dev instance: failed (no route from dev VPC to production VPC)
3. Attempted to assume a role in the production account: failed (IAM trust policy only allows assume-role from specific roles, not from arbitrary principals)
4. Attempted to access S3 buckets in production: failed (cross-account bucket policies deny access from dev account)
5. Attempted to access RDS in production: failed (production security group allows inbound only from production app security group)

**What saved the company:**
- Separate VPCs with no peering or Transit Gateway route between them
- Separate AWS accounts for dev and production
- IAM trust policies that restrict cross-account assume-role
- Security groups that reference only local security groups, not IP ranges
- No shared S3 bucket policies between dev and production

The attacker was contained within the development VPC. The company detected the unusual access patterns through GuardDuty (dev instance accessing unusual services) and revoked the developer's credentials within two hours. The production environment was never reached.

**Key lesson:** Network segmentation in the cloud is not about firewalls at the perimeter. It is about separate VPCs, separate accounts, restrictive route tables, security groups that do not share references between environments, and IAM trust policies that prevent cross-environment access.

## Advanced Network Security Controls

### AWS Network Firewall

AWS Network Firewall is a managed service that provides stateful inspection, intrusion prevention, and web filtering for VPC traffic. It operates at the subnet level through Gateway Load Balancer endpoints.

**Use cases:**
- Centralized inspection of traffic between VPCs
- Inspection of traffic leaving the VPC to the internet
- Deep packet inspection for specific protocols
- IP-based blocking at the VPC level

**Architecture:** Deploy Network Firewall in a centralized "inspection VPC." Route traffic from spoke VPCs through the inspection VPC using Transit Gateway. Network Firewall inspects the traffic and allows or blocks it based on stateful rules.

### VPC Flow Logs

VPC flow logs capture information about IP traffic going to and from network interfaces in your VPC. Flow logs are stored in CloudWatch Logs or S3 and are essential for network monitoring, forensics, and troubleshooting.

**What flow logs capture:**
- Source and destination IP addresses
- Source and destination ports
- Protocol
- Bytes transferred
- Action (ACCEPT or REJECT)
- Subnet ID and ENI ID

**Flow log format (default):**
```
version account-id interface-id srcaddr dstaddr srcport dstport protocol packets bytes start end action log-status
```

**Example analysis:** Query flow logs in CloudWatch Logs Insights to find rejected traffic:
```sql
fields @timestamp, srcAddr, dstAddr, srcPort, dstPort, action
| filter action = "REJECT"
| sort @timestamp desc
| limit 100
```

This query shows the most recent rejected connections, which may indicate reconnaissance or misconfigured security groups.

### AWS Shield and WAF

AWS Shield Standard provides basic DDoS protection for all AWS customers. Shield Advanced provides enhanced protection for your applications running on AWS, with 24/7 access to the DDoS Response Team (DRT).

AWS WAF (Web Application Firewall) protects web applications from common web exploits. WAF rules can be based on IP addresses, HTTP headers, HTTP body, URI strings, SQL injection patterns, and cross-site scripting patterns.

**WAF integration with ALB:**
1. Create a Web ACL in WAF
2. Add rules (managed rule groups like AWSManagedRulesCommonRuleSet, or custom rules)
3. Associate the Web ACL with your Application Load Balancer
4. Traffic to the ALB is inspected by WAF before reaching your application

**AWS Managed Rules** include rule groups for common threats: SQL injection, cross-site scripting, known bad inputs, IP reputation lists, and bot control. Use these as a baseline and add custom rules for your specific application.


## VPC Design Patterns for Security

Good VPC design is the foundation of cloud network security. The patterns you choose at the beginning determine your security posture for years to come.

### The Three-Tier VPC Pattern

The three-tier pattern creates separate subnets for the web tier, application tier, and database tier. Each tier has its own security group. Traffic flows from the web tier to the application tier to the database tier. The database tier has no internet connectivity and cannot initiate connections to the application tier.

This pattern works for most web applications. The web tier (ALB, CloudFront) sits in public subnets. The application tier (EC2, Lambda, containers) sits in private subnets. The database tier (RDS, DynamoDB VPC endpoint) sits in isolated subnets with no route to the internet.

**Web tier security group:** Allows inbound 443 from 0.0.0.0/0. Allows outbound 8080 to the application security group only.

**Application tier security group:** Allows inbound 8080 from the web security group only. Allows outbound 5432 to the database security group only.

**Database tier security group:** Allows inbound 5432 from the application security group only. No outbound rules (the database does not need to initiate connections).

### The Spoke-and-Hub Pattern

The spoke-and-hub pattern uses a Transit Gateway as the hub and multiple VPCs as spokes. Each spoke VPC represents a different environment (production, development, staging) or a different application. The hub provides shared services (DNS, VPN, direct connect) and controls routing between spokes.

This pattern is essential for organizations with multiple teams or multiple applications. Each team gets their own VPC with full control over their resources. The hub controls which VPCs can communicate with each other. The production VPC cannot communicate with the development VPC. The development VPC can communicate with a shared services VPC for logging and monitoring.

**Transit Gateway route table design:** Create separate route tables for different security zones. A production route table includes only production VPC attachments. A development route table includes only development VPC attachments. A shared services route table includes all VPC attachments. Do not use the default route table (which allows communication between all attachments) in production.

### The Isolated VPC Pattern

The isolated VPC pattern creates VPCs with no internet connectivity at all. These VPCs are used for workloads that should never communicate with the internet: database replicas for disaster recovery, sensitive data processing, or compliance-restricted workloads.

Isolated VPCs have no internet gateway, no NAT gateway, and no VPN connections. They can only be accessed through VPC peering or Transit Gateway from other VPCs in your network. This provides the strongest possible network isolation for sensitive workloads.

## AWS Network Firewall Deep Dive

AWS Network Firewall provides stateful inspection, intrusion prevention, and web filtering for VPC traffic. It operates at the subnet level through Gateway Load Balancer endpoints.

### Architecture

Deploy Network Firewall in a centralized inspection VPC. Route traffic from spoke VPCs through the inspection VPC using Transit Gateway. Network Firewall inspects the traffic and allows or blocks it based on stateful rules.

The architecture requires three VPCs: the spoke VPC (where your workloads run), the inspection VPC (where Network Firewall runs), and optionally a shared services VPC. Transit Gateway routes traffic from the spoke VPC to the inspection VPC. Network Firewall inspects the traffic. Allowed traffic is forwarded to its destination. Blocked traffic is dropped.

### Stateful Rule Groups

Network Firewall stateful rule groups track the state of network connections. They can inspect HTTP traffic, TLS traffic, and IP-based traffic. Stateful rules can match on:

- Source and destination IP addresses
- Source and destination ports
- Protocol
- HTTP headers, methods, and URIs
- TLS SNI (Server Name Indication)
- Detection signatures for known threats

### Suricata Rules

Network Firewall supports Suricata-compatible rule syntax. Suricata is an open-source intrusion detection engine. You can write custom Suricata rules or use managed rule groups from AWS and third-party vendors.

Example Suricata rule that blocks access to a specific domain:
```
alert dns any any -> any any (msg:"Block access to malicious domain"; dns.query; content:"malicious-domain.com"; nocase; sid:1000001; rev:1;)
```

Example Suricata rule that detects SQL injection attempts in HTTP traffic:
```
alert http any any -> any any (msg:"SQL injection attempt"; http.uri; content:"SELECT"; nocase; http.uri; content:"UNION"; nocase; sid:1000002; rev:1;)
```

## VPC Endpoints Deep Dive

VPC endpoints allow you to connect to AWS services without using the internet. They come in two types: gateway endpoints and interface endpoints.

### Gateway Endpoints

Gateway endpoints are free and provide a target for routes to S3 and DynamoDB. When a gateway endpoint is configured, traffic to S3 or DynamoDB from your VPC stays on the AWS private network.

Gateway endpoints are regional. A gateway endpoint in us-east-1 serves VPCs in us-east-1. If you have VPCs in multiple regions, you need gateway endpoints in each region.

Gateway endpoint policies restrict which resources can use the endpoint. Without a policy, all resources in the VPC can use the endpoint. With a policy, you can restrict access to specific IAM roles, specific S3 buckets, or specific DynamoDB tables.

### Interface Endpoints

Interface endpoints create an Elastic Network Interface (ENI) in your subnet with a private IP address. Traffic to the endpoint's private DNS name routes to this ENI instead of the public internet. Interface endpoints are available for most AWS services.

Interface endpoints have security groups. Configure the security group to allow only the traffic that your workloads need. For example, allow only HTTPS (port 443) from the application subnet to the interface endpoint.

Interface endpoints support Private DNS. When Private DNS is enabled, the standard AWS service DNS name (for example, secretsmanager.us-east-1.amazonaws.com) resolves to the interface endpoint's private IP address. This means your application code does not need to change to use interface endpoints.

### VPC Endpoint Policies

VPC endpoint policies restrict which actions can be performed through the endpoint. Without a policy, all actions on the target service are allowed through the endpoint.

A restrictive endpoint policy for Secrets Manager limits access to specific secrets:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/*"
    }
  ]
}
```

This policy allows only GetSecretValue on secrets with the prod prefix. All other Secrets Manager actions (CreateSecret, DeleteSecret, PutSecretValue) are denied through this endpoint. Even if an IAM policy allows these actions, the endpoint policy blocks them.

## Assessment

**Lab Task 1 (60 minutes):** Design a VPC architecture for a three-tier web application with the following requirements: high availability across three AZs, public-facing web tier, application tier with no public internet access, database tier with no internet access at all, ability to deploy updates from the internet to the application tier. Create a diagram showing subnets, route tables, security groups, and data flow. Implement at least one endpoint (S3 gateway endpoint or interface endpoint for Secrets Manager).

**Lab Task 2 (45 minutes):** Configure VPC flow logs for a VPC and analyze them using CloudWatch Logs Insights. Write three queries: one to find the top 10 source IPs by traffic volume, one to find all rejected connections on port 22 (SSH), and one to find connections between two specific subnets. Interpret the results and identify any security concerns.

**Lab Task 3 (60 minutes):** Set up AWS WAF on an Application Load Balancer. Create a Web ACL with at least three rules: a rate-based rule to limit request rate per IP, a managed rule group for SQL injection protection, and a custom rule that blocks requests with a specific URI path. Test each rule by sending requests that should be blocked and verifying the blocking behavior through WAF logs.

**Grading Criteria:**
- VPC design: does the architecture meet all requirements with proper segmentation? (30%)
- Flow log analysis: are the queries correct and do the results reveal actionable findings? (25%)
- WAF configuration: do the rules effectively block the intended traffic without false positives? (25%)
- Documentation quality: is the architecture well-documented and justifiable? (20%)

## Evidence

Save the following as evidence:
1. VPC architecture diagram and security group configuration (Task 1)
2. CloudWatch Logs Insights query results and security analysis (Task 2)
3. WAF Web ACL configuration, test results, and WAF log excerpts showing blocked requests (Task 3)
