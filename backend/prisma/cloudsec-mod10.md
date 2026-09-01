# Module 10 -- Multi-Cloud Security

## Why Organizations Run More Than One Cloud

Most organizations start with one cloud provider. They build their infrastructure on AWS, or Azure, or GCP, and everything runs there. Then reality intervenes. A merger brings in a company that runs on a different cloud. A regulatory requirement mandates data residency in a region where one provider is weaker. A specific service on another provider is significantly better or cheaper. A strategic decision avoids vendor lock-in.

The result is a multi-cloud environment. According to industry surveys, over 85 percent of enterprises now run workloads across multiple cloud providers. The most common combination is AWS plus Azure (because of Microsoft 365 integration) or AWS plus GCP (because of Google's data analytics and AI services).

Multi-cloud introduces security challenges that do not exist in single-cloud environments. Identity systems do not natively federate. Network connectivity between clouds requires additional infrastructure. Policy enforcement is inconsistent across providers. Visibility is fragmented. An incident in one cloud may require investigation across clouds.

This module covers the practical security challenges of multi-cloud environments, the tools and patterns that address them, and a real scenario of securing a hybrid AWS and GCP deployment.

## Hybrid Cloud Security Challenges

Hybrid cloud means running workloads in a combination of on-premises infrastructure and one or more cloud providers. The security challenges are magnified because you are bridging fundamentally different environments.

### Identity Federation Across Providers

Each cloud provider has its own identity system. AWS has IAM. Azure has Entra ID (formerly Azure AD). GCP has Cloud Identity. These systems do not natively share identity information. An IAM user in AWS is not the same as a user in Azure AD. They have different credentials, different permission models, and different lifecycle management.

**The federation problem:** Your organization has 500 employees. Each employee needs access to resources in AWS, Azure, and GCP. Creating separate identities in each cloud means 1,500 identities to manage. When an employee leaves, you must disable their identity in three places. When they change roles, you must update permissions in three places.

**The solution:** Centralize identity in one provider or use an external identity provider. Most organizations use their existing IdP (Okta, Azure AD, Ping Identity) as the central identity source. Configure SAML or OIDC federation in each cloud provider to trust the central IdP.

**AWS configuration:** Configure AWS IAM Identity Center to trust your IdP via SAML 2.0. Map IdP groups to AWS permission sets. When a user authenticates through the IdP, they receive temporary AWS credentials with the permissions defined by their mapped permission set.

**Azure configuration:** Azure AD is often the central IdP in Microsoft-centric organizations. Configure Azure AD to federate with AWS using the AWS connector for Azure AD. This maps Azure AD groups to AWS IAM roles. Users authenticate through Azure AD and assume AWS roles.

**GCP configuration:** Configure GCP Workforce Identity Federation to trust your IdP. This allows users authenticated by an external IdP to access GCP resources without creating GCP identities. Alternatively, use Google Cloud Identity to synchronize users from your IdP.

**The key principle:** One identity, multiple clouds. Never create cloud-specific identities for human users. Use federation to map a single identity to cloud-specific roles and permissions. This reduces management overhead and ensures that when an identity is disabled in the IdP, access is revoked in all clouds simultaneously.

### Network Connectivity Between Clouds

Clouds are separate networks. Traffic between them traverses the public internet unless you establish private connectivity.

**VPN connections:** Each cloud provider supports site-to-site VPN connections. You can establish IPSec tunnels between clouds. VPN is the simplest option but has limitations: latency, throughput, and reliability depend on the public internet.

**Dedicated interconnects:** AWS Direct Connect, Azure ExpressRoute, and GCP Cloud Interconnect provide dedicated physical connections between your on-premises network and each cloud. These connections offer higher throughput, lower latency, and more reliable connectivity than VPN. They are also more expensive.

**Cloud-to-cloud interconnects:** AWS Direct Connect can connect to Azure ExpressRoute or GCP Cloud Interconnect through a colocation facility. This provides private connectivity between clouds without traversing the public internet.

**SD-WAN solutions:** Software-defined WAN solutions from vendors like Cloudflare, Zscaler, and Palo Alto Networks can manage connectivity across multiple clouds with centralized policy management. The SD-WAN fabric handles routing, encryption, and policy enforcement.

**Network segmentation across clouds:** Each cloud has its own network segmentation model. AWS uses VPCs, Azure uses VNets, GCP uses VPCs. These segments are independent. A VPC in AWS cannot natively communicate with a VNet in Azure. You must establish explicit connectivity (VPN, interconnect, or peering through a transit hub).

### Policy Enforcement Across Clouds

Each cloud provider has its own policy language. AWS uses IAM policies, SCPs, and permission boundaries. Azure uses Azure Policy and RBAC. GCP uses IAM conditions and organization policies. Enforcing consistent policies across clouds requires a unification layer.

**Cloud Security Posture Management (CSPM) tools:** Tools like Prisma Cloud, Wiz, Lacework, and AWS Security Hub (with multi-cloud support) provide a unified view of security posture across clouds. They map cloud-specific configurations to common compliance frameworks and identify deviations.

**Policy as code with Open Policy Agent (OPA):** OPA is a general-purpose policy engine that can enforce policies across multiple clouds. Write policies in Rego, a declarative language, and apply them to cloud resource configurations. OPA integrates with Terraform, Kubernetes, and CI/CD pipelines to enforce policies before deployment.

**Terraform for multi-cloud infrastructure:** Terraform abstracts cloud-specific resource definitions behind a common configuration language. You can define infrastructure in HCL (HashiCorp Configuration Language) and apply it to AWS, Azure, or GCP. Terraform's plan and apply workflow provides a preview of changes before they are made, allowing policy validation before deployment.

### Logging and Monitoring Across Clouds

Each cloud generates its own logs. CloudTrail for AWS, Activity Log for Azure, Cloud Audit Logs for GCP. Aggregating these logs for analysis requires a centralized logging infrastructure.

**Centralized logging architecture:**
- Forward CloudTrail logs to a central S3 bucket
- Forward Azure Activity Logs to Azure Monitor and export to a central storage account
- Forward GCP Cloud Audit Logs to a central GCS bucket
- Use a SIEM (Splunk, Elastic, Sumo Logic) to aggregate logs from all clouds
- Correlate events across clouds to detect cross-cloud attack patterns

**Cross-cloud correlation:** An attacker who compromises AWS credentials may use them to access S3, then pivot to GCP using a compromised service account. Detecting this requires correlating AWS CloudTrail events with GCP Cloud Audit Logs. A SIEM with multi-cloud support can detect these patterns.

## Multi-Cloud Identity Management

### Unified Identity Architecture

The foundation of multi-cloud security is unified identity. Design your identity architecture to support multiple clouds from the beginning.

**Identity hierarchy:**
1. Central IdP (Okta, Azure AD, Ping Identity) is the source of truth for all identities
2. Each cloud provider federates with the central IdP via SAML 2.0 or OIDC
3. IdP groups map to cloud-specific roles and permissions
4. When an identity is disabled in the IdP, all cloud access is revoked immediately

**Group-based access control:** Define access roles as IdP groups. Map each group to appropriate roles in each cloud. For example:
- "Production Engineers" group maps to AWS production admin role, Azure production contributor role, GCP production editor role
- "Developers" group maps to AWS dev full-access role, Azure dev contributor role, GCP dev editor role
- "Auditors" group maps to AWS read-only role, Azure reader role, GCP viewer role

**Conditional access across clouds:** Configure conditional access policies in the central IdP that apply to all cloud logins. Require MFA for all cloud access. Restrict access from specific locations. Block access from risky sign-ins. These policies apply consistently regardless of which cloud the user is accessing.

### Service Account Management

Service accounts (machine identities) are more complex in multi-cloud environments. Each cloud has its own mechanism for service accounts. AWS has IAM roles, Azure has managed identities and service principals, GCP has service accounts.

**Key management practices:**
- Rotate service account credentials regularly (every 90 days at minimum)
- Use workload identity federation instead of long-lived credentials where possible
- Monitor service account usage across clouds for anomalies
- Implement least privilege for each service account
- Do not share service accounts across clouds

## Consistent Policy Enforcement

### Cloud-Agnostic Policy Framework

Define security policies at a level above any specific cloud provider. Then map these policies to cloud-specific implementations.

**Policy categories:**
1. **Data classification policies:** Define how data is classified and what protections each classification level requires. Apply these policies across all clouds.
2. **Access control policies:** Define who can access what, under what conditions. Implement these policies using each cloud's IAM system.
3. **Encryption policies:** Define encryption requirements (algorithm, key management, rotation). Implement using each cloud's encryption services.
4. **Network policies:** Define network segmentation requirements. Implement using each cloud's networking services.
5. **Logging policies:** Define what must be logged and retained. Implement using each cloud's logging services.

### Infrastructure as Code for Consistency

Terraform, Pulumi, and CloudFormation (AWS only) provide infrastructure as code capabilities. Use IaC to define cloud resources in code, then apply the code consistently across clouds.

**Terraform multi-cloud example:**

A Terraform configuration that creates an S3 bucket in AWS and a GCS bucket in GCP with consistent encryption settings:

```hcl
resource "aws_s3_bucket" "data" {
  bucket = "company-data-us-east-1"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "google_storage_bucket" "data" {
  name     = "company-data-us-central1"
  location = "US"
  encryption {
    default_kms_key_name = google_kms_crypto_key.storage.id
  }
}
```

Both buckets use KMS encryption. The encryption configuration is defined in code, reviewed in pull requests, and applied consistently. This eliminates configuration drift and ensures that every bucket across both clouds meets the same encryption standard.

### Drift Detection

Configuration drift occurs when resources are modified outside of the IaC pipeline. A developer manually changes a security group. An operations engineer modifies an IAM policy. The change is not captured in code and is not auditable.

**Drift detection tools:**
- Terraform plan detects drift by comparing the desired state (code) with the actual state (cloud)
- AWS Config detects drift for AWS resources
- Azure Policy compliance reports detect drift for Azure resources
- GCP Config Validator detects drift for GCP resources
- CSPM tools detect drift across all clouds

Run drift detection weekly at minimum. Remediate drift by either updating the code to match the manual change or reverting the manual change to match the code. Never allow undocumented manual changes to persist.

## Cloud Security Posture Management

CSPM tools provide continuous visibility into your cloud security posture across multiple clouds. They scan your cloud environments, compare configurations against best practices and compliance frameworks, and generate findings.

### CSPM Tool Capabilities

**Visibility:** CSPM tools discover all resources across all clouds. They maintain a real-time inventory of VMs, storage buckets, databases, IAM roles, and network configurations. This visibility eliminates shadow IT and unknown assets.

**Assessment:** CSPM tools evaluate each resource against security best practices and compliance frameworks. They check encryption settings, access controls, network configurations, and logging settings. They generate findings for non-compliant resources.

**Remediation:** Some CSPM tools offer automated remediation. When a non-compliant resource is detected, the tool can automatically fix the configuration. For example, enabling encryption on an unencrypted S3 bucket or removing a public IP from an EC2 instance.

**Threat detection:** Advanced CSPM tools detect active threats by analyzing cloud logs, network traffic, and user behavior. They identify compromised credentials, crypto-mining, data exfiltration, and other attack patterns.

### CSPM Tool Selection

**Prisma Cloud (Palo Alto):** Comprehensive CSPM with threat detection, data security, and compliance. Supports AWS, Azure, GCP, and Kubernetes.

**Wiz:** Agentless CSPM that provides visibility without deploying agents. Scans cloud environments using API access. Strong in visibility and risk assessment.

**Lacework:** CSPM with strong anomaly detection. Uses machine learning to identify unusual behavior patterns.

**AWS Security Hub + Azure Security Center + GCP Security Command Center:** Cloud-native CSPM for each provider. Provides basic coverage but does not unify across clouds. Use these as a baseline and supplement with a third-party CSPM for multi-cloud visibility.

**Open source options:** ScoutSuite (NCC Group) and Prowler (AWS-focused) provide basic CSPM capabilities. They are useful for initial assessments but lack the continuous monitoring and automation of commercial tools.

## Real Scenario: Securing AWS and GCP Hybrid Deployment

A data analytics company runs its primary application on AWS and its data processing pipeline on GCP. The GCP deployment was chosen because BigQuery and Vertex AI are significantly more capable for their use case than AWS equivalents. The company has 200 employees, 50 AWS accounts, and 10 GCP projects.

### Initial State (Before Security Improvements)

The company had no centralized identity. AWS users were managed in AWS IAM. GCP users were managed in Google Cloud Identity. When an employee left, IT had to disable their identity in both systems. There were three cases in the past year where an employee was disabled in one cloud but not the other, leaving active credentials in one environment.

Network connectivity was via site-to-site VPN from the corporate office to both clouds. The VPN tunnels went through the public internet. There was no encryption of data in transit between clouds.

Logging was fragmented. CloudTrail was enabled in some AWS accounts but not all. GCP Cloud Audit Logs were enabled but stored in a project that only the GCP administrator could access. There was no centralized logging.

Policy enforcement was manual. Each team configured their own cloud resources. Some teams used Terraform, others used the console. There was no consistent policy enforcement.

### Security Architecture (After Improvements)

**Identity:** The company deployed Okta as the central IdP. AWS IAM Identity Center was configured to trust Okta via SAML 2.0. GCP Workforce Identity Federation was configured to trust Okta. All human access to both clouds goes through Okta. MFA is required for all users. Conditional access policies restrict access from approved locations and devices.

**Network:** The company established AWS Direct Connect and GCP Cloud Interconnect to a colocation facility in us-east-1. This provides private, low-latency connectivity between both clouds. Traffic between clouds traverses the dedicated interconnect, not the public internet. IPsec encryption is applied at the interconnect layer.

**Logging:** CloudTrail is enabled in all 50 AWS accounts with organization trails. Logs are stored in a central S3 bucket in the security account. GCP Cloud Audit Logs are exported to a central GCS bucket. Both are forwarded to Elastic SIEM for centralized analysis. GuardDuty is enabled in all AWS accounts. GCP Threat Detection is enabled in all projects.

**Policy:** Terraform is the standard for infrastructure provisioning in both clouds. A CI/CD pipeline validates all Terraform changes against OPA policies before deployment. OPA policies enforce encryption, tagging, network segmentation, and IAM best practices. AWS Config rules provide continuous compliance monitoring for AWS. GCP Security Command Center provides continuous monitoring for GCP.

**Incident response:** A centralized security team monitors both clouds from the SIEM. GuardDuty and GCP Threat Detection findings are correlated. Automated Lambda and Cloud Functions respond to high-severity findings. Playbooks cover incidents spanning both clouds.

### Implementation Results

The identity consolidation reduced the time to disable a user from 30 minutes (two separate systems) to 2 minutes (one Okta action). The three cases of partial identity disablement from the previous year were eliminated.

The private interconnect reduced data transfer costs by 40 percent (no more data transfer charges for cloud-to-cloud traffic) and reduced latency from 50 milliseconds to 2 milliseconds.

The centralized logging reduced mean time to detect (MTTD) from 72 hours to 15 minutes. The security team could now correlate events across both clouds and detect cross-cloud attack patterns.

The OPA-based policy enforcement reduced misconfigurations by 85 percent. Instead of relying on manual review of console changes, all infrastructure changes went through the CI/CD pipeline with automated policy validation.

The total cost of the security improvements was approximately 150,000 dollars in tooling and 500 engineering hours over six months. The company estimated that a single data breach would cost over 5 million dollars in direct costs, regulatory fines, and reputational damage. The investment was justified by risk reduction alone.

### Lessons Learned

**Start with identity.** Unified identity is the foundation of multi-cloud security. Without it, everything else is harder.

**Invest in private connectivity.** VPN over the public internet is adequate for initial deployments but inadequate for production workloads. Dedicated interconnects provide better performance, security, and cost.

**Centralize logging from day one.** It is much harder to retrofit centralized logging than to build it from the start. Forward all cloud logs to a central location before deploying workloads.

**Automate policy enforcement.** Manual policy review does not scale in multi-cloud environments. Use policy as code to enforce standards automatically.

**Practice cross-cloud incident response.** Run tabletop exercises that simulate incidents spanning both clouds. The response procedures are different from single-cloud incidents and require practice.


## Multi-Cloud Security Governance

Governance in multi-cloud environments requires centralized policy management with decentralized execution. The central security team defines the policies. Individual teams implement them in their cloud environments.

### Governance Model

**Centralized policy definition:** The security team defines security policies that apply across all clouds. These policies cover encryption standards, access control requirements, logging requirements, and network segmentation rules. The policies are technology-agnostic. They describe what must be done, not how to do it in a specific cloud.

**Decentralized implementation:** Each cloud team implements the policies using their cloud provider's tools. The AWS team uses IAM policies and Config rules. The Azure team uses Azure Policy and RBAC. The GCP team uses IAM conditions and Organization Policies. The implementation differs, but the outcome is the same.

**Centralized monitoring:** The security team monitors compliance across all clouds using a CSPM tool or Security Hub. Non-compliant resources generate findings that are triaged and assigned to the appropriate team for remediation.

### Policy Exceptions

Not every policy can be applied uniformly. Some workloads have legitimate reasons to deviate from standard policies. The governance model must include an exception process.

**Exception request:** The workload owner submits a request explaining why the policy cannot be applied, what risk the deviation introduces, and what compensating controls are in place.

**Exception review:** The security team reviews the request. They assess the risk and the compensating controls. They approve, deny, or request modifications.

**Exception tracking:** Approved exceptions are documented with an expiration date. Before the exception expires, the workload owner must either comply with the policy or request a renewal. Exceptions are reviewed quarterly to ensure they are still valid.

## Multi-Cloud Disaster Recovery

Multi-cloud provides natural disaster recovery capabilities. If one cloud provider has an outage, workloads can fail over to another cloud. But multi-cloud DR requires planning and testing.

### DR Architecture Patterns

**Active-active:** Workloads run simultaneously in both clouds. Traffic is distributed across both clouds. If one cloud fails, the other absorbs the full load. This provides the best availability but the highest cost.

**Active-passive:** Workloads run in one cloud (active). A standby environment exists in another cloud (passive). If the active cloud fails, traffic is switched to the passive cloud. This provides good availability at lower cost than active-active.

**Pilot light:** A minimal version of the application runs in the standby cloud. The standby environment has the critical infrastructure (databases, load balancers) but not the full compute capacity. If the active cloud fails, the standby environment is scaled up to handle traffic.

### DR Testing

DR is only useful if it works. Test DR regularly by simulating cloud provider failures. Run game days where you shut down services in one cloud and verify that the other cloud can handle the load.

Test DR quarterly at minimum. Document the test results, including recovery time (how long it took to failover) and recovery point (how much data was lost). Improve based on test results.

## Multi-Cloud Cost Security

Security has a cost dimension in multi-cloud environments. Each cloud provider charges differently for security services. Understanding these costs helps you make informed decisions about which services to use.

### Security Service Costs

**AWS:** GuardDuty charges per event analyzed. Security Hub charges per finding ingested. WAF charges per rule and per request. CloudTrail is free for management events, charged for data events.

**Azure:** Microsoft Defender for Cloud charges per resource per month. Azure Monitor charges per GB of log data. Azure Policy is free.

**GCP:** Security Command Center Premium charges per project per month. Cloud Armor charges per rule and per request. Cloud Logging charges per GB of log data ingested.

### Cost Optimization

Use free-tier security services where possible (AWS Config rules, basic GuardDuty, Azure Policy). Aggregate logs instead of duplicating them. Use lifecycle policies to manage log retention. Monitor security service costs and adjust thresholds based on actual value.

## Vendor Lock-In Considerations

Multi-cloud reduces vendor lock-in but does not eliminate it. Each cloud provider's security services are proprietary. GuardDuty does not work in Azure. Microsoft Defender does not work in AWS. The more you depend on provider-specific security services, the harder it is to migrate to another provider.

### Reducing Lock-In

**Use open standards where possible.** OPA for policy enforcement works across clouds. Suricata for network intrusion detection works across clouds. OpenTelemetry for observability works across clouds.

**Abstract provider-specific services.** Use Terraform to abstract cloud-specific resource definitions. Use the AWS Cloud Development Kit (CDK) or Pulumi with multi-cloud libraries. This makes it easier to switch providers.

**Document dependencies.** Maintain a list of all provider-specific services your organization uses. For each service, document the provider-agnostic alternative. This helps you assess the cost of migration.

## Real Scenario: Securing AWS and GCP Hybrid Deployment (Expanded)

### Additional Implementation Details

**Encryption consistency:** The company established a encryption standard requiring AES-256 encryption at rest for all data stores. In AWS, this meant enabling SSE-KMS on all S3 buckets, EBS volumes, and RDS instances. In GCP, this meant enabling CMEK (Customer-Managed Encryption Keys) on all Cloud Storage buckets, Persistent Disks, and Cloud SQL instances. The encryption keys were managed in AWS KMS and Cloud KMS respectively, with key rotation enabled on both.

**Network segmentation:** The company implemented network segmentation using VPCs in AWS and VPCs in GCP. Production and development environments were in separate VPCs. Communication between production and development was blocked. Communication between AWS and GCP was restricted to specific services through private interconnects.

**Secrets management:** The company used AWS Secrets Manager for AWS workloads and GCP Secret Manager for GCP workloads. Both were configured with automatic rotation for database credentials. The rotation Lambda and Cloud Function were configured with minimal IAM permissions. Secrets were never passed as environment variables; they were retrieved at runtime using the cloud-native SDK.

**Compliance monitoring:** The company deployed AWS Config rules in all AWS accounts and GCP Security Command Center in all GCP projects. Findings from both were aggregated in a central SIEM. The security team reviewed findings daily and remediated high-severity issues within 24 hours.

### Results

The comprehensive security architecture reduced the company's risk profile significantly. The centralized identity system eliminated orphaned accounts. The private interconnect reduced the attack surface by removing public internet exposure. The centralized logging reduced detection time from days to minutes. The policy enforcement reduced misconfigurations by 85 percent. The DR capability ensured business continuity during cloud provider outages.

The investment in multi-cloud security paid for itself within the first year through reduced risk, lower incident response costs, and operational efficiency gains.

## Assessment

**Lab Task 1 (60 minutes):** Configure SAML federation between an external IdP (Okta, Azure AD, or a test IdP) and AWS IAM Identity Center. Map IdP groups to AWS permission sets. Test by logging in through the IdP and verifying that the AWS console shows the correct permissions. Then configure OIDC federation between the same IdP and GCP Workforce Identity Federation. Test by logging in and verifying GCP access.

**Lab Task 2 (60 minutes):** Set up site-to-site VPN between two cloud accounts (or simulate with two VPCs in the same account). Configure routing to allow traffic between the VPCs. Test connectivity by launching an instance in each VPC and verifying they can communicate. Enable encryption on the VPN tunnel and verify that traffic is encrypted using packet capture.

**Lab Task 3 (60 minutes):** Deploy a Terraform configuration that creates resources in both AWS and GCP with consistent security settings: encrypted storage, restrictive IAM, and logging enabled. Use OPA to validate the Terraform plan against security policies before applying. Intentionally create a non-compliant resource (unencrypted storage) and verify that OPA blocks the deployment.

**Lab Task 4 (45 minutes):** Set up centralized logging by forwarding CloudTrail logs from one AWS account to a central S3 bucket and GCP Cloud Audit Logs from one GCP project to a central GCS bucket. Query both log sources from a single location. Write a CloudWatch Logs Insights query that finds all console login events in the last 24 hours.

**Grading Criteria:**
- Identity federation: does SAML/OIDC federation work correctly? (25%)
- Network connectivity: is the VPN or interconnect properly configured and encrypted? (25%)
- Policy enforcement: does OPA correctly block non-compliant Terraform plans? (25%)
- Centralized logging: are logs from both clouds accessible from a central location? (25%)

## Evidence

Save the following as evidence:
1. IdP configuration, SAML/OIDC federation setup, and login test results (Task 1)
2. VPN configuration, routing tables, and connectivity test results (Task 2)
3. Terraform configurations, OPA policies, and test results for compliant and non-compliant resources (Task 3)
4. Centralized logging configuration and cross-cloud log query results (Task 4)
