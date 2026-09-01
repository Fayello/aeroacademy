# Module 10: Security Architecture

Security architecture is the practice of designing the overall structure of a system's security controls, from network topology to identity management to data protection to monitoring and response. It is the highest-level abstraction of security engineering: it defines how all the individual security components (authentication, authorization, encryption, monitoring, logging) fit together into a coherent, defensible system. A well-designed security architecture does not just add security controls; it designs the system so that security is an emergent property of the architecture itself.

The security architect's job is to make architectural decisions that balance security, performance, availability, cost, and operational complexity. Every security control has costs: in performance, in development time, in operational overhead, in user friction. The architect's skill is in making these tradeoffs explicitly and defensibly, choosing controls that provide the most risk reduction for the least cost.

## Zero Trust Architecture

Zero Trust is a security architecture model that eliminates the concept of a trusted internal network. In traditional perimeter security, anything inside the network perimeter is trusted, and security controls focus on keeping attackers out. Zero Trust assumes that the perimeter has already been breached and that no user, device, or network segment should be inherently trusted.

The three core principles of Zero Trust:

**Verify explicitly:** Always authenticate and authorize based on all available data points: user identity, device health, location, service or workload, data classification, and anomalies. Never trust a request based solely on its source.

**Use least privilege access:** Limit user and service access to the minimum necessary for the specific task. Use just-in-time and just-enough access (JIT/JEA) to reduce the window of opportunity for attackers.

**Assume breach:** Design the system assuming that a breach has already occurred. Minimize blast radius through segmentation, encrypt all traffic, and monitor for anomalous behavior.

### Zero Trust Implementation

Implementing Zero Trust is a multi-phase journey, not a single product deployment. The NIST SP 800-207 framework defines the Zero Trust Architecture (ZTA) components:

**Policy Engine (PE):** The brain of the Zero Trust system. It evaluates access requests against the organization's security policies, considering user identity, device state, resource sensitivity, and environmental context. The PE makes the decision to grant, deny, or revoke access.

**Policy Administrator (PA):** Executes the PE's decisions by establishing or terminating the communication path between subjects and resources. The PA issues session tokens, manages access policies, and enforces time-based access restrictions.

**Policy Enforcement Point (PEP):** The gatekeeper that sits between subjects and resources. The PEP intercepts all access requests, forwards them to the PE for evaluation, and enforces the PE's decisions. The PEP can be a proxy, a gateway, a sidecar, or a host-based agent.

**Identity Provider (IdP):** Manages user identities and authentication. In Zero Trust, the IdP is the foundation: every access decision starts with verifying the user's identity.

**Device Trust Provider:** Evaluates the health and compliance of the device requesting access. Device trust includes patch level, security software status, encryption status, and certificate validity.

**SIEM and Analytics Platform:** Collects and analyzes logs from all Zero Trust components. The analytics platform detects anomalies, identifies attack patterns, and provides the data for the PE's access decisions.

### Zero Trust Network Access (ZTNA)

ZTNA replaces traditional VPN for remote access. Instead of granting broad network access through a VPN tunnel, ZTNA grants access to specific applications based on user identity, device health, and context.

ZTNA advantages over VPN:
- Granular access: users access only the specific applications they need, not the entire network
- Continuous verification: access is re-evaluated throughout the session, not just at connection time
- Reduced attack surface: no broad network access means no lateral movement through the VPN
- Better user experience: no VPN client installation, no split-tunneling configuration

ZTNA implementations include Cloudflare Access, Zscaler Private Access, and Palo Alto Prisma Access. Open-source alternatives include Pomerium and Boundary (HashiCorp).

## Network Segmentation

Network segmentation divides the network into isolated zones, each with its own security controls. If an attacker compromises one segment, they cannot move laterally to other segments without crossing a security boundary.

### Traditional Segmentation

Traditional segmentation uses VLANs and firewalls to divide the network into zones:

- **DMZ:** Internet-facing services (web servers, load balancers, API gateways)
- **Application tier:** Application servers, microservices
- **Data tier:** Databases, file servers, storage
- **Management tier:** Administrative systems, monitoring, logging
- **User tier:** Employee workstations, devices

Traffic between zones is controlled by firewall rules that enforce the principle of least privilege. The web tier can communicate with the application tier on specific ports. The application tier can communicate with the data tier on specific ports. The user tier can communicate with the application tier but not the data tier.

### Microsegmentation

Microsegmentation extends segmentation to the workload level. Instead of segmenting by network zone, each workload (container, VM, process) has its own network policy that defines what it can communicate with.

