# Module 7: CloudFormation

If you are working entirely within AWS, CloudFormation is the native IaC tool. It is included with your AWS account at no additional cost, integrates with every AWS service, and uses a JSON or YAML template language that AWS maintains. You do not need to install anything. The AWS CLI, SDKs, and console all support CloudFormation directly.

CloudFormation is not as flexible as Terraform for multi-cloud work, and its template language is more verbose than HCL. But for AWS-only environments, it has real advantages: no state file to manage because AWS handles it, tight integration with AWS services, and drift detection built into the platform.

This module covers CloudFormation templates, stacks, nested stacks, and a complete scenario of deploying a Lambda function with an API Gateway.

## Templates

A CloudFormation template is a JSON or YAML file that describes your AWS resources. The template is a declarative specification of the desired state. CloudFormation figures out how to create, update, or delete resources to reach that state.

**Template structure**:

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Production VPC with public and private subnets"

Parameters:
  EnvironmentName:
    Type: String
    AllowedValues:
      - dev
      - staging
      - production
    Description: Environment name

  VpcCidr:
    Type: String
    Default: "10.0.0.0/16"
    AllowedPattern: "^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$"
    Description: CIDR block for the VPC

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-vpc"
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 1, 8]]
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-public"

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-igw"

  IGWAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub "${EnvironmentName}-VpcId"

  PublicSubnetId:
    Description: Public Subnet ID
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub "${EnvironmentName}-PublicSubnetId"
```

**Sections** of a CloudFormation template:

- AWSTemplateFormatVersion: Template version, always "2010-09-09"
- Description: Human-readable description of what the template creates
- Parameters: Input values that users provide when creating or updating the stack
- Resources: The AWS resources to create, this is the required section
- Outputs: Values to return after stack creation
- Mappings: Static lookup tables for environment-specific values
- Conditions: Conditional resource creation
- Transform: SAM transform or other macro transforms

**Intrinsic functions** are CloudFormation's built-in tools for dynamic templates:

```hcl
# Ref: reference a parameter or get a resource's physical ID
!Ref VpcCidr          # Parameter value
!Ref VPC               # Resource's physical ID (vpc-0123456789abcdef)

# Sub: string substitution with variables
!Sub "${EnvironmentName}-vpc"
!Sub "arn:aws:s3:::${BucketName}/*"

# GetAtt: get a specific attribute from a resource
!GetAtt VPC.CidrBlock
!GetAtt LoadBalancer.DNSName

# Select: pick an item from a list by index
!Select [0, !GetAZs ""]

# Cidr: generate a list of CIDR blocks from a base CIDR
!Cidr [!Ref VpcCidr, 6, 8]

# If: conditional value selection
!If [IsProduction, "m5.large", "t3.micro"]

# Join: concatenate strings with a delimiter
!Join ["-", [!Ref EnvironmentName, "web", "sg"]]

# FindInMap: look up a value from the Mappings section
!FindInMap [EnvironmentMap, !Ref EnvironmentName, InstanceType]

# Split: split a string into a list
!Split [",", "us-east-1a,us-east-1b,us-east-1c"]

# GetAZs: get a list of availability zones for a region
!GetAZs ""
```

**Parameters with validation**:

```yaml
Parameters:
  EnvironmentName:
    Type: String
    AllowedValues:
      - dev
      - staging
      - production
    ConstraintDescription: Must be dev, staging, or production

  InstanceType:
    Type: String
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - m5.large
      - m5.xlarge
    Default: t3.micro

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: Name of an existing EC2 key pair

  VpcCidr:
    Type: String
    Default: "10.0.0.0/16"
    AllowedPattern: "^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$"
    MinLength: 9
    MaxLength: 18
```

**Mappings** for environment-specific values:

```yaml
Mappings:
  EnvironmentMap:
    dev:
      InstanceType: t3.micro
      AmiId: ami-0c55b159cbfafe1f0
      MinInstances: 1
      MaxInstances: 2
    staging:
      InstanceType: t3.small
      AmiId: ami-0c55b159cbfafe1f0
      MinInstances: 2
      MaxInstances: 4
    production:
      InstanceType: m5.large
      AmiId: ami-0c55b159cbfafe1f0
      MinInstances: 3
      MaxInstances: 10
