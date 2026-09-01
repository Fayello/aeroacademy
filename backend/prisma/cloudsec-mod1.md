# Module 1: Who Secures What? The Cloud Responsibility Model

## The Fundamental Question Every Cloud Engineer Must Answer

When a company moves workloads from its own data center into AWS, Azure, or Google Cloud, something uncomfortable happens: nobody agrees on who is responsible for what. The development team assumes the cloud provider handles firewall rules. The security team assumes the development team configured encryption. The cloud provider? They drew a line in their documentation and assumed everyone read it. That assumption kills companies.

The cloud responsibility model is the single most important concept in cloud security. Get it wrong, and you will have gaps that attackers exploit. Get it right, and you can sleep at night. This module breaks down exactly where responsibilities shift between you and your cloud provider, how that boundary changes across service models, and what happens in the real world when organizations get it wrong.

## What the Responsibility Model Actually Says

The shared responsibility model is not a suggestion or a best practice. It is the legal and operational foundation of every cloud engagement. When you sign an agreement with AWS, Azure, or GCP, you are agreeing to a division of labor. The provider secures the cloud. You secure what you put in the cloud. That division changes depending on how much of the stack you are using.

### Infrastructure as a Service (IaaS)

IaaS gives you raw compute. You get a virtual machine, some networking, maybe some block storage. Everything below that virtual machine is the provider's problem. Everything above it is yours.

In AWS terms, this means Amazon EC2. AWS handles the physical data centers, the physical network, the hypervisor, and the host operating system. You handle the guest operating system, the applications running on that OS, the firewall rules inside the instance, the data you store, the encryption of that data, the patching of the guest OS, and the IAM policies controlling who can access the instance.

A concrete example: you launch an Amazon Linux 2023 EC2 instance. AWS guarantees the physical security of the data center, the integrity of the hypervisor, and the availability of the underlying hardware. You are responsible for running `dnf update`, configuring the security group to allow only necessary traffic, setting up SSH key authentication instead of passwords, installing and configuring host-based intrusion detection, and ensuring the application on the instance does not have vulnerabilities.

The mistake most teams make with IaaS is treating the VM like a traditional server sitting in a rack. It is not. The networking layer is software-defined. The storage layer is API-driven. The identity layer is cloud-native. If you apply traditional server administration thinking to an EC2 instance, you will miss the cloud-specific risks.

### Platform as a Service (PaaS)

PaaS shifts more responsibility to the provider. With AWS Elastic Beanstalk, Azure App Service, or Google App Engine, the provider manages the OS, the runtime, the middleware, and the patching of all those layers. You bring your application code and your data.

But "more responsibility to the provider" does not mean "no responsibility for you." You still configure the application-level security. You still manage who can deploy code to the platform. You still control the data encryption. You still set up the network rules that determine which resources can talk to your PaaS service.

The tricky part about PaaS is that the responsibility boundary is not always obvious. When you run a Node.js application on Elastic Beanstalk, AWS patches the Node.js runtime. But if your `package.json` pulls in a vulnerable npm package, that is your problem. AWS does not scan your dependencies. When you run a .NET application on Azure App Service, Microsoft manages the .NET runtime installation. But if your application code has a SQL injection vulnerability, that is your code, your problem.

The most dangerous assumption in PaaS is that the provider handles "everything below the application." They do not. They handle the platform. You handle the application. The line between platform and application is thinner than most people realize.

### Software as a Service (SaaS)

SaaS looks like the provider handles everything. And in terms of infrastructure, they do. When your company uses Microsoft 365, Salesforce, or Slack, the provider manages the servers, the databases, the networking, the encryption, the patching, the physical security, all of it.

But you are still responsible for three critical things:

**Identity and Access Management.** The provider gives you the controls. You configure them. If you allow single-factor authentication for admin accounts in Microsoft 365, that is your misconfiguration, not Microsoft's.

**Data Classification.** The provider does not know which of your data is sensitive. If you upload unencrypted customer PII to a Salesforce instance and your Salesforce admin makes it publicly accessible, Salesforce did not fail you. You failed yourself.

