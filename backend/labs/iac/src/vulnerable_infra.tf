
provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "evidence_storage" {
  bucket = "aero-evidence-leak-2026"
  acl    = "public-read" # VULNERABILITY: Publicly readable bucket

  tags = {
    Name        = "Evidence Storage"
    Environment = "Production"
  }
}

resource "aws_ebs_volume" "database_disk" {
  availability_zone = "us-east-1a"
  size              = 40
  encrypted         = false # VULNERABILITY: Unencrypted data at rest
}

resource "aws_iam_policy" "developer_access" {
  name        = "AeroDeveloperPolicy"
  path        = "/"
  description = "Standard developer access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "*" # VULNERABILITY: Excessive privileges (AdministratorAccess)
        Effect   = "Allow"
        Resource = "*"
      },
    ]
  })
}