```

**Conditions** control whether resources are created:

```yaml
Conditions:
  IsProduction: !Equals [!Ref EnvironmentName, production]
  IsDev: !Equals [!Ref EnvironmentName, dev]
  HasNatGateway: !Or [!Condition IsProduction, !Condition IsStaging]

Resources:
  WebServer:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !If [IsProduction, "m5.large", "t3.micro"]

  NatGateway:
    Type: AWS::EC2::NatGateway
    Condition: HasNatGateway
    Properties:
      AllocationId: !GetAtt NatEIP.AllocationId
      SubnetId: !Ref PublicSubnet
```

## Stacks

A stack is a running instance of a CloudFormation template. You create a stack by submitting a template and parameters, and CloudFormation provisions all the resources described in the template.

**Creating a stack**:

```bash
# Create a stack from a local template
aws cloudformation create-stack \
  --stack-name production-vpc \
  --template-body file://vpc.yml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=production \
               ParameterKey=VpcCidr,ParameterValue=10.0.0.0/16 \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

# Wait for creation to complete
aws cloudformation wait stack-create-complete --stack-name production-vpc

# Get outputs from the stack
aws cloudformation describe-stacks \
  --stack-name production-vpc \
  --query 'Stacks[0].Outputs'
```

The --capabilities flag is required when the template creates IAM resources. Without it, CloudFormation will reject the template.

**Updating a stack**: Change the template or parameters and update the existing stack:

```bash
aws cloudformation update-stack \
  --stack-name production-vpc \
  --template-body file://vpc-updated.yml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=production \
               ParameterKey=VpcCidr,ParameterValue=10.0.0.0/16 \
  --capabilities CAPABILITY_IAM
```

Before updating, preview the changes with a change set:

```bash
aws cloudformation create-change-set \
  --stack-name production-vpc \
  --change-set-name add-subnet \
  --template-body file://vpc-updated.yml

aws cloudformation describe-change-set \
  --stack-name production-vpc \
  --change-set-name add-subnet
```

The change set shows each resource that will be added, modified, or deleted, along with the reason for the change. Review it carefully before executing.

**Deleting a stack**:

```bash
aws cloudformation delete-stack --stack-name production-vpc
aws cloudformation wait stack-delete-complete --stack-name production-vpc
```

**Stack events** show progress during creation or update:

```bash
aws cloudformation describe-stack-events --stack-name production-vpc
```

Each event shows which resource is being processed and whether it succeeded or failed. If a resource fails, the event includes an error message that tells you what went wrong.

**Stack policies** protect critical resources from accidental deletion:

```json
{
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "Update:Delete",
      "Resource": "LogicalResourceId/ProductionDatabase"
    },
    {
      "Effect": "Allow",
      "Action": "Update:*",
      "Resource": "*"
    }
  ]
}
```

Apply with:

```bash
aws cloudformation set-stack-policy \
  --stack-name production-vpc \
  --stack-policy-body file://policy.json
```

**Change sets** are CloudFormation's safety mechanism for updates:

```bash
# Create a change set
aws cloudformation create-change-set \
  --stack-name my-stack \
  --change-set-name my-changes \
  --template-body file://updated.yml

# Review what will change
aws cloudformation describe-change-set \
  --stack-name my-stack \
  --change-set-name my-changes

# Execute only if approved
aws cloudformation execute-change-set \
  --stack-name my-stack \
  --change-set-name my-changes
```

Change sets do not actually make any changes until you execute them. This gives you a chance to review and approve before anything happens.

## Nested Stacks

Nested stacks let you break a large template into smaller, reusable pieces. A parent stack creates child stacks, and CloudFormation manages the relationships between them.

**Template structure for nesting**:

```
templates/
├── main.yml           # Parent stack
├── vpc.yml            # VPC nested stack
├── ecs.yml            # ECS nested stack
└── rds.yml            # RDS nested stack
```

**Child template** (vpc.yml):

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "VPC with public and private subnets"

Parameters:
  VpcCidr:
    Type: String
  EnvironmentName:
    Type: String

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-vpc"

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 1, 8]]
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: true

Outputs:
  VpcId:
    Value: !Ref VPC
    Export:
      Name: !Sub "${EnvironmentName}-VpcId"

  PublicSubnetId:
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub "${EnvironmentName}-PublicSubnetId"
```

