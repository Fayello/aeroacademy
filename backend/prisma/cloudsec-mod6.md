# Module 6 -- Container Security

## The Security Gap Between "It Works" and "It Is Secure"

Containers changed how we build and deploy software. A developer packages an application and its dependencies into a container image, pushes it to a registry, and deploys it to a cluster. The container runs the same way in development, staging, and production. The operational benefits are enormous.

The security implications are less obvious but equally enormous. A container is a process. It runs on a host operating system. It shares the host kernel. It can access the network. It can read files. It can execute system calls. If an attacker compromises a container, they may be able to escape to the host, access other containers, or pivot to the network. The container abstraction creates a false sense of isolation.

In a traditional deployment model, you harden a server, put it behind a firewall, and monitor it. With containers, you might have hundreds of lightweight environments running on the same host. Each one is an attack surface. Each one can be exploited. And because containers are ephemeral, they disappear and reappear constantly, making forensic analysis harder.

This module covers the security controls available for containerized workloads in AWS, the real vulnerabilities that affect container environments, and the practices that keep container deployments secure. We focus on ECR, ECS, and EKS because these are the dominant container platforms in AWS environments, but the principles apply to any container orchestration system.

## Container Image Security

The container image is the atomic unit of deployment. If the image is vulnerable, everything deployed from it is vulnerable. Image security starts at build time and continues through the entire lifecycle. An image is a read-only template containing the application code, runtime, libraries, and file system changes. When you run a container, you add a writable layer on top. But the base image layers are immutable. If a vulnerability exists in a base layer, it persists across every container created from that image.

### ECR Image Scanning

Amazon Elastic Container Registry (ECR) provides native image scanning using Amazon Inspector. When enabled, ECR scans images for known vulnerabilities in the operating system packages and application dependencies.

Two scan types are available. Basic scan checks for known vulnerabilities in the base image OS packages. It is fast, free, and runs automatically on push. Enhanced scan checks for vulnerabilities in OS packages and application dependencies including npm, pip, maven, and nuget packages. It uses Amazon Inspector and takes longer but provides deeper analysis at a cost per image scanned.

To enable enhanced scanning, use the AWS CLI command put-registry-scanning-configuration with scan type ENHANCED, a wildcard filter matching all repositories, and SCAN_ON_PUSH frequency. This scans every image pushed to ECR immediately after push. You can also configure scan-on-push filters to target specific repositories if you want to control scanning costs.

Scan findings use severity levels. CRITICAL means exploitable with high impact, requiring immediate patching. HIGH means exploitable with significant impact, requiring patching within days. MEDIUM means exploitable with moderate impact, requiring patching within weeks. LOW means low exploitability or impact, suitable for maintenance windows. INFORMATIONAL means not a vulnerability but noted for awareness.

The severity scoring uses the Common Vulnerability Scoring System (CVSS) and additional factors like whether the vulnerability is being actively exploited in the wild. A CRITICAL finding does not always mean your specific deployment is at immediate risk. Context matters. A vulnerability in a package that your application does not use is lower risk than the same vulnerability in a package that handles user input. But do not use that reasoning to avoid patching. Patch everything.

When ECR scan finds vulnerabilities, you have three remediation options. Update the base image to a version without the vulnerability. Update the vulnerable package to a patched version. Or accept the risk by documenting the decision and implementing compensating controls. Risk acceptance should be rare and always documented with a justification, an expiration date, and compensating controls.

### Base Image Selection

The base image determines the starting point for your container security posture. Every package in the base image is a potential vulnerability. The more packages you include, the more attack surface you expose.

Best practices for base images include using minimal base images such as alpine, distroless, or scratch for Go binaries. Pin base image versions rather than using the latest tag. Using latest means your builds are non-reproducible and you cannot guarantee what base image you are running. Use images from trusted publishers such as AWS, Google, or official Docker Hub images. Rebuild images regularly to pick up security patches. A base image that was clean when you built it six months ago may have dozens of known vulnerabilities today. Use multi-stage builds to minimize the final image size and reduce attack surface.

Consider a Python application with three base image options. The full python:3.12 image is roughly 1 GB with 400 or more packages and typically 50 to 100 vulnerabilities. The python:3.12-slim image is roughly 150 MB with 100 or more packages and 10 to 30 vulnerabilities. The python:3.12-alpine image is roughly 50 MB with 50 or more packages and 5 to 15 vulnerabilities. Fewer packages means fewer potential vulnerabilities. Choose the smallest base image that meets your needs.

For Go applications, the scratch base image contains nothing. Your compiled binary is the entire image. This is the most secure option because there are zero OS packages to vulnerabilities. The trade-off is that you have no shell, no package manager, and no debugging tools. For production, that trade-off is usually acceptable.

### Image Signing and Verification

