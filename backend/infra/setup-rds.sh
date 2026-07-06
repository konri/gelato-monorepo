#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-rds.sh  –  Tworzy RDS PostgreSQL db.t3.micro w domyślnym VPC
#
# Usage:
#   ./infra/setup-rds.sh
#
# Zmienne środowiskowe (opcjonalne):
#   AWS_REGION      – default: eu-central-1
#   DB_IDENTIFIER   – default: bonapka-db
#   DB_NAME         – default: bonapka
#   DB_USER         – default: bonapka_user
#   DB_PASSWORD     – WYMAGANE lub ustaw w env
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

AWS_REGION="${AWS_REGION:-eu-central-1}"
DB_IDENTIFIER="${DB_IDENTIFIER:-bonapka-db}"
DB_NAME="${DB_NAME:-bonapka}"
DB_USER="${DB_USER:-bonapka_user}"

# Generuj hasło jeśli nie podane
if [ -z "${DB_PASSWORD:-}" ]; then
  DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
  echo "🔑 Wygenerowano hasło DB: ${DB_PASSWORD}"
  echo "   (zapisz je – zostanie też wrzucone do Secrets Manager)"
fi

echo "──────────────────────────────────────────────"
echo "  Region     : ${AWS_REGION}"
echo "  Identifier : ${DB_IDENTIFIER}"
echo "  DB Name    : ${DB_NAME}"
echo "  DB User    : ${DB_USER}"
echo "──────────────────────────────────────────────"

# ── Pobierz domyślne VPC i subnety ───────────────────────────────────────────
echo "🔍 Pobieranie domyślnego VPC..."
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --query "Vpcs[0].VpcId" \
  --output text \
  --region "${AWS_REGION}")

echo "   VPC: ${VPC_ID}"

SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=${VPC_ID}" \
  --query "Subnets[*].SubnetId" \
  --output text \
  --region "${AWS_REGION}" | tr '\t' ',')

echo "   Subnets: ${SUBNET_IDS}"

# ── Subnet group dla RDS ──────────────────────────────────────────────────────
echo "📦 Tworzenie DB subnet group..."
aws rds describe-db-subnet-groups \
  --db-subnet-group-name "bonapka-subnet-group" \
  --region "${AWS_REGION}" > /dev/null 2>&1 || \
aws rds create-db-subnet-group \
  --db-subnet-group-name "bonapka-subnet-group" \
  --db-subnet-group-description "Bonapka RDS subnet group" \
  --subnet-ids $(echo $SUBNET_IDS | tr ',' ' ') \
  --region "${AWS_REGION}" \
  --output table

# ── Security group dla RDS (port 5432 tylko z VPC) ────────────────────────────
echo "🔒 Tworzenie security group dla RDS..."
SG_ID=$(aws ec2 create-security-group \
  --group-name "bonapka-rds-sg" \
  --description "Bonapka RDS - dostep tylko z VPC" \
  --vpc-id "${VPC_ID}" \
  --region "${AWS_REGION}" \
  --query "GroupId" \
  --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=bonapka-rds-sg" \
    --query "SecurityGroups[0].GroupId" \
    --output text \
    --region "${AWS_REGION}")

echo "   Security Group: ${SG_ID}"

# Zezwól na port 5432 z całego VPC
VPC_CIDR=$(aws ec2 describe-vpcs \
  --vpc-ids "${VPC_ID}" \
  --query "Vpcs[0].CidrBlock" \
  --output text \
  --region "${AWS_REGION}")

aws ec2 authorize-security-group-ingress \
  --group-id "${SG_ID}" \
  --protocol tcp \
  --port 5432 \
  --cidr "${VPC_CIDR}" \
  --region "${AWS_REGION}" > /dev/null 2>&1 || true

# ── Utwórz RDS instance ───────────────────────────────────────────────────────
echo "🗄️  Tworzenie RDS PostgreSQL db.t3.micro..."
aws rds create-db-instance \
  --db-instance-identifier "${DB_IDENTIFIER}" \
  --db-instance-class "db.t3.micro" \
  --engine "postgres" \
  --engine-version "16.6" \
  --master-username "${DB_USER}" \
  --master-user-password "${DB_PASSWORD}" \
  --db-name "${DB_NAME}" \
  --allocated-storage 20 \
  --storage-type gp2 \
  --no-publicly-accessible \
  --vpc-security-group-ids "${SG_ID}" \
  --db-subnet-group-name "bonapka-subnet-group" \
  --backup-retention-period 0 \
  --no-multi-az \
  --region "${AWS_REGION}" \
  --output table

echo ""
echo "⏳ RDS jest tworzone (~5-10 min). Czekaj na status 'available':"
echo "   aws rds describe-db-instances --db-instance-identifier ${DB_IDENTIFIER} --query 'DBInstances[0].DBInstanceStatus' --output text --region ${AWS_REGION}"
echo ""
echo "📋 Po uruchomieniu pobierz endpoint:"
echo "   aws rds describe-db-instances --db-instance-identifier ${DB_IDENTIFIER} --query 'DBInstances[0].Endpoint.Address' --output text --region ${AWS_REGION}"
echo ""

# ── Zapisz DATABASE_URL do Secrets Manager ────────────────────────────────────
echo "🔐 Zapisuję hasło do Secrets Manager (endpoint uzupełnisz po starcie RDS)..."
aws secretsmanager create-secret \
  --name "bonapka/DB_PASSWORD" \
  --secret-string "${DB_PASSWORD}" \
  --region "${AWS_REGION}" > /dev/null 2>&1 || \
aws secretsmanager update-secret \
  --secret-id "bonapka/DB_PASSWORD" \
  --secret-string "${DB_PASSWORD}" \
  --region "${AWS_REGION}" > /dev/null 2>&1

echo ""
echo "✅ Gotowe! Po uruchomieniu RDS uruchom:"
echo "   ./infra/setup-secrets.sh <RDS_ENDPOINT>"
