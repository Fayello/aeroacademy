# Module 7 — Serverless Security: Lambda and API Gateway

## What You'll Actually Do

You'll deploy Lambda functions with proper IAM roles, configure API Gateway with authentication, and audit serverless applications for common vulnerabilities. Serverless shifts the security model — you don't patch servers anymore, but you still have to secure everything around the function.

## Lambda Security Fundamentals

Lambda functions run in AWS's managed environment. You don't patch the OS, but you do control:

- The function code and dependencies
- The IAM role attached to the function
- The triggers that invoke the function
- Environment variables and secrets
- VPC configuration for network access

### IAM Roles for Lambda

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/UserData"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::my-app-bucket/config/*"
    }
  ]
}
```

Notice: read-only permissions on specific resources. No `*` on Resource, no write permissions it doesn't need.

### Environment Variables and Secrets

Never put secrets in environment variables if you can avoid it. Use AWS Secrets Manager or SSM Parameter Store.

```python
import boto3
import json

def lambda_handler(event, context):
    # Bad: secret in environment variable
    # db_password = os.environ['DB_PASSWORD']  # Don't do this

    # Good: fetch from Secrets Manager
    secrets_client = boto3.client('secretsmanager')
    secret = secrets_client.get_secret_value(SecretId='prod/db/credentials')
    credentials = json.loads(secret['SecretString'])

    return connect_to_db(credentials['username'], credentials['password'])
```

## API Gateway Security

API Gateway is your public front door. Lock it down.

```bash
# Create a REST API with an authorizer
aws apigateway create-rest-api \
  --name secure-api \
  --endpoint-configuration types=REGIONAL

# Create a Cognito authorizer
aws apigateway create-authorizer \
  --rest-api-id abc123 \
  --name CognitoAuth \
  --type COGNITO_USER_POOLS \
  --provider-arns arn:aws:cognito:us-east-1:123456789012:userpool/us-east-1_abc123 \
  --identity-source method.request.header.Authorization

# Enable WAF on the API
aws wafv2 create-web-acl \
  --name api-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --rules '[
    {
      "Name": "RateLimit",
      "Priority": 1,
      "Action": {"Block": {}},
      "Statement": {
        "RateBasedStatement": {
          "Limit": 2000,
          "AggregateKeyType": "IP"
        }
      },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "RateLimit"
      }
    }
  ]' \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=api-waf
```

## Common Serverless Vulnerabilities

### Insecure Deserialization

```python
# VULNERABLE - don't do this
import pickle
import base64

def lambda_handler(event, context):
    data = base64.b64decode(event['body'])
    obj = pickle.loads(data)  # Remote code execution!
    return {"statusCode": 200, "body": str(obj)}

# SECURE - use safe parsing
import json

def lambda_handler(event, context):
    try:
        data = json.loads(event['body'])
    except json.JSONDecodeError:
        return {"statusCode": 400, "body": "Invalid JSON"}
    # Validate and sanitize data
    return {"statusCode": 200, "body": json.dumps(data)}
```

### Over-Permissioned Functions

```yaml
# BAD - function can do everything
iamRoleStatements:
  - Effect: Allow
    Action: "*"
    Resource: "*"

# GOOD - minimal permissions
iamRoleStatements:
  - Effect: Allow
    Action:
      - dynamodb:PutItem
    Resource: "arn:aws:dynamodb:us-east-1:123456789012:table/Logs"
```

## Lab Task — Secure Serverless Application

1. **Deploy** — Deploy a simple serverless API with:
   - Lambda function that reads/writes to DynamoDB
   - API Gateway fronting the Lambda
   - Cognito user pool for authentication

2. **Harden** — For each component:
   - Lambda: IAM role with least privilege, no secrets in environment variables
   - API Gateway: WAF with rate limiting, request validation, and throttling
   - DynamoDB: Encryption at rest enabled, VPC endpoint for access

3. **Attack** — Try these attacks against your deployment:
   - Send malformed JSON to the API (should get 400)
   - Send 3000 requests in 1 minute (should hit rate limit)
   - Try to invoke the Lambda directly without API Gateway (should be blocked)
   - Try to access DynamoDB from outside the VPC (should fail)

4. **Document** — Write findings for each attack: what you tried, what happened, why it was blocked (or wasn't)

**Time:** 55 minutes

**Grading (10 points):**
- 2 points: Serverless application deployed and working
- 3 points: Security hardening applied to all components
- 3 points: Attack attempts documented with outcomes
- 2 points: Clear explanation of why each defense worked

**Evidence:** CloudFormation/Serverless framework templates, WAF configuration, attack test results, and findings document.