ECR supports image signing using AWS Signer. When enabled, images are signed during the build process and verified before deployment. This prevents tampered images from being deployed to your cluster.

The image signing workflow starts when you build the image and push it to ECR. ECR invokes AWS Signer to sign the image and stores the signature alongside the image. When EKS or ECS deploys the image, it verifies the signature. Deployment fails if the signature is invalid or missing. This ensures that only verified, untampered images run in your cluster.

Image signing is not enabled by default. You must configure it explicitly. The signing uses the Notary v1 or Cosign format. Choose the format based on your tooling and compatibility requirements.

### Enforcing Image Policies

Use ECR repository policies to enforce image deployment rules. For example, require that all images are scanned before they can be pulled. Or restrict pull access to specific IAM roles or service accounts.

An ECR repository policy that denies pulling unscanned images checks whether the image scan status is not COMPLETE. This prevents deployment of images that have not completed scanning. Repository policies are resource-based policies attached to individual repositories. They are evaluated alongside IAM policies.

ECR also supports lifecycle policies that automatically clean up old images. Lifecycle policies can delete images after a specified number of days, keep only the last N images, or delete images with a specific tag prefix. This reduces the attack surface by removing old, potentially vulnerable images from the registry.

## ECS and EKS Task Execution Roles

When ECS or EKS runs a container, it assumes a task execution role to pull images from ECR, write logs to CloudWatch, and retrieve secrets. The permissions of this role determine what the container infrastructure can access.

### ECS Task Execution Role

The task execution role is assumed by the ECS agent running on the EC2 instance or the Fargate runtime. It performs tasks on behalf of your container such as pulling images and writing logs. It is distinct from the task role which is assumed by the application inside the container. This distinction is critical. The execution role handles what the ECS agent needs. The task role handles what your application code needs.

A minimum task execution role policy grants only the permissions needed. It should allow ecr:GetAuthorizationToken on all resources to authenticate with ECR. It should allow ecr:BatchCheckLayerAvailability, ecr:GetDownloadUrlForLayer, and ecr:BatchGetImage on the specific ECR repository containing your application image. It should allow logs:CreateLogStream and logs:PutLogEvents on the specific CloudWatch Logs group for your application. And it should allow secretsmanager:GetSecretValue on the specific secrets manager path for your application secrets.

This policy grants the task execution role permission to pull images from one specific ECR repository, write logs to one specific log group, and retrieve secrets from one specific secrets path. It does not grant access to other repositories, log groups, or secrets.

A common mistake is giving the execution role ecr:* permissions. This allows the execution role to delete repositories, modify image scan settings, and access images from repositories it should not access. The execution role needs read access to pull images, not administrative access to manage repositories.

### ECS Task Role

The task role is assumed by the application inside the container. If your application reads from S3, the task role grants that access. A minimum task role policy for an application reading from S3 allows only s3:GetObject on the specific bucket and prefix the application needs. The application cannot access other S3 buckets, DynamoDB tables, or any other AWS service.

The separation between task execution role and task role is critical. The execution role handles infrastructure concerns. The task role handles application permissions. Mixing them creates overly permissive roles that violate least privilege. If an attacker compromises the application, they get the task role permissions, not the execution role permissions. This limits the blast radius.

### EKS Service Accounts (IRSA)

EKS uses IAM Roles for Service Accounts (IRSA) to map Kubernetes service accounts to IAM roles. This allows pods running in EKS to assume specific IAM roles without embedding AWS credentials in the container.

The IRSA configuration requires creating an IAM role with a trust policy that allows the Kubernetes OIDC provider to assume it. The trust policy specifies the OIDC provider ARN and uses a condition to restrict the role to a specific Kubernetes service account in a specific namespace. You annotate the Kubernetes service account with the IAM role ARN. When a pod uses that service account, the AWS SDK automatically retrieves temporary credentials from the IAM role.

The security benefit is significant. Each pod gets its own IAM credentials with scoped permissions. A compromised pod can only access the resources granted to its service accounts IAM role. If the pod needs S3 access and DynamoDB access, you create two separate roles and mount both service accounts. The pod never gets more permissions than explicitly granted.

Without IRSA, the alternative is to use node-level IAM roles, which means every pod on a node shares the same IAM permissions. A compromised pod on a node with a broad IAM role can access everything that role can access. IRSA eliminates this problem by giving each pod its own role.

### Pod Security Standards

Kubernetes Pod Security Standards define three levels of security for pods: privileged, baseline, and restricted. The restricted level is the most secure and should be the default for production workloads.

The restricted standard requires containers to run as non-root, prevents privilege escalation, drops all Linux capabilities except NET_BIND_SERVICE, and requires seccomp profiles. It also restricts volume types, prevents host path mounts, and requires security contexts on all containers. The baseline level is less restrictive but blocks the most dangerous configurations like running as root with host access. The privileged level allows everything, which should only be used for system-level pods that genuinely need it.

