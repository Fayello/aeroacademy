# Module 7 -- Serverless Security

## The Illusion That Someone Else Handles Security

Serverless computing removes the server from your operational concerns. You write a function, deploy it, and the cloud provider handles everything else: the operating system, the runtime, the scaling, the patching, the availability. AWS Lambda, Azure Functions, and Google Cloud Functions abstract away the entire infrastructure layer.

This abstraction creates a dangerous assumption: if the provider handles the infrastructure, they handle the security. They handle infrastructure security. You handle application security, configuration security, and access control. Serverless does not eliminate security responsibilities. It shifts them.

The attack surface in serverless is different from traditional compute. You do not have SSH to harden. You do not have firewalls to configure at the host level. But you have IAM roles to scope, event sources to validate, function permissions to restrict, secrets to manage, and dependencies to patch. A Lambda function with an overly permissive IAM role and an unvalidated event source is a vulnerability waiting to be exploited.

Serverless functions are also stateless. They spin up, process an event, and shut down. This means you cannot rely on traditional host-based security controls. You cannot install antivirus on a Lambda function. You cannot run a host-based intrusion detection system. Security must be baked into the function code, the IAM configuration, the event source configuration, and the monitoring infrastructure.

This module covers the security controls specific to serverless architectures, the attack patterns that target serverless functions, and the practices that keep serverless deployments secure.

## Lambda Function Permissions

Every Lambda function executes with an IAM role. This role determines what AWS resources the function can access. The principle of least privilege is even more critical in serverless because Lambda functions are invoked by events you do not fully control.

### Lambda Execution Role

The Lambda execution role is assumed by the Lambda service when it invokes your function. It determines what AWS API calls your function can make. When your function code calls the AWS SDK, the SDK retrieves credentials from the execution role and uses them to authenticate with AWS services.

An overly permissive role grants the Lambda function full access to every AWS service. If the function is compromised through an event injection attack, the attacker has full access to your AWS account. This is the serverless equivalent of giving an EC2 instance an IAM role with AdministratorAccess. In a 2024 incident at a SaaS company, a Lambda function with an overly permissive role was exploited through an unvalidated API Gateway event. The attacker used the Lambda to create IAM users, access S3 buckets containing customer data, and modify CloudTrail logs to cover their tracks. The total damage exceeded two million dollars.

A minimal role grants only the permissions the function needs. If the function reads from DynamoDB and writes to CloudWatch Logs, the role allows only dynamodb:GetItem, dynamodb:PutItem on the specific table, and logs:CreateLogStream, logs:PutLogEvents on the specific log group. Nothing else.

IAM Access Analyzer helps identify over-permissioned roles. Run Access Analyzer on your Lambda execution roles and review the findings. If a role allows actions that the function never performs, remove those actions. Over time, roles accumulate permissions that were once needed but are no longer used.

### Resource-Based Policies

Lambda functions also have resource-based policies that control who can invoke the function. By default, the function owner can invoke it. But if you want an API Gateway, an S3 bucket, or another Lambda function to invoke it, you must add a resource-based policy.

A resource-based policy that allows only a specific API Gateway stage to invoke the function uses a condition key AWS:SourceArn that matches the API Gateway ARN including the stage name. This prevents other API Gateways, other Lambda functions, or other AWS accounts from invoking the function.

Restrict invocation sources as tightly as possible. If a function should only be invoked by API Gateway, do not also allow invocation from S3 or SNS. Each invocation source is a potential attack vector.

### Lambda Function URLs and Permissions

Lambda function URLs provide a dedicated HTTPS endpoint for each function. This endpoint is public by default. If your function should only be invoked through API Gateway, do not create a function URL. If you do create one, configure authentication using IAM or resource-based policies.

Function URL with IAM auth means only authenticated AWS principals with lambda:InvokeFunction permission can invoke the URL. Unauthenticated requests are rejected. Function URL with NONE auth means anyone with the URL can invoke the function. This is appropriate for public APIs but dangerous for internal functions.

### Lambda Destinations and Dead Letter Queues