**Configuration.** SaaS products have hundreds of configuration options. Most of them are secure by default. Some are not. In 2020, a major SaaS vendor had a default setting that allowed any authenticated user to view all documents in the organization. The vendor documented this. Most organizations did not read the documentation.

## The IaaS Boundary in Practice: AWS vs Azure vs GCP

The three major cloud providers draw the responsibility line in slightly different places. If you are working in a multi-cloud environment, you need to know these differences.

### AWS Responsibility Model

AWS draws the line explicitly in their Shared Responsibility Model documentation. Their boundary:

**AWS Responsible:**
- Hardware and AWS global infrastructure (regions, availability zones, edge locations)
- Software for compute, storage, database, and networking services
- Physical security of data centers (guards, cameras, access controls, environmental protections)
- Hypervisor and host operating system maintenance

**Customer Responsible:**
- Guest OS and all application-level software
- Client-side and server-side encryption of data
- Network traffic protection (encryption, integrity, identity)
- Operating system and network configuration
- Security group and NACL configuration
- IAM policies and access management
- Data classification and compliance

AWS defines specific sub-responsibilities within their services. For S3, for example: AWS manages the infrastructure, durability, and availability. You manage bucket policies, encryption configuration, access logging, versioning, and lifecycle policies. The 2019 Capital One breach demonstrated what happens when someone misconfigures a WAF service that has access to S3 buckets containing customer data.

AWS offers a "Customer Shared Responsibility Matrix" in their security documentation that maps each service to specific responsibilities. For EC2, you own everything from the hypervisor up. For RDS, AWS manages the database engine patching but you manage the data, encryption, and access controls. For Lambda, AWS manages everything except the function code and its configuration.

### Azure Responsibility Model

Azure's model follows the same principle but uses different terminology. Azure divides responsibilities into:

**Microsoft Managed:** Physical infrastructure, host OS, network controls, datacenter security
**Shared:** Identity and directory infrastructure (Azure AD), application platform, network controls
**Customer Managed:** Data, endpoints, account and identity management, application-level controls

The key difference from AWS is Azure's treatment of identity. Azure Active Directory (now Entra ID) is partially a shared service. Microsoft manages the Azure AD infrastructure, but you manage your tenant configuration, conditional access policies, MFA settings, and service principals. This shared ownership of identity creates confusion, particularly around who is responsible when an Azure AD compromise occurs.

Azure also has a more explicit model for platform services. For Azure SQL Database, Microsoft manages the database engine, backups, patching, and encryption at rest. You manage the data, the queries, the firewall rules, the auditing configuration, and the TDE (Transparent Data Encryption) key management if you bring your own key.

### GCP Responsibility Model

GCP follows a similar framework but with its own nuances. Google emphasizes "shared fate" rather than "shared responsibility," which is more than marketing language. Google provides security tooling (Security Command Center, Cloud Armor, Identity-Aware Proxy) and encourages customers to use it.

**Google Managed:** Physical infrastructure, network, hypervisor, host OS
**Shared:** Managed services (GKE, Cloud SQL, App Engine): Google manages the platform, you manage the configuration
**Customer Managed:** Data, IAM configuration, application code, encryption settings

GKE (Google Kubernetes Engine) illustrates the split well. Google manages the Kubernetes control plane, the master nodes, the etcd cluster, and the underlying infrastructure. You manage the worker nodes (unless you use Autopilot, where Google manages those too), the pod configurations, the network policies, the secrets, and the container images.

## When the Line Gets Blurred

The responsibility model gets complicated with newer services. Consider AWS Lambda. AWS manages the compute layer, the OS, the runtime, the patching, and the execution environment. You write the function code. But you also configure the IAM role that the function assumes, the VPC configuration that determines network access, the triggers that invoke the function, and the environment variables that may contain secrets.

The blurriness creates real security gaps. A common pattern: a team deploys a Lambda function that reads from an S3 bucket. The Lambda execution role needs read access to that bucket. The team gives the Lambda role `s3:GetObject` permission on `arn:aws:s3:::my-bucket/*`. They do not restrict the Lambda function to only the specific objects it needs. An attacker who compromises the Lambda function can now read every object in the bucket.