Apply pod security standards using PodSecurity admission controllers. In Kubernetes 1.25 and later, PodSecurityPolicies are removed and replaced by PodSecurity admission. The admission controller enforces pod security at the namespace level, rejecting pods that do not meet the required standard. Configure it with audit and warn modes first to identify violations before enforcing.

## Secrets in Containers

Containers need secrets like database passwords, API keys, and TLS certificates. Hardcoding secrets in container images is a critical vulnerability. Image registries, even private ones, are not a secret store. Secrets in images persist in the image layers and can be extracted by anyone with pull access.

### AWS Secrets Manager with EKS

The AWS Secrets Store CSI Driver allows Kubernetes pods to mount secrets from AWS Secrets Manager as files in the pod filesystem.

The configuration requires installing the Secrets Store CSI Driver on the cluster using Helm or kubectl. Then create a SecretProviderClass resource that maps Secrets Manager secrets to Kubernetes volume mounts. The SecretProviderClass specifies the AWS provider, the secret ARNs or names, and the mount paths inside the container. You can also specify a rotation strategy that refreshes the mounted secrets periodically.

In the pod spec, reference the volume and volume mount. The secrets appear as files at the specified mount path. The application reads them like any other file. When the secret is rotated in Secrets Manager, the CSI driver updates the mounted file automatically. The application must handle file changes gracefully, typically by re-reading the secret file on each use or watching for file changes.

### AWS Secrets Manager with ECS

For ECS, secrets are injected as environment variables or mounted as files using the secrets configuration in the task definition. The task execution role needs secretsmanager:GetSecretValue permission on the specific secret ARNs.

The task definition references secrets using the secrets field with valueFrom pointing to the Secrets Manager ARN. The container receives the secret as an environment variable. This keeps secrets out of the task definition and image, which is essential because task definitions and images are often stored in version control or shared across environments. Never hardcode secrets in the task definition JSON itself.

### External Secrets Operator

For teams that want a Kubernetes-native interface to AWS Secrets Manager, the External Secrets Operator synchronizes secrets from external stores into Kubernetes secrets. It watches for ExternalSecret resources and creates corresponding Kubernetes secrets.

The advantage is that applications can reference standard Kubernetes secrets without knowing where the secrets are stored. The External Secrets Operator handles the synchronization. When a secret rotates in Secrets Manager, the operator updates the Kubernetes secret, and the pod picks up the new value. The operator supports refresh intervals to control how quickly changes propagate.

### Secret Rotation

Static secrets are a liability. If a secret is compromised, it remains valid until manually rotated. AWS Secrets Manager supports automatic rotation using Lambda functions. Configure the rotation schedule, and Secrets Manager calls the Lambda function to generate a new secret value on the configured interval.

For database credentials, Secrets Manager can rotate automatically by creating a new password, updating the database, and updating the secret value. The rotation Lambda handles the entire lifecycle: generate new password, update the database user, update the secret value, and verify the new credentials work. For API keys, rotation may require calling the API providers key management endpoint. For TLS certificates, ACM handles rotation automatically for public certificates.

## Container Runtime Security

Container runtime security monitors containers while they are running. It detects anomalous behavior such as unexpected process execution, file system modifications, or network connections. Runtime security is the last line of defense when image scanning and admission controls fail.

### Amazon EKS Audit Logging

EKS captures audit logs from the Kubernetes API server. These logs record all API requests including who made the request, what was requested, and whether it was allowed. Enable EKS audit logging and stream the logs to CloudWatch Logs for analysis.

EKS audit logging supports four audit policy levels. None disables logging. Metadata logs request metadata without request or response body. Request logs request body but not response body. RequestResponse logs both request and response body. For security, use the RequestResponse level for sensitive resources such as secrets, configmaps, and role bindings. Use Metadata for less sensitive resources to reduce log volume and cost.

Query EKS audit logs in CloudWatch Logs Insights to detect suspicious activity. For example, find all attempts to create cluster-admin role bindings, find all exec requests into pods, or find all unauthorized access attempts. These queries help identify reconnaissance, lateral movement, and privilege escalation.

### Falco for Runtime Detection

Falco is an open-source runtime security tool that detects anomalous behavior in containers. It monitors system calls, Kubernetes audit logs, and container runtime events. Falco rules define patterns that indicate security threats such as a container running an unexpected process, writing to a sensitive file, or making an unexpected network connection.

Falco can run as a DaemonSet on EKS nodes, monitoring all containers on each node. It generates alerts when rule conditions are met. Integrate Falco with Falcosidekick to route alerts to Slack, PagerDuty, or AWS Security Hub. Falco rules are customizable and you should tune them for your environment to reduce false positives.