When a Lambda function fails, the event goes to a dead letter queue (DLQ) or a destination. DLQs are SQS queues or SNS topics that receive failed events. Configure DLQs for all production functions. Without a DLQ, failed events are lost and you have no visibility into failures.

Secure your DLQs. If a DLQ contains failed events with sensitive data, the DLQ must have appropriate access controls. An attacker who reads the DLQ gets access to all failed events, which may contain user data, payment information, or other sensitive content.

## API Gateway Security

API Gateway sits in front of Lambda functions and provides request validation, throttling, authentication, and authorization. It is the first line of defense for serverless APIs.

### Request Validation

API Gateway can validate requests before they reach your Lambda function. Define request models that specify required parameters, parameter types, and payload schemas. Invalid requests are rejected at the gateway with a 400 error, reducing the attack surface and preventing malformed input from reaching your function.

Request validation is schema validation, not security validation. It ensures the request has the expected structure. It does not ensure the values are safe. A request that passes schema validation can still contain SQL injection, cross-site scripting, or path traversal. Combine request validation with WAF rules for security validation.

### WAF Integration

API Gateway supports AWS WAF integration. Create a Web ACL with rules for rate limiting, SQL injection protection, cross-site scripting protection, and IP-based blocking. Associate the Web ACL with your API Gateway stage.

WAF rules for API Gateway should include a rate-based rule to prevent abuse (limit requests per IP per 5-minute window), managed rule groups for SQL injection and XSS (AWSManagedRulesCommonRuleSet and AWSManagedRulesSQLiRuleSet), and custom rules for application-specific threats such as detecting automated scraping, credential stuffing, or parameter tampering.

### API Keys and Usage Plans

API keys control who can access your API. Usage plans control how much they can access it. This is not a security control in the traditional sense (API keys are not authentication), but it provides throttling and quota enforcement.

For true authentication, use Amazon Cognito user pools or Lambda authorizers. Cognito handles user registration, login, and token management. Lambda authorizers validate custom tokens, OAuth tokens, or other authentication mechanisms. Lambda authorizers run before the integration Lambda, providing an authentication and authorization layer that is separate from the business logic.

### CORS Configuration

Cross-Origin Resource Sharing (CORS) configuration controls which domains can call your API from a browser. Restrictive CORS policies prevent your API from being called from unauthorized domains.

A restrictive CORS configuration specifies only your exact domain in Allow-Origin, not a wildcard. It specifies only the HTTP methods your API supports in Allow-Methods. It specifies only the headers your API requires in Allow-Headers. It sets Allow-Credentials to true only if you need cookies or HTTP authentication. It sets Max-Age to control how long the preflight response is cached.

A wildcard Allow-Origin with Allow-Credentials true is a security vulnerability. It allows any domain to make authenticated requests to your API. Never use this configuration in production.

### mTLS for API Gateway

For APIs that require mutual TLS authentication, API Gateway supports mTLS. Clients present a certificate during the TLS handshake, and API Gateway validates it against a trust store. This is useful for service-to-service communication where both parties need to prove their identity.

Configure mTLS by creating a trust store in S3 containing the CA certificates, then reference it in the API Gateway domain name configuration. API Gateway rejects connections from clients whose certificates are not signed by a trusted CA.

## Lambda Layer Vulnerabilities

Lambda layers are ZIP archives that contain shared code, libraries, or custom runtimes. Layers are useful for sharing common dependencies across multiple functions. But layers introduce a security risk: a vulnerable or malicious layer affects every function that uses it.

### Layer Security Risks

Shared vulnerability means if a layer contains a vulnerable library, every function using that layer is vulnerable. A vulnerability in a layer might affect dozens of functions across multiple accounts if the layer is shared.

Supply chain attacks mean if an attacker gains access to your layer publishing process, they can inject malicious code into a layer. Every function that updates to the compromised layer is now running malicious code. This is particularly dangerous because layers are often shared across multiple teams and accounts.

Persistence means layers are cached and versioned. Even after you publish a patched layer, functions using an older version continue running the vulnerable version. You must explicitly update every function to use the new layer version.

### Layer Security Best Practices