**Parent template** (main.yml):

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Complete infrastructure with nested stacks"

Parameters:
  EnvironmentName:
    Type: String
  VpcCidr:
    Type: String

Resources:
  VPCStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-templates/vpc.yml
      Parameters:
        VpcCidr: !Ref VpcCidr
        EnvironmentName: !Ref EnvironmentName

  ECSStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-templates/ecs.yml
      Parameters:
        VpcId: !GetAtt VPCStack.Outputs.VpcId
        SubnetId: !GetAtt VPCStack.Outputs.PublicSubnetId
        EnvironmentName: !Ref EnvironmentName

Outputs:
  VpcId:
    Value: !GetAtt VPCStack.Outputs.VpcId
  EcsCluster:
    Value: !GetAtt ECSStack.Outputs.ClusterName
```

The child templates must be uploaded to S3 before the parent stack references them. Use aws cloudformation package to handle this automatically:

```bash
aws cloudformation package \
  --template-file main.yml \
  --s3-bucket my-templates \
  --output-template-file packaged.yml
```

**When to use nested stacks**: Use nested stacks when you have a complex architecture that is hard to manage in a single template. They provide separation of concerns. You can update the VPC without touching the ECS cluster. But they add complexity. Child stack updates must propagate to the parent, and debugging requires checking multiple stacks in the console.

## Real Scenario: Deploying a Lambda Function

Let us deploy a Lambda function with an API Gateway, IAM roles, and CloudWatch Logs.

**The Lambda function** (lambda/index.py):

```python
import json
import os
import uuid
from datetime import datetime

def handler(event, context):
    http_method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')

    if path == '/health':
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'function_name': context.function_name,
                'function_version': context.function_version,
                'memory_limit': context.memory_limit_in_mb
            })
        }

    if path == '/items' and http_method == 'GET':
        items = [
            {'id': str(uuid.uuid4()), 'name': 'Item 1', 'created': datetime.utcnow().isoformat()},
            {'id': str(uuid.uuid4()), 'name': 'Item 2', 'created': datetime.utcnow().isoformat()},
        ]
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'items': items})
        }

    return {
        'statusCode': 404,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Not found'})
    }
```

**The CloudFormation template** (template.yml):

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Lambda function with API Gateway"

Transform: AWS::Serverless-2016-10-31

Parameters:
  EnvironmentName:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - staging
      - production

  FunctionMemorySize:
    Type: Number
    Default: 128
    AllowedValues:
      - 128
      - 256
      - 512
      - 1024

  FunctionTimeout:
    Type: Number
    Default: 30
    MinValue: 1
    MaxValue: 900

Resources:
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub "${EnvironmentName}-api-handler"
      Handler: index.handler
      Runtime: python3.12
      CodeUri: lambda/
      MemorySize: !Ref FunctionMemorySize
      Timeout: !Ref FunctionTimeout
      Environment:
        Variables:
          ENVIRONMENT: !Ref EnvironmentName
          LOG_LEVEL: !If [IsProduction, INFO, DEBUG]
      Policies:
        - AWSLambdaBasicExecutionRole
      Events:
        ApiRoot:
          Type: Api
          Properties:
            Path: /
            Method: ANY
            RestApiId: !Ref ApiGateway
        ApiProxy:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY
            RestApiId: !Ref ApiGateway

  ApiGateway:
    Type: AWS::Serverless::Api
    Properties:
      Name: !Sub "${EnvironmentName}-api"
      StageName: !Ref EnvironmentName
      TracingEnabled: true

  FunctionLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/${EnvironmentName}-api-handler"
      RetentionInDays: !If [IsProduction, 90, 14]

Conditions:
  IsProduction: !Equals [!Ref EnvironmentName, production]

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub "https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentName}/"

  FunctionArn:
    Description: Lambda function ARN
    Value: !GetAtt ApiFunction.Arn

  FunctionName:
    Description: Lambda function name
    Value: !Ref ApiFunction
```