The provider did their job. The Lambda service is secure. The S3 service is secure. The gap was in the configuration that the customer was responsible for. The responsibility model says "you configure IAM." The customer configured IAM badly. The breach is the customer's fault.

## Real Breaches from Misunderstood Responsibilities

### The 2019 Capital One Breach

This is the textbook case. An attacker exploited a server-side request forgery (SSRF) vulnerability in a web application firewall deployed on AWS. The WAF had an IAM role that permitted it to read S3 bucket contents. The S3 buckets contained customer data for over 100 million people.

AWS was not breached. The WAF service was not compromised. The S3 service was not compromised. What was compromised was the customer's configuration: an overly permissive IAM role attached to a WAF service, combined with a vulnerable application that allowed SSRF.

The responsibility breakdown:
- AWS: responsible for the WAF service availability and security. They delivered it.
- Capital One: responsible for the IAM role permissions on the WAF. They set it too broadly.
- Capital One: responsible for the application code that had the SSRF vulnerability. They did not remediate it.

Over 100 million records exposed. $190 million settlement. The cloud provider did exactly what they were supposed to do. The customer did not.

### The 2023 Microsoft Exchange Online Breach (Storm-0558)

Chinese hackers compromised a Microsoft engineer's account and obtained a signing key that allowed them to forge authentication tokens for Exchange Online. They used these tokens to access email accounts of government officials and other high-value targets.

The debate about responsibility here is nuanced. Microsoft's infrastructure was compromised (the signing key was stolen), so Microsoft clearly failed in protecting a critical cryptographic asset. But customers also had responsibilities: configuring Conditional Access policies that could have limited the blast radius, enabling advanced threat protection, and monitoring for anomalous sign-in patterns.

Microsoft drew the line at "the signing key is ours, the key management is ours." They failed at their part. But many customers who were compromised had not implemented the available security controls that would have reduced the impact. Both sides failed, but Microsoft's failure was the proximate cause.

### The 2020 Twitter Bitcoin Scam

Attackers compromised internal Twitter tools by social-engineering employees. They used the tools to hijack high-profile accounts (Obama, Elon Musk, Bill Gates) and posted Bitcoin scam tweets.

Twitter's infrastructure was not breached in the traditional sense. The attackers got legitimate credentials through social engineering. Twitter's responsibility: implementing and enforcing MFA, restricting internal tool access, monitoring for anomalous admin actions. The attackers exploited gaps in Twitter's internal security controls, which were Twitter's responsibility under any reasonable interpretation of the shared responsibility model.

The key lesson: the shared responsibility model is not just about cloud infrastructure. It extends to organizational controls around cloud access.

## Shared Responsibility Anti-Patterns

### Anti-Pattern 1: "The Provider Handles Security"

This is the most common and most dangerous assumption. Teams migrate to the cloud and stop worrying about security because "AWS handles that." No, AWS handles the cloud. You handle security in the cloud.

The symptoms: no host-based firewalls on EC2 instances because "the security group handles it." No encryption of sensitive data in S3 because "AWS encrypts everything." No monitoring of IAM activity because "AWS logs everything."

The reality: security groups are stateful network filters, not encryption or authentication mechanisms. AWS encrypts data at rest by default with AWS-managed keys, but that only protects against physical media theft, not against compromised credentials. AWS logs IAM activity to CloudTrail, but CloudTrail logs do nothing unless someone monitors them or an automated system analyzes them.

### Anti-Pattern 2: "We Set It Up Once and It Is Done"

Cloud security is not a one-time configuration. It is an ongoing process. Services evolve. New features introduce new configuration options. New compliance requirements demand new controls. Teams change, and the new team member does not know why a certain configuration was set.

Concrete example: a company sets up a VPC with proper security groups and NACLs in 2022. In 2023, a developer launches a new service that needs a public endpoint. They create a new subnet, assign a public IP, and do not configure a security group. The subnet has a default NACL that allows all traffic. The service is now publicly accessible with no firewall rules.

