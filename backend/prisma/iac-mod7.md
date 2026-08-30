# Module 7 — CloudFormation

## What You'll Actually Do

You'll write a CloudFormation template that creates a stack with an S3 bucket and an IAM user. You'll work with parameters, outputs, and nested stacks. The goal is to understand AWS-native IaC and when it makes sense over third-party tools.

## What CloudFormation Is

CloudFormation is AWS's built-in IaC service. You write JSON or YAML templates describing AWS resources, and AWS creates them for you. No third-party tools, no state files to manage — AWS handles everything.

The tradeoff is vendor lock-in. CloudFormation only works with AWS. If you're all-in on AWS, that's fine. If you might move to another cloud, consider Terraform.

## Template Structure

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Simple S3 bucket and IAM user

Parameters:
  EnvironmentName:
    Type: String
    AllowedValues:
      - dev
      - staging
      - production
    Description: Environment name

  BucketName:
    Type: String
    Description: Name of the S3 bucket

Resources:
  AppBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${BucketName}-${EnvironmentName}"
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName

  AppUser:
    Type: AWS::IAM::User
    Properties:
      UserName: !Sub "app-user-${EnvironmentName}"
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub "${AppBucket.Arn}/*"

Outputs:
  BucketArn:
    Value: !GetAtt AppBucket.Arn
    Description: ARN of the S3 bucket

  UserName:
    Value: !Ref AppUser
    Description: Name of the IAM user
```

## Key Concepts

**Parameters** are inputs you provide when creating the stack. They make templates reusable across environments.

**Resources** are the AWS objects to create. Each has a logical name (like `AppBucket`) and a type (like `AWS::S3::Bucket`).

**Outputs** are values CloudFormation exports after the stack is created. Other stacks can reference these with `Fn::ImportValue`.

**Intrinsic Functions** let you manipulate values within templates:

```yaml
# Substitution
!Sub "s3://${BucketName}/"

# Conditional
EnvironmentName: !If [IsProduction, "prod", "dev"]

# Join
!Join ["-", ["web", !Ref EnvironmentName]]

# GetAtt
!GetAtt AppBucket.Arn
```

## Working with Stacks

```bash
# Create a stack
aws cloudformation create-stack \
  --stack-name my-app \
  --template-body file://template.yaml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=dev \
               ParameterKey=BucketName,ParameterValue=my-app

# Wait for completion
aws cloudformation wait stack-create-complete --stack-name my-app

# Update a stack
aws cloudformation update-stack \
  --stack-name my-app \
  --template-body file://template.yaml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=dev \
               ParameterKey=BucketName,ParameterValue=my-app

# See what happened
aws cloudformation describe-stacks --stack-name my-app

# Delete everything
aws cloudformation delete-stack --stack-name my-app
```

## Drift Detection

CloudFormation can detect when someone manually changes a resource outside of the template.

```bash
aws cloudformation detect-stack-drift --stack-name my-app

# After drift is detected
aws cloudformation describe-stack-drift-detection-status \
  --stack-name my-app
```

If drift is detected, you either update the template to match reality or revert the manual change.

## Nested Stacks

For complex architectures, break templates into nested stacks.

```yaml
Resources:
  NetworkStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-templates/network.yaml
      Parameters:
        VpcCidr: "10.0.0.0/16"

  ComputeStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-templates/compute.yaml
      Parameters:
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
```

## Assessment

**Lab Task**: Write a CloudFormation template (YAML) that creates: an S3 bucket with versioning enabled, an IAM user with read-only access to that bucket, and a DynamoDB table with a simple primary key. Use parameters for the environment name. Deploy the stack using the AWS CLI (or LocalStack), verify all resources exist, then update the template to add a tag to all resources and apply the update.

**Time**: 40 minutes

**Grading**:
- Template is valid YAML and passes `aws cloudformation validate-template` (20 points)
- Stack creates successfully with all three resources (25 points)
- IAM policy correctly grants read-only access to the S3 bucket (25 points)
- Stack update adds tags without replacing resources (30 points)

## Evidence

- `aws cloudformation validate-template` output
- `aws cloudformation describe-stacks` showing CREATE_COMPLETE
- `aws s3api list-buckets` showing the created bucket
- `aws iam list-users` showing the created user
- `aws dynamodb list-tables` showing the created table
- The template YAML committed to repository