In Kubernetes, NetworkPolicies define pod-level segmentation:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-server-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api-server
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: database
      ports:
        - protocol: TCP
          port: 5432
```

This policy allows the API server to receive traffic from the frontend on port 8080 and send traffic to the database on port 5432. All other traffic is denied by default.

Microsegmentation is essential in cloud and container environments where workloads are dynamic and ephemeral. Traditional network segmentation based on IP addresses does not work when workloads are created and destroyed continuously. Microsegmentation based on labels and identities scales with the dynamic environment.

### East-West Traffic Monitoring

East-west traffic (traffic between servers within the data center) is typically not inspected by perimeter firewalls. An attacker who compromises a server can move laterally through east-west traffic without detection.

East-west monitoring solutions (Illumio, Guardicore, Darktrace) provide visibility into lateral movement by monitoring traffic between workloads. These solutions can detect anomalous communication patterns, identify compromised workloads, and enforce microsegmentation policies without network changes.

## Cloud Security Architecture

Cloud security architecture differs from on-premises architecture because the security model shifts. In on-premises, the organization is responsible for physical security, network security, operating system security, and application security. In the cloud, the cloud provider handles physical and infrastructure security, and the customer handles everything else.

### Shared Responsibility Model

**Infrastructure as a Service (IaaS):** The customer manages everything above the hypervisor: operating systems, applications, data, network configuration, and identity management. The cloud provider manages physical security, hypervisor, and network infrastructure.

**Platform as a Service (PaaS):** The customer manages applications and data. The cloud provider manages everything else, including the operating system, runtime, and middleware.

**Software as a Service (SaaS):** The customer manages only identity and data access. The cloud provider manages everything else.

The most common security failures in cloud are customer misconfigurations: public S3 buckets, overly permissive IAM policies, unencrypted databases, and exposed management interfaces. These are not cloud security failures; they are security architecture failures that happen to occur in a cloud environment.

### AWS Security Architecture

**Identity and Access Management (IAM):** AWS IAM manages access to AWS services and resources. IAM policies define permissions using a JSON policy language. The principle of least privilege means granting only the permissions required for the specific task.

A least-privilege IAM policy for an application that reads from an S3 bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-app-data",
        "arn:aws:s3:::my-app-data/*"
      ]
    }
  ]
}
```

This policy allows only read access to a specific S3 bucket, not write access, not access to other buckets, and not access to other AWS services.

**VPC Security:** Amazon VPC provides network isolation with subnets, route tables, network ACLs, and security groups. Security groups act as stateful firewalls at the instance level. Network ACLs provide stateless filtering at the subnet level.

**CloudTrail:** AWS CloudTrail logs all API calls across the account. CloudTrail logs are essential for security monitoring, incident response, and compliance. CloudTrail logs should be stored in a dedicated S3 bucket with restricted access, and log integrity should be validated using digest files.

**GuardDuty:** Amazon GuardDuty is a threat detection service that analyzes CloudTrail, VPC Flow Logs, and DNS logs for malicious activity. GuardDuty provides managed threat detection without requiring the customer to build and maintain detection rules.

### Azure Security Architecture

**Azure Active Directory (AAD):** Azure AD manages identity and access for Azure resources and Microsoft 365. Azure AD supports conditional access policies that evaluate user identity, device state, location, and risk level before granting access.

**Azure Security Center:** Azure Security Center provides security posture management and threat protection across hybrid cloud workloads. It identifies misconfigurations, recommends improvements, and detects threats.

**Azure Key Vault:** Azure Key Vault manages secrets, encryption keys, and certificates. Applications retrieve secrets from Key Vault instead of storing them in configuration files or environment variables.

### GCP Security Architecture

**Identity and Access Management (IAM):** GCP IAM uses roles that bundle permissions. Primitive roles (Owner, Editor, Viewer) provide broad access. Predefined roles provide service-specific access. Custom roles provide fine-grained access.

**VPC Service Controls:** VPC Service Controls create security perimeters around GCP resources, preventing data exfiltration even if credentials are compromised. Service controls define which resources can be accessed from which networks.

**Cloud Audit Logs:** GCP Cloud Audit Logs capture admin activity, data access, and system events. Audit logs are essential for security monitoring and compliance.

## API Gateway Security

API gateways are the front door for API traffic. They handle authentication, authorization, rate limiting, request validation, and threat protection. A well-configured API gateway provides a centralized point of security control for all API traffic.

### Authentication and Authorization