Security in the cloud requires continuous validation. AWS Config rules, Azure Policy, and GCP Organization Policies exist because cloud configurations drift.

### Anti-Pattern 3: "We Use the Default Configuration"

Default configurations are designed for ease of adoption, not security. Default IAM policies are too permissive for production. Default security groups allow all inbound traffic from the same security group. Default S3 bucket policies may allow public access (though AWS has tightened this significantly since 2023). Default logging is often disabled or set to minimal levels.

Every default configuration should be reviewed and hardened before deployment. This is not optional. It is the minimum standard for cloud security.

### Anti-Pattern 4: "Encryption Is the Provider's Job"

Cloud providers offer encryption capabilities. They do not force you to use them. S3 default encryption (SSE-S3) has been enabled by default since January 2023, but that only covers data at rest. Data in transit between your application and S3 may not be encrypted if you do not enforce TLS. Data in your EBS volumes is encrypted by default in newer accounts, but older accounts may not have this enabled. RDS encryption must be explicitly enabled at instance creation time and cannot be added later without restoring from a snapshot.

Encryption is your responsibility to configure, manage, and maintain. The provider gives you the tools. You must use them.

### Anti-Pattern 5: "IAM Is Just About Users"

IAM in the cloud is not just about human users. It includes service accounts, roles, groups, policies, federation, cross-account access, resource-based policies, session policies, permission boundaries, and condition keys. Each of these has security implications.

A common failure: granting an IAM role to a service without scoping the role's permissions. The role for a CI/CD pipeline needs to push container images to ECR. The team gives the role `ecr:*` permissions. The pipeline now has administrative access to the entire ECR service, including the ability to delete repositories, modify image scan settings, and pull images from repositories it should not access.

## Building a Responsibility Matrix for Your Organization

The best practice is to create a concrete responsibility matrix for your specific cloud deployment. Here is a starting template:

**Compute (EC2/EKS/Lambda):**
- Provider: hypervisor, host OS, physical security, network infrastructure
- You: guest OS patching, application security, IAM roles, security groups, VPC configuration, encryption, logging

**Storage (S3/EBS/RDS):**
- Provider: infrastructure durability, availability, physical security
- You: bucket/volume/database policies, encryption configuration, access logging, lifecycle policies, backup configuration, IAM permissions

**Identity (IAM/Entra ID/Cloud Identity):**
- Provider: identity service infrastructure, availability
- You: user management, MFA configuration, conditional access policies, service account permissions, federation configuration, password policies

**Networking (VPC/VNet/Cloud VPC):**
- Provider: physical network, DDoS protection (basic), global infrastructure
- You: subnet design, routing, security groups, NACLs, VPN configuration, peering, Transit Gateway, DNS configuration

**Data:**
- Provider: encryption at rest infrastructure, durability
- You: classification, encryption key management, access controls, DLP configuration, backup strategy, retention policies

**Compliance:**
- Provider: certifications (SOC2, ISO 27001, FedRAMP, PCI DSS), physical compliance
- You: workload compliance, data residency, audit preparation, evidence collection, configuration compliance

## The Operational Reality

In practice, the responsibility model works like this: every security incident gets investigated, and someone has to decide who failed. If an EC2 instance is compromised because the guest OS was not patched, that is the customer's failure. If the hypervisor is compromised and allows guest-to-guest attacks, that is AWS's failure. If an S3 bucket is publicly exposed because the bucket policy allows public read access, that is the customer's failure. If S3 itself has a vulnerability that exposes data without the bucket policy being changed, that is AWS's failure.

The investigation process is where the responsibility model becomes real. When you are responding to an incident, you need to know immediately: was this a provider failure or a customer failure? Because the response is different. A provider failure means you are potentially affected across all your resources. A customer failure means you need to identify the specific misconfiguration and fix it.

This is why security teams need to understand the responsibility model deeply, not just theoretically. You need to know, for every service you use, exactly what you are responsible for. Not generally. Exactly. Because when the alarm goes off at 3 AM, "I thought AWS handled that" is not an acceptable answer.

