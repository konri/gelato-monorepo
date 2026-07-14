#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# migrate-rds.sh  –  Uruchamia prisma migrate deploy na RDS z lokalnego macha
#
# Tymczasowo otwiera RDS na twoje IP, odpala migrację, zamyka dostęp.
#
# Usage:
#   ./infra/migrate-rds.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

AWS_REGION="${AWS_REGION:-eu-central-1}"
DB_IDENTIFIER="${DB_IDENTIFIER:-bonapka-db}"
RDS_SG_ID="${RDS_SG_ID:-sg-0b147d36b3644b299}"

# ── Pobierz DATABASE_URL z Secrets Manager ────────────────────────────────────
echo "🔐 Pobieranie DATABASE_URL z Secrets Manager..."
DATABASE_URL=$(aws secretsmanager get-secret-value \
  --secret-id "bonapka/DATABASE_URL" \
  --query "SecretString" \
  --output text \
  --region "${AWS_REGION}")

# ── Pobierz swoje publiczne IP ────────────────────────────────────────────────
echo "🌍 Wykrywanie twojego IP..."
MY_IP=$(curl -s https://checkip.amazonaws.com)
echo "   IP: ${MY_IP}"

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

# Zawsze sprzątaj po sobie – nawet przy błędzie
trap cleanup EXIT

# ── Otwórz publiczny dostęp ───────────────────────────────────────────────────
echo "🔓 Otwieram publiczny dostęp do RDS..."

# Poczekaj aż RDS będzie available przed modyfikacją
echo "⏳ Czekam aż RDS będzie w statusie 'available'..."
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
  echo "⏳ Czekam aż RDS zastosuje zmiany..."
  sleep 30
else
  echo "   RDS już jest publiczne, pomijam modyfikację"
fi

aws ec2 authorize-security-group-ingress \
  --group-id "${RDS_SG_ID}" \
  --protocol tcp --port 5432 \
  --cidr "${MY_IP}/32" \
  --region "${AWS_REGION}" > /dev/null 2>&1 || true

# ── Poczekaj aż RDS zastosuje zmiany ─────────────────────────────────────────
echo "⏳ Czekam aż RDS wróci do statusu 'available'..."
for i in $(seq 1 24); do
  STATUS=$(aws rds describe-db-instances \
    --db-instance-identifier "${DB_IDENTIFIER}" \
    --query 'DBInstances[0].DBInstanceStatus' \
    --output text \
    --region "${AWS_REGION}")
  echo "   Status: ${STATUS} (${i}/24)"
  if [ "${STATUS}" = "available" ]; then
    break
  fi
  sleep 15
done
# Dodatkowe 10s na propagację DNS
sleep 10

# ── Uruchom migrację ──────────────────────────────────────────────────────────
echo "🚀 Uruchamiam prisma migrate deploy..."
DATABASE_URL="${DATABASE_URL}" npx prisma migrate deploy

echo ""
echo "✅ Migracja zakończona!"
