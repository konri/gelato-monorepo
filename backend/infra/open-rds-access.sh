#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# open-rds-access.sh  –  Otwiera/zamyka dostęp do RDS z lokalnego IP
#
# Usage:
#   ./infra/open-rds-access.sh open   # otwiera dostęp
#   ./infra/open-rds-access.sh close  # zamyka dostęp
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

AWS_REGION="${AWS_REGION:-eu-central-1}"
DB_IDENTIFIER="${DB_IDENTIFIER:-bonapka-db}"
RDS_SG_ID="${RDS_SG_ID:-sg-0b147d36b3644b299}"
ACTION="${1:-open}"

MY_IP=$(curl -s https://checkip.amazonaws.com)
echo "IP: ${MY_IP}"

if [ "${ACTION}" = "open" ]; then
  echo "🔓 Otwieram dostęp do RDS..."

  aws rds modify-db-instance \
    --db-instance-identifier "${DB_IDENTIFIER}" \
    --publicly-accessible \
    --apply-immediately \
    --region "${AWS_REGION}" > /dev/null 2>&1 || true

  aws ec2 authorize-security-group-ingress \
    --group-id "${RDS_SG_ID}" \
    --protocol tcp --port 5432 \
    --cidr "${MY_IP}/32" \
    --region "${AWS_REGION}" > /dev/null 2>&1 || true

  echo ""
  echo "✅ Dostęp otwarty. Dane do DBeaver:"
  echo "   Host    : bonapka-db.cbqc002qwww8.eu-central-1.rds.amazonaws.com"
  echo "   Port    : 5432"
  echo "   Database: bonapka"
  echo "   User    : bonapka_user"
  echo "   Password: (pobierz z Secrets Manager)"
  echo ""
  echo "   Hasło:"
  aws secretsmanager get-secret-value \
    --secret-id "bonapka/DB_PASSWORD" \
    --query "SecretString" \
    --output text \
    --region "${AWS_REGION}"
  echo ""
  echo "⚠️  Pamiętaj zamknąć dostęp po skończeniu:"
  echo "   ./infra/open-rds-access.sh close"

elif [ "${ACTION}" = "close" ]; then
  echo "🔒 Zamykam dostęp do RDS..."

  aws ec2 revoke-security-group-ingress \
    --group-id "${RDS_SG_ID}" \
    --protocol tcp --port 5432 \
    --cidr "${MY_IP}/32" \
    --region "${AWS_REGION}" > /dev/null 2>&1 || true

  aws rds modify-db-instance \
    --db-instance-identifier "${DB_IDENTIFIER}" \
    --no-publicly-accessible \
    --apply-immediately \
    --region "${AWS_REGION}" > /dev/null 2>&1 || true

  echo "✅ Dostęp zamknięty"
else
  echo "Użycie: $0 [open|close]"
  exit 1
fi