## Key Takeaways

The cloud responsibility model is not a suggestion. It is the operational foundation of cloud security. Every team member, from the developer deploying a Lambda function to the CISO presenting to the board, must understand where the line is drawn for each service your organization uses.

The line shifts depending on the service model (IaaS, PaaS, SaaS). It shifts slightly between providers (AWS, Azure, GCP). It shifts as services evolve and providers add new managed capabilities. The only way to stay current is to review the responsibility model for each service regularly and document it for your specific deployment.

The breaches that make headlines are almost always customer failures, not provider failures. The cloud providers are securing the cloud. You must secure what you put in it.


## Practical Tips for Applying the Responsibility Model

Understanding the theory is important. Applying it to your daily work is what matters. Here are practical tips for applying the responsibility model in real environments.

### Document Your Responsibilities

For every AWS service your organization uses, document who is responsible for what. Create a simple table with three columns: service, provider responsibilities, customer responsibilities. Store this document in a central location and review it quarterly.

When a new service is introduced, review the responsibility model before deployment. Do not assume that because the previous service had certain responsibilities, the new service follows the same pattern. Each service is different.

### Conduct Responsibility Reviews

Schedule quarterly reviews of your responsibility assignments. As AWS releases new features and services, the responsibility boundary shifts. Features that were customer-managed may become provider-managed. New features may introduce new customer responsibilities.

During the review, ask these questions for each service: what changed since the last review? Are there new configuration options? Are there new compliance requirements? Has the service moved any responsibilities to the provider?

### Train Your Team

Every team member who works with cloud infrastructure must understand the responsibility model. This is not just for the security team. Developers who deploy Lambda functions must know what they are responsible for. Operations staff who manage EC2 instances must know what they are responsible for.

Create a short (one page) responsibility reference for your most-used services. Distribute it to all technical staff. Include it in onboarding materials for new hires.

### Use the Model for Incident Response

When a security incident occurs, the first question is: who failed? The responsibility model provides the answer. If the provider failed, you need to assess your exposure across all resources. If the customer failed, you need to identify the specific misconfiguration and fix it.

During incident response, categorize every finding as provider failure or customer failure. This determines the scope of your response and prevents you from wasting time investigating areas where you have no responsibility.

## Assessment

**Lab Task 1 (30 minutes):** Create a responsibility matrix for a three-tier web application on AWS consisting of an Application Load Balancer, EC2 instances in an Auto Scaling Group, an RDS MySQL database, and S3 for static assets. For each of the four components, list at least five specific responsibilities and assign them to either "AWS" or "Customer." Include at least two responsibilities that are genuinely shared.

**Lab Task 2 (45 minutes):** Using the AWS Management Console (or a sandbox account), audit an existing S3 bucket. Document every security control available for S3 (bucket policy, block public access, encryption, versioning, access logging, object lock) and determine whether each is enabled or disabled. For each disabled control, explain what risk it introduces and whether disabling it was a deliberate decision or an oversight.

**Lab Task 3 (30 minutes):** Review the AWS, Azure, and GCP shared responsibility documentation. For a PaaS service (Elastic Beanstalk, Azure App Service, or App Engine), create a side-by-side comparison of what each provider handles versus what the customer handles. Identify at least three responsibilities that differ between providers.

**Grading Criteria:**
- Matrix accuracy: are responsibilities correctly assigned? (30%)
- Risk analysis: does the S3 audit identify real risks? (25%)
- Provider comparison: does the PaaS comparison identify meaningful differences? (25%)
- Practical understanding: are the answers grounded in real configurations, not theory? (20%)

## Evidence

Document your work by saving:
1. Your completed responsibility matrix as a table (Task 1)
2. Screenshots of S3 bucket settings and your written analysis (Task 2)
3. Side-by-side comparison document (Task 3)

These artifacts demonstrate your ability to apply the shared responsibility model to real cloud environments. In a professional setting, this kind of documentation is what you would present to leadership to justify security investments and explain who owns each risk.
