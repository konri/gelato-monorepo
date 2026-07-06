#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# seed-rds.sh  –  Uruchamia prisma db seed na RDS z lokalnego macha
#
# Usage:
#   ./infra/seed-rds.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

AWS_REGION="${AWS_REGION:-eu-central-1}"
DB_IDENTIFIER="${DB_IDENTIFIER:-bonapka-db}"
RDS_SG_ID="${RDS_SG_ID:-sg-0b147d36b3644b299}"

echo "🔐 Pobieranie DATABASE_URL z Secrets Manager..."
DATABASE_URL=$(aws secretsmanager get-secret-value \
  --secret-id "bonapka/DATABASE_URL" \
  --query "SecretString" \
  --output text \
  --region "${AWS_REGION}")

MY_IP=$(curl -s https://checkip.amazonaws.com)
echo "🌍 IP: ${MY_IP}"

cleanup() {
  echo ""
  echo "🔒 Zamykam publiczny dostęp do RDS..."
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
  echo "   ✅ Dostęp zamknięty"
}
trap cleanup EXIT

echo "🔓 Otwieram publiczny dostęp do RDS..."
for i in $(seq 1 24); do
  STATUS=$(aws rds describe-db-instances \
    --db-instance-identifier "${DB_IDENTIFIER}" \
    --query 'DBInstances[0].DBInstanceStatus' \
    --output text \
    --region "${AWS_REGION}")
  [ "${STATUS}" = "available" ] && break
  echo "   Status: ${STATUS} (${i}/24)"
  sleep 15
done

IS_PUBLIC=$(aws rds describe-db-instances \
  --db-instance-identifier "${DB_IDENTIFIER}" \
  --query 'DBInstances[0].PubliclyAccessible' \
  --output text \
  --region "${AWS_REGION}")

if [ "${IS_PUBLIC}" != "True" ]; then
  aws rds modify-db-instance \
    --db-instance-identifier "${DB_IDENTIFIER}" \
    --publicly-accessible \
    --apply-immediately \
    --region "${AWS_REGION}" > /dev/null
  sleep 30
fi

aws ec2 authorize-security-group-ingress \
  --group-id "${RDS_SG_ID}" \
  --protocol tcp --port 5432 \
  --cidr "${MY_IP}/32" \
  --region "${AWS_REGION}" > /dev/null 2>&1 || true

echo "🌱 Uruchamiam prisma db seed..."
DATABASE_URL="${DATABASE_URL}" npx prisma db seed

echo ""
echo "✅ Seed zakończony!"