The API gateway handles authentication (verifying the caller's identity) and authorization (determining what the caller can do). Common patterns:

- **JWT validation:** The gateway validates JWT tokens issued by an identity provider. The gateway checks the token signature, expiration, issuer, and audience before forwarding the request to the backend service.
- **OAuth 2.0 introspection:** The gateway calls the identity provider's introspection endpoint to validate opaque tokens. This adds latency but provides real-time token validation.
- **API key validation:** The gateway validates API keys against a database of registered keys. API keys provide identification but not authentication: they identify the application, not the user.

### Rate Limiting

Rate limiting prevents abuse by limiting the number of requests a client can make within a time window. Rate limiting should be applied at multiple levels:

- **Per-client rate limiting:** Limits requests from each authenticated client
- **Per-endpoint rate limiting:** Limits requests to specific endpoints (e.g., login endpoints have lower limits than search endpoints)
- **Global rate limiting:** Limits total requests across all clients to prevent resource exhaustion

### Request Validation

The API gateway validates incoming requests against a schema (OpenAPI/Swagger). Invalid requests are rejected before reaching the backend services, reducing the attack surface and preventing malformed input from causing unexpected behavior.

### Threat Protection

The API gateway provides protection against common API attacks:
- **Injection attacks:** SQL injection, command injection, and other injection attacks are blocked by input validation rules
- **Broken authentication:** The gateway enforces authentication requirements for protected endpoints
- **Excessive data exposure:** Response filtering ensures that backend services do not return more data than the API contract specifies
- **Rate limiting:** Prevents brute-force and denial of service attacks

## Secrets Management

Secrets management is the practice of securely storing, accessing, and rotating sensitive credentials: API keys, database passwords, encryption keys, certificates, and other secrets. Hardcoded secrets in source code or configuration files are one of the most common and preventable vulnerability classes.

### HashiCorp Vault

HashiCorp Vault is the most widely deployed secrets management solution. Vault stores secrets in an encrypted backend (Consul, Raft, or other storage engines), provides fine-grained access policies, and supports dynamic secrets (short-lived credentials generated on demand).

Vault's key features:
- **Secret engines:** Database, AWS, Azure, GCP, PKI, Transit, and others
- **Dynamic secrets:** Vault generates short-lived database credentials, cloud API keys, and TLS certificates on demand
- **Leases and rotation:** Secrets have leases that expire, forcing applications to re-fetch secrets
- **Audit logging:** All secret access is logged for compliance and incident response
- **Policies:** Fine-grained access control that defines which secrets each identity can access

A Vault policy for an application that needs database credentials:

```hcl
path "database/creds/myapp-readwrite" {
  capabilities = ["read"]
}

path "secret/data/myapp/config" {
  capabilities = ["read"]
}
```

This policy allows the application to read database credentials from the database secret engine and read application configuration from the KV secret engine. The application cannot access other secrets or perform other operations.

### AWS Secrets Manager

AWS Secrets Manager stores and rotates secrets for AWS services. It integrates natively with RDS, Redshift, and DocumentDB for automatic password rotation. Secrets Manager stores the secret value encrypted with AWS KMS and provides IAM-based access control.

Automatic rotation for an RDS database:

```python
import boto3
import json
import mysql.connector

def lambda_handler(event, context):
    secret_arn = event['SecretId']
    service_client = boto3.client('secretsmanager')
    
    # Get current credentials
    current = service_client.get_secret_value(SecretId=secret_arn)
    current_dict = json.loads(current['SecretString'])
    
    # Generate new password
    new_password = service_client.get_random_password(
        PasswordLength=32,
        ExcludeCharacters='/@"\\',
        RequireEachIncludedType=True
    )['RandomPassword']
    
    # Connect to database and change password
    conn = mysql.connector.connect(
        host=current_dict['host'],
        user=current_dict['username'],
        password=current_dict['password'],
        database=current_dict['dbname']
    )
    cursor = conn.cursor()
    cursor.execute(f"ALTER USER '{current_dict['username']}'@'%' IDENTIFIED BY '{new_password}'")
    conn.commit()
    cursor.close()
    conn.close()
    
    # Update secret
    current_dict['password'] = new_password
    service_client.put_secret_value(
        SecretId=secret_arn,
        SecretString=json.dumps(current_dict)
    )
    
    return {'statusCode': 200}
```

### Best Practices

**Never store secrets in source code.** Use environment variables, secrets management, or configuration files that are excluded from version control.

**Never log secrets.** Ensure that logging frameworks do not capture secret values. Use structured logging that explicitly excludes sensitive fields.

**Rotate secrets regularly.** Secrets should have expiration dates and be rotated before they expire. Dynamic secrets (Vault) handle this automatically. Static secrets (API keys) should be rotated at least quarterly.

**Use short-lived credentials.** Prefer dynamic secrets (Vault database credentials, AWS STS temporary credentials) over long-lived static credentials. Short-lived credentials limit the window of opportunity for attackers.

**Audit secret access.** Log every access to every secret. The audit log should include who accessed what secret, when, and from where. Review audit logs regularly for anomalous access patterns.

## Real Scenario: Designing Zero Trust for a Hybrid Cloud

Consider a company with 2,000 employees, three data centers, two AWS regions, and a SaaS application. The goal is to implement Zero Trust architecture across this hybrid environment.

The architecture begins with identity. Azure AD is the central identity provider, synchronizing with the company's HR system. Every user authenticates through Azure AD with MFA required for all access. Conditional access policies evaluate device health, location, and risk level before granting access.

For the SaaS application, ZTNA replaces the VPN. Cloudflare Access sits in front of the SaaS application, evaluating every access request against Azure AD identity, device compliance (managed by Microsoft Intune), and contextual signals (location, time, device risk score). Users authenticate through Cloudflare Access, which communicates with Azure AD for identity verification and Intune for device compliance. Only compliant devices from authorized locations can access the SaaS application.

For the data centers, microsegmentation is implemented using Illumo. Each workload has a label-based policy that defines what it can communicate with. The web tier can communicate with the application tier on ports 8080 and 8443. The application tier can communicate with the database tier on ports 5432 and 6379. All other communication is denied. East-west traffic is monitored by Illumo, which detects anomalous communication patterns.

For the AWS environments, security is layered:

- **Network:** VPC segmentation with public and private subnets. No direct internet access for application or data tiers. NAT gateways for outbound internet access.
- **Identity:** AWS IAM with least-privilege policies. No root access. MFA for all human users. AWS SSO for centralized access management.
- **Data:** All S3 buckets are private with server-side encryption. RDS databases use encryption at rest and in transit. Secrets are stored in AWS Secrets Manager with automatic rotation.
- **Monitoring:** CloudTrail logs all API calls. GuardDuty detects threats. Security Hub provides a centralized security posture dashboard.

For secrets management, HashiCorp Vault is deployed as the central secrets engine. Vault stores database credentials, API keys, and encryption keys. Applications authenticate to Vault using Kubernetes service accounts (for container workloads) or AWS IAM roles (for EC2 workloads). Vault generates dynamic database credentials with short leases, ensuring that no long-lived database passwords exist in the environment.

The implementation phases:

**Phase 1 (3 months):** Identity foundation. Deploy Azure AD, configure MFA, synchronize with HR system, integrate with SaaS applications. Eliminate passwords for SaaS access.

**Phase 2 (3 months):** ZTNA deployment. Deploy Cloudflare Access in front of SaaS applications. Migrate VPN users to ZTNA. Decommission VPN for SaaS access.

**Phase 3 (6 months):** Microsegmentation. Deploy Illumo in data centers. Label workloads and define segmentation policies. Deploy Illumo agents in AWS workloads. Monitor for policy violations.

**Phase 4 (3 months):** Secrets management. Deploy HashiCorp Vault. Migrate applications from hardcoded secrets to Vault. Implement dynamic database credentials. Configure audit logging.

**Phase 5 (3 months):** Monitoring and analytics. Deploy SIEM (Splunk or Elastic) with logs from all components. Create detection rules for Zero Trust violations. Establish SOC procedures for Zero Trust incidents.

Total implementation timeline: approximately 18 months. The result: a system where every access decision is verified, every connection is encrypted, every secret is managed, and every action is logged. No implicit trust exists anywhere in the architecture.

## Security Architecture Review Process

Security architecture review is the process of evaluating a system's security design before implementation. The review identifies design weaknesses, evaluates compliance with security principles, and recommends improvements.

A security architecture review process:

**Step 1: Architecture documentation review.** Review the system's architecture diagrams, data flow diagrams, network diagrams, and component descriptions. Verify that the documentation is complete and accurate.

**Step 2: Threat model review.** Review the threat model for completeness. Are all components represented in the DFD? Are all STRIDE categories covered? Are the threats prioritized appropriately?

**Step 3: Design principle evaluation.** Evaluate the design against the secure design principles: least privilege, defense in depth, separation of duties, fail-safe defaults, economy of mechanism, complete mediation, and open design. Identify violations and recommend remediations.

**Step 4: Control evaluation.** Evaluate the proposed security controls: authentication mechanism, authorization model, encryption choices, key management, logging and monitoring, and incident response capabilities. Verify that each control is appropriate for the data sensitivity and threat environment.

**Step 5: Compliance evaluation.** Evaluate the design against applicable regulatory and compliance requirements: GDPR, HIPAA, PCI DSS, SOC 2, or other relevant frameworks. Identify gaps and recommend remediations.

**Step 6: Risk assessment.** Assess the residual risk after the proposed controls are implemented. Identify risks that exceed the organization's risk tolerance and recommend additional controls or risk acceptance decisions.

**Step 7: Review report.** Produce a review report that summarizes the findings, rates the overall security posture, and provides specific recommendations. The report should be actionable: each recommendation should include a specific implementation approach and a priority rating.

The review should be conducted by someone who was not involved in the design, to provide an independent perspective. For high-risk systems, the review should involve multiple reviewers with different areas of expertise.

## Assessment

**Lab 10.1: Zero Trust Architecture Design (60 minutes)**
Design a Zero Trust architecture for a financial services company with 3,000 employees, five office locations, remote workers, a customer-facing web application, and internal microservices running in AWS. The design must address identity verification, device trust, network segmentation, application access, data protection, and monitoring. Produce an architecture document with diagrams and implementation guidelines.

**Grading criteria:**
- Comprehensive identity architecture with MFA and conditional access (15 points)
- Device trust and compliance integration (10 points)
- Network segmentation design (microsegmentation or equivalent) (10 points)
- Application access architecture (ZTNA or equivalent) (10 points)
- Data protection and secrets management (10 points)
- Monitoring and detection architecture (5 points)

**Lab 10.2: Cloud Security Architecture Review (45 minutes)**
Review a provided AWS architecture (architecture diagram and configuration files) for security issues. The architecture includes a VPC with public and private subnets, an RDS database, an S3 bucket, IAM policies, and a Lambda function. Identify at least 8 security issues, explain the risk of each, and provide specific remediation steps.

**Grading criteria:**
- Identification of at least 8 security issues (16 points, 2 per issue)
- Accurate risk assessment for each issue (16 points, 2 per issue)
- Specific, implementable remediation steps (16 points, 2 per issue)

**Lab 10.3: API Gateway Security Configuration (45 minutes)**
Configure an API gateway (Kong, AWS API Gateway, or similar) for a provided API specification. The configuration must include JWT authentication, rate limiting (per-client and per-endpoint), request validation, CORS configuration, and logging. Test the configuration against a set of attack scenarios (injection, brute force, token replay) and verify that each attack is blocked.

**Grading criteria:**
- Correct JWT authentication configuration (10 points)
- Appropriate rate limiting configuration (10 points)
- Request validation against API schema (10 points)
- CORS configuration (5 points)
- Logging and monitoring (5 points)
- Successful blocking of all test attack scenarios (10 points)

## Evidence

Security architecture is the strategic layer of security engineering. It defines the overall structure that determines how all other security controls: authentication, authorization, encryption, monitoring, incident response: fit together. A well-designed security architecture makes individual security controls more effective by placing them in the right context and ensuring they work together as a system.

Zero Trust architecture represents a fundamental shift from perimeter-based security to identity-based security. The traditional approach of trusting everything inside the perimeter has failed because attackers routinely breach the perimeter through phishing, credential theft, supply chain attacks, and insider threats. Zero Trust eliminates implicit trust and verifies every access decision, reducing the blast radius of any individual compromise.

Cloud security architecture requires understanding the shared responsibility model and implementing controls that address the customer's portion of the responsibility. Most cloud security failures are misconfigurations: public S3 buckets, overly permissive IAM policies, unencrypted databases: not cloud platform vulnerabilities. Security architecture ensures that these misconfigurations are prevented through design rather than detected after deployment.

The security architecture review process ensures that security is designed in, not bolted on. By reviewing the architecture before implementation, you identify design weaknesses that are cheap to fix and that would be expensive to remediate after deployment. The review process is the mechanism that enforces security architecture principles and ensures that the design meets the organization's security requirements.

Security architecture is not a one-time activity. It evolves with the organization's technology, threats, and requirements. The architect's role is to maintain the architecture's relevance by adapting to new technologies, addressing new threats, and incorporating lessons learned from incidents and assessments. The architecture is a living document that guides the organization's security investments and decisions over time.