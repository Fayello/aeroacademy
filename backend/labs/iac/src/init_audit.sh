#!/bin/bash
set -e

echo "[AeroAcademy] Initializing Audit History..."

# Setup Git
git config --global user.email "lead-architect@aeroacademy.org"
git config --global user.name "Lead Architect"

cd /home/operative/audit

# Commit 1: Clean slate
git init
echo "# Security Audit: Production Infrastructure" > README.md
git add README.md
git commit -m "Initial baseline for production infrastructure"

# Commit 2: Adding IaC (Secure-ish)
cat <<EOF > vulnerable_infra.tf
provider "aws" { region = "us-east-1" }
resource "aws_s3_bucket" "evidence_storage" {
  bucket = "aero-evidence-leak-2026"
  acl    = "private"
}
EOF
git add vulnerable_infra.tf
git commit -m "Add encrypted storage definitions"

# Commit 3: "Hotfix" - Breaking security
cat <<EOF > vulnerable_infra.tf
provider "aws" { region = "us-east-1" }
resource "aws_s3_bucket" "evidence_storage" {
  bucket = "aero-evidence-leak-2026"
  acl    = "public-read"
}
EOF
git add vulnerable_infra.tf
git commit -m "HOTFIX: Enable public read for external vendor audit access"

echo "[AeroAcademy] Audit History Ready. 3 Commits indexed."
