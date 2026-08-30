# Module 3 — Network Security: VPCs, Security Groups, and NACLs

## What You'll Actually Do

You'll build a VPC from scratch with proper segmentation, configure security groups and network ACLs, and set up a NAT gateway. Then you'll break it — open ports you shouldn't, skip NACL rules, and watch what happens. The point is understanding network security through both building and breaking.

## VPC Architecture That Makes Sense

A well-architected VPC isn't about blocking everything. It's about controlling what talks to what, and making sure that control is layered.

```
VPC (10.0.0.0/16)
├── Public Subnet (10.0.1.0/24)     — NAT Gateway, Bastion Host
├── Private Subnet - App (10.0.2.0/24)  — Application Servers
├── Private Subnet - Data (10.0.3.0/24) — Databases
└── Isolated Subnet (10.0.4.0/24)   — Nothing touches the internet
```

## Security Groups vs. NACLs

People confuse these two constantly. Here's the difference:

**Security Groups (Stateful):**
- Attached to instances
- If you allow inbound, outbound is automatically allowed
- Rules are allow-only (no deny)
- Default: deny all inbound, allow all outbound

**NACLs (Stateless):**
- Attached to subnets
- Must explicitly allow both inbound AND outbound
- Supports deny rules (security groups don't)
- Default: allow all inbound, allow all outbound

The common pattern: Security groups handle the fine-grained instance-level rules. NACLs handle broad subnet-level blocks and deny lists.

```bash
# Create a VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=SecureVPC}]'

# Create security group with restricted ingress
aws ec2 create-security-group \
  --group-name web-sg \
  --description "Allow HTTPS only" \
  --vpc-id vpc-0123456789abcdef0

aws ec2 authorize-security-group-ingress \
  --group-id sg-0123456789abcdef0 \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Block a specific IP range at NACL level
aws ec2 create-network-acl-entry \
  --network-acl-id acl-0123456789abcdef0 \
  --rule-number 100 \
  --protocol -1 \
  --rule-action deny \
  --cidr-block 192.168.1.0/24 \
  --egress
```

## Common Mistakes That Get People

1. **Opening port 22 to 0.0.0.0/0** — Use a bastion host or SSM Session Manager
2. **Using default NACLs** — They allow everything. Replace them.
3. **Forgetting egress rules** — You need outbound access for updates and API calls
4. **Overlapping CIDR ranges** — When you peer VPCs, overlapping CIDRs break everything
5. **Skipping flow logs** — Without them, you're blind to network traffic

## Lab Task — Build, Secure, Break

1. **Build** — Create a VPC with 3 subnets (public, private-app, private-data). Set up security groups for each layer. Create an NACL that blocks traffic from a known-bad IP range.

2. **Verify** — Launch an EC2 instance in the private subnet. Confirm it can't be reached from the internet. Set up a bastion host and verify you can SSH through it.

3. **Break** — Add a security group rule that opens port 22 to 0.0.0.0/0. Document what happens. Then add a NACL deny rule that blocks outbound traffic to the internet. Watch the instance lose its ability to pull updates.

4. **Fix** — Remove the bad security group rule. Add proper NACL rules. Verify the instance is secure again.

**Time:** 55 minutes

**Grading (10 points):**
- 3 points: VPC and subnets created correctly
- 3 points: Security groups properly configured per layer
- 2 points: NACL rules working as intended
- 2 points: Break and fix documented with evidence

**Evidence:** AWS console screenshots showing VPC layout, security group rules, NACL entries, and the results of your break/fix steps. Upload a PDF with all screenshots and annotations.