Pin layer versions by never using $LATEST for production functions. Pin to a specific version number. When you need to update, publish a new version and update all functions to reference the new version. Use SSM Parameter Store to track the current approved layer version. Functions read the parameter at startup and use the specified version. When you update the parameter, all functions pick up the new version on their next cold start.

Scan layers for vulnerabilities using the same scanning tools you use for container images. Scan layer ZIP archives for known vulnerabilities before publishing. Use tools like safety, pip-audit, or npm audit depending on the layer contents.

Restrict layer publishing with IAM policies. Only the security team or CI/CD pipeline should be able to publish layers. Developers should be able to test layers in development but not publish to production.

Monitor layer usage with AWS Config. Track which functions use which layer versions. When a vulnerable layer is identified, you can immediately identify all affected functions and prioritize remediation.

## Event Injection Attacks

Serverless functions are invoked by events. These events come from API Gateway, S3, DynamoDB Streams, SNS, SQS, and dozens of other sources. Each event source has its own event structure. If your function does not validate the event structure, an attacker can craft a malicious event that exploits your function.

### S3 Event Injection

When an S3 bucket receives an object, it can trigger a Lambda function with an event containing the bucket name, object key, and other metadata. If your function does not validate the event, an attacker who can upload objects to the bucket can control which objects the function processes.

A vulnerable function extracts the bucket and key from the event and processes the object without validation. An attacker uploads an object to a different bucket and crafts an event that references it. The function processes the attacker-controlled object, potentially reading sensitive data or executing unintended operations.

A secure function validates that the bucket name matches the expected bucket, the key starts with the expected prefix, and the object size is within expected bounds. If any validation fails, the function raises an error and does not process the event.

### API Gateway Event Injection

API Gateway events contain headers, query parameters, path parameters, and body. Each of these is a potential injection vector.

Common injection patterns include SQL injection through query parameters, path traversal through path parameters, JSON injection through malformed request bodies, and header injection through custom headers.

Defense requires validating all input at the API Gateway level using request models and WAF rules. Then validate again in the Lambda function. Do not trust that API Gateway validation is sufficient. API Gateway validation is schema validation, not security validation. A request with valid structure can still contain malicious values.

### SQS Event Injection

SQS events contain messages from other services. If your Lambda function processes SQS messages and writes to a database, an attacker who can send messages to the SQS queue can control what gets written.

A vulnerable pattern parses the message body and writes it directly to DynamoDB without validation. An attacker sends a message with a crafted body that overwrites existing records or injects new data.

Defense requires validating the message structure against a schema. Reject messages that do not conform. Use SQS queue policies to restrict who can send messages. Implement maximum message size limits and message retention periods.

### Cross-Service Event Chains

Serverless architectures often chain events across multiple services. An S3 upload triggers a Lambda that writes to DynamoDB that triggers another Lambda that sends an SNS notification. Each step in the chain is a potential injection point.

An attacker who can trigger the first event in the chain can potentially influence all subsequent events. Validate at every step. Do not assume that upstream validation is sufficient. Each function should independently validate its input.

## Real Scenario: Lambda Function Exploited via Event Injection

In 2021, a fintech company deployed a Lambda function that processed payment webhooks from a third-party payment processor. The function was triggered by API Gateway, which received POST requests from the payment processor's IP addresses.

The function trusted the event body completely. It parsed the JSON body, extracted the payment amount and recipient, and initiated a transfer through the company's banking API. The function had an IAM role that granted it access to the banking API's Secrets Manager secret and the ability to invoke another Lambda function that finalized transfers.

The attacker discovered that the API Gateway was configured with an open CORS policy. The attacker created a malicious webpage that sent POST requests to the API Gateway endpoint from the attacker's browser. The API Gateway received the request and forwarded it to the Lambda function.

The attacker crafted a payment event body that specified a different recipient account. The Lambda function processed the event without validating the source or the recipient. It invoked the banking API and initiated a transfer to the attacker's account.

The attack worked because of multiple security failures. First, the API Gateway did not validate that requests came from the payment processor's IP addresses. A simple WAF rule with IP restriction would have blocked the attacker. Second, the Lambda function did not validate the event body against a known schema. It trusted whatever JSON was in the request body. Third, the Lambda function's IAM role was too broad. It could both read secrets and invoke the transfer function. If it could only read secrets and a separate function handled transfers with additional validation, the attack would have been harder. Fourth, there was no anomaly detection on the banking API. A sudden change in transfer recipients should have triggered an alert.