### GuardDuty for Container Threat Detection

GuardDuty EKS Protection monitors Kubernetes audit logs for suspicious activity. It detects tactics like credential access attempts, discovery operations, and persistence mechanisms. GuardDuty findings for EKS include UnauthorizedAccess:EKS/CommandLineInContainer for command execution inside containers, and Policy:EKS/AdminAccessToDefaultServiceAccount for overly permissive service account access.

Enable GuardDuty EKS Protection in each region where you have EKS clusters. GuardDuty analyzes the Kubernetes audit log events and correlates them with threat intelligence to identify genuine threats versus benign administrative activity.

## Real Scenario: Container Escape Vulnerability

In August 2019, a container escape vulnerability CVE-2019-5736 was discovered in runc, the container runtime used by Docker and Kubernetes. The vulnerability allowed an attacker with root access inside a container to overwrite the host runc binary and execute arbitrary commands on the host system.

A real-world exploitation scenario played out when a cryptocurrency mining operation compromised a Kubernetes cluster by exploiting this vulnerability. The attack chain started when an attacker gained access to a container through a vulnerable web application. The web application had a remote code execution vulnerability in an image processing library. The attacker uploaded a malicious image that exploited the RCE vulnerability and executed a shell inside the container.

Inside the container, the attacker checked the runc version and confirmed it was vulnerable. The attacker then executed a specially crafted command that overwrote the runc binary on the host with a malicious version. When the container was restarted or another container was created on the same node, the malicious runc binary executed, giving the attacker root access on the host node.

With host access, the attacker could read the Kubernetes service account token mounted on the node. This token had permissions to list and create pods in the default namespace. The attacker used these permissions to create new pods with host path mounts, accessing the entire host filesystem. From there, the attacker pivoted to other nodes and eventually accessed the etcd cluster containing all cluster secrets.

The cryptocurrency mining operation consumed significant compute resources, which triggered billing alerts. The investigation revealed the full attack chain.

What would have prevented this attack. First, the web application vulnerability should have been patched. Regular image scanning and vulnerability management would have caught it. Second, the container should not have run as root. Running containers as non-root prevents the runc overwrite because only root can overwrite the runc binary. Third, the Kubernetes service account token should not have been mounted on the node. In Kubernetes 1.24 and later, automountServiceAccountToken can be set to false for pods that do not need API access. Fourth, pod security standards should have restricted the container from running as root and escalating privileges. Fifth, runtime monitoring with Falco would have detected the unusual process execution inside the container and the file system modification on the host.

The key takeaway is that container security is a defense-in-depth problem. No single control prevents all attacks. Image scanning catches known vulnerabilities. Non-root execution prevents privilege escalation. Network policies prevent lateral movement. Runtime monitoring detects exploitation. Secret management prevents credential theft. All of these layers must work together.

## Assessment

**Lab Task 1 (60 minutes):** Set up ECR with enhanced scanning enabled. Build a Docker image with a known vulnerable base image such as an older version of Ubuntu or a Python image with outdated packages. Push the image to ECR. Wait for the scan to complete. Review the findings and document each vulnerability with its severity, the affected package, and the fix. Then update the base image to a patched version, rebuild, push, and verify the scan results improve.

**Lab Task 2 (60 minutes):** Deploy an EKS cluster. Create a namespace called production. Apply a default deny network policy that blocks all ingress and egress. Deploy a frontend and backend application. Create a network policy that allows frontend to reach backend on port 8080 and allows backend to reach a database on port 5432. Verify that frontend cannot reach the database directly. Document each step and the verification results.

**Lab Task 3 (45 minutes):** Configure IRSA for a pod that needs to read from a specific S3 bucket. Create the IAM role with a trust policy restricting it to a specific service account. Create the Kubernetes service account with the IAM role annotation. Deploy a pod using that service account and verify it can read from S3. Then deploy a pod using a different service account and verify it cannot read from S3.

**Lab Task 4 (45 minutes):** Set up ECR image signing. Push an image and verify it is signed. Attempt to deploy the signed image to EKS. Then modify the image locally without going through the signing process, push it under a different tag, and attempt to deploy it. Verify that the unsigned or tampered image is rejected.

**Grading Criteria:**
- ECR scanning: is scanning correctly configured and findings properly remediated? (25%)
- Network policies: do the policies correctly segment traffic? (25%)
- IRSA: does the IAM role mapping work correctly and enforce least privilege? (25%)
- Image signing: does the signing and verification process prevent tampered images? (25%)

## Evidence

Save the following as evidence:
1. ECR scan results before and after remediation with vulnerability documentation (Task 1)
2. Network policy YAML files and verification test results showing correct segmentation (Task 2)
3. IRSA configuration and pod access test results (Task 3)
4. Image signing configuration and tampered image rejection logs (Task 4)