**Deploy**:

```bash
# Package the Lambda code and upload to S3
aws cloudformation package \
  --template-file template.yml \
  --s3-bucket my-deployment-bucket \
  --output-template-file packaged.yml

# Deploy the stack
aws cloudformation deploy \
  --template-file packaged.yml \
  --stack-name my-api \
  --parameter-overrides \
    EnvironmentName=dev \
    FunctionMemorySize=128 \
  --capabilities CAPABILITY_IAM \
  --tags Environment=dev Project=myapp
```

**Test**:

```bash
ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name my-api \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

curl "$ENDPOINT/health"
curl "$ENDPOINT/items"
```

**Update**:

```bash
aws cloudformation deploy \
  --template-file packaged.yml \
  --stack-name my-api \
  --parameter-overrides \
    EnvironmentName=dev \
    FunctionMemorySize=256 \
  --capabilities CAPABILITY_IAM
```

**Cleanup**:

```bash
aws cloudformation delete-stack --stack-name my-api
```

## CloudFormation vs Terraform

Both tools provision infrastructure, but they differ in important ways.

**State management**: CloudFormation manages state internally. You never see or touch a state file. Terraform requires you to manage state, either locally or in a remote backend. CloudFormation is simpler; Terraform gives you more control.

**Provider support**: CloudFormation only works with AWS. Terraform supports hundreds of providers. If you are multi-cloud, Terraform is the only practical choice.

**Template language**: CloudFormation uses JSON or YAML with intrinsic functions. Terraform uses HCL. HCL is generally considered more readable and easier to write.

**Change management**: CloudFormation has built-in change sets that show exactly what will happen before you apply. Terraform has terraform plan. Both are good. CloudFormation's integration with the AWS console makes it slightly more accessible for visual review.

**Pricing**: CloudFormation is free. You pay only for the resources it creates. Terraform is also free, but if you use Terraform Cloud, there is a cost for team features.

**Drift detection**: CloudFormation can detect drift, resources that were modified outside of CloudFormation. Terraform can also detect drift by comparing state to actual resources. CloudFormation's drift detection is more tightly integrated with the AWS platform.

## Assessment

**Lab Task 1** (40 minutes): Write a CloudFormation template in YAML that creates a VPC with two public subnets, an internet gateway, and route tables. Use parameters for the VPC CIDR and environment name. Use mappings for environment-specific settings. Deploy the stack and verify resources in the AWS Console.

**Lab Task 2** (30 minutes): Update the VPC template to add a NAT gateway and private subnets. Create a change set, review the changes, and execute the change set. Verify the update completes successfully.

**Lab Task 3** (30 minutes): Create a Lambda function with an API Gateway using a SAM template. The function should handle GET requests at /health and /items. Deploy, test with curl, then update the function memory allocation and redeploy.

**Grading Criteria**:
- VPC template uses parameters, mappings, and conditions correctly (25 points)
- Change set is created, reviewed, and executed without errors (20 points)
- Lambda function deploys and responds to API requests (25 points)
- Template uses intrinsic functions appropriately (15 points)
- Stack outputs export values correctly and stack can be deleted cleanly (15 points)

**Time Limit**: 100 minutes total

## Evidence

After completing this module, you should be able to:

- Write CloudFormation templates in YAML with parameters, resources, and outputs
- Use intrinsic functions for dynamic resource configuration
- Create, update, and delete stacks using the AWS CLI
- Create and review change sets before applying updates
- Deploy Lambda functions with API Gateway using SAM transforms
- Use nested stacks for complex architectures
- Apply stack policies to protect critical resources
- Understand the tradeoffs between CloudFormation and Terraform

**Artifact**: A CloudFormation template that deploys a VPC with subnets and a Lambda function with API Gateway. The template uses parameters for environment configuration, includes change sets for safe updates, and exports useful outputs.