What fixed it. Added WAF rules to the API Gateway restricting source IPs to the payment processor. Implemented JSON schema validation at the API Gateway level. Added event body validation in the Lambda function checking recipient against a whitelist. Split the IAM role into two: one for secret retrieval, one for transfer initiation. Added CloudWatch alarms for unusual banking API patterns. Implemented request signing where the payment processor signs each request and the Lambda function verifies the signature.

The total cost of remediation was roughly 40 engineering hours plus the fraudulent transfers. The attack was discovered only because the accounting team noticed unusual transfer patterns during reconciliation. Automated monitoring would have caught it faster.

## Serverless Security Architecture Patterns

### Defense in Depth for Lambda

Layer 1 is API Gateway with WAF. This handles rate limiting, IP blocking, and basic input validation before requests reach Lambda.

Layer 2 is API Gateway request validation. This ensures the request structure matches expected schemas.

Layer 3 is Lambda authorizer. This handles authentication and authorization before the business logic Lambda executes.

Layer 4 is the business logic Lambda. This validates input again, applies business rules, and makes AWS service calls.

Layer 5 is IAM role scoping. This ensures the Lambda can only access the specific AWS resources it needs.

Layer 6 is monitoring and alerting. CloudTrail logs all API calls. CloudWatch Logs captures function logs. GuardDuty detects anomalous patterns. EventBridge triggers automated responses.

### Secrets Management Pattern

Store secrets in AWS Secrets Manager. Reference them in the Lambda function using the AWS SDK. Do not pass secrets as environment variables (they appear in the Lambda configuration and CloudWatch Logs). Do not hardcode secrets in function code. Do not pass secrets through API Gateway (they appear in request and response logs).

The Lambda execution role needs secretsmanager:GetSecretValue permission on the specific secret ARN. The function retrieves the secret at runtime, uses it, and discards it from memory. For high-frequency functions, consider caching the secret in memory with a TTL to reduce Secrets Manager API calls.


## Serverless Security Anti-Patterns

Understanding common anti-patterns helps you avoid mistakes that lead to breaches.

### Anti-Pattern 1: The God Function

A Lambda function that does everything: reads from S3, writes to DynamoDB, sends emails through SES, calls external APIs, and manages SQS queues. This function has an IAM role with permissions to all these services. If any one part of the function is vulnerable, the attacker gets access to everything.

**The fix:** Split the function into smaller functions, each with a single responsibility. The S3 reader reads from S3. The DynamoDB writer writes to DynamoDB. Each function has its own IAM role with only the permissions it needs. If the S3 reader is compromised, the attacker cannot access DynamoDB.

### Anti-Pattern 2: Trusting Event Data

A Lambda function that processes SQS messages and writes the message body directly to a database without validation. The function trusts that the message body is well-formed and safe. An attacker who can send messages to the queue can inject arbitrary data.

**The fix:** Validate every field in every event. Check data types, lengths, formats, and ranges. Use JSON schema validation for structured events. Reject events that do not match the expected schema.

### Anti-Pattern 3: Hardcoded Configuration

A Lambda function with database connection strings, API keys, and other secrets hardcoded in the function code. The function code is stored in a Git repository. Anyone with repository access can see the secrets.

**The fix:** Store secrets in AWS Secrets Manager or SSM Parameter Store. Reference them in the function using the AWS SDK. The function retrieves secrets at runtime and does not store them in code. Never commit secrets to version control.

### Anti-Pattern 4: No Monitoring

A Lambda function that processes payments but has no CloudWatch alarms, no error tracking, and no access logging. When the function fails, nobody knows. When the function is accessed by an unauthorized party, nobody detects it.

**The fix:** Enable CloudWatch Logs for all functions. Create CloudWatch alarms for error rates, duration, and invocation counts. Enable X-Ray tracing for performance monitoring. Log all access events to CloudTrail.

### Anti-Pattern 5: Shared Lambda Layers Without Governance

A Lambda layer containing a shared utility library is used by 50 functions across 10 teams. The layer has not been updated in two years. It contains three known vulnerabilities. All 50 functions are vulnerable.

**The fix:** Track layer usage with AWS Config. Scan layers for vulnerabilities regularly. Implement a patching process that updates all affected functions when a layer vulnerability is discovered. Use SSM Parameter Store to track the approved layer version.

## Serverless Monitoring and Observability

Monitoring serverless functions requires different approaches than monitoring traditional servers. You cannot SSH into a Lambda function to check its health. You cannot install a monitoring agent. All monitoring must be done through cloud-native services.

### CloudWatch Metrics for Lambda

Lambda publishes metrics to CloudWatch automatically. Key metrics include:

- **Invocations:** Number of times the function was invoked. Sudden spikes may indicate abuse.
- **Errors:** Number of invocations that resulted in an error. High error rates indicate bugs or misconfigurations.
- **Throttles:** Number of invocations that were throttled due to concurrency limits. Throttles may indicate a denial-of-service attack or a runaway process.
- **Duration:** How long the function ran. Increasing duration may indicate a performance issue or a resource exhaustion attack.
- **IteratorAge:** For DynamoDB Stream triggers, how far behind the stream the function is processing. High iterator age indicates the function cannot keep up with the stream.

### CloudWatch Alarms for Lambda

Create alarms for:
- Error rate exceeding 1% of invocations
- Throttles exceeding 0 (any throttle is worth investigating)
- Duration exceeding 80% of the configured timeout
- Invocations exceeding a normal baseline (may indicate abuse)

### X-Ray Tracing

AWS X-Ray provides distributed tracing for Lambda functions. X-Ray traces the request from the API Gateway through the Lambda function to downstream services. It shows the time spent in each step, identifies bottlenecks, and captures errors.

Enable X-Ray tracing for all production Lambda functions. The performance overhead is minimal (typically less than 1ms per invocation). The visibility into request flow is invaluable for debugging and security analysis.

## Assessment

**Lab Task 1 (45 minutes):** Create a Lambda function with a minimal IAM role that reads from one specific S3 bucket and writes to one specific DynamoDB table. Test that the function can read and write as expected. Then test that the function cannot access a different S3 bucket or a different DynamoDB table. Document the IAM policy, the test results, and the error messages for denied actions.

**Lab Task 2 (60 minutes):** Create an API Gateway with a Lambda proxy integration. Implement request validation using a JSON schema that requires specific fields and data types. Deploy the API and test with valid and invalid requests. Then add a WAF Web ACL with a rate-based rule and a SQL injection rule. Test that rate limiting and SQL injection blocking work. Document each configuration step and test result.

**Lab Task 3 (60 minutes):** Create a Lambda function triggered by an S3 event. Implement event validation that checks the bucket name, object key prefix, and object size against expected values. Test by uploading objects that match the expected values and objects that do not. Verify that the function processes valid objects and rejects invalid ones. Then test an event injection scenario by manually invoking the function with a crafted event that specifies a different bucket. Document the validation logic and test results.

**Lab Task 4 (45 minutes):** Create a Lambda layer with a Python library. Publish the layer and attach it to a Lambda function. Then scan the layer for vulnerabilities using a tool like safety or pip-audit. Identify any vulnerable dependencies. Update the layer with patched dependencies, publish a new version, and update the function. Document the vulnerability findings, remediation steps, and verification.

**Grading Criteria:**
- IAM role scoping: does the Lambda role follow least privilege? (25%)
- API Gateway security: does validation and WAF correctly protect the API? (25%)
- Event injection: does the function correctly validate and reject malicious events? (25%)
- Layer security: are vulnerabilities identified and remediated correctly? (25%)

## Evidence

Save the following as evidence:
1. Lambda IAM policy, test results for allowed and denied actions (Task 1)
2. API Gateway configuration, validation schema, WAF rules, and test results (Task 2)
3. Lambda function code with event validation and test results for valid and invalid events (Task 3)
4. Layer vulnerability scan results and remediation documentation (Task 4)
