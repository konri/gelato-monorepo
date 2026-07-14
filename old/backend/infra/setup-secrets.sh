#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-secrets.sh  –  Wrzuca wszystkie sekrety do AWS Secrets Manager
#
# Usage:
#   ./infra/setup-secrets.sh <RDS_ENDPOINT>
#
# Przykład:
#   ./infra/setup-secrets.sh bonapka-db.abc123.eu-central-1.rds.amazonaws.com
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

AWS_REGION="${AWS_REGION:-eu-central-1}"
RDS_ENDPOINT="${1:-}"

if [ -z "${RDS_ENDPOINT}" ]; then
  echo "❌ Podaj endpoint RDS jako argument"
  echo "   Użycie: ./infra/setup-secrets.sh <RDS_ENDPOINT>"
  echo ""
  echo "   Pobierz endpoint:"
  echo "   aws rds describe-db-instances --db-instance-identifier bonapka-db --query 'DBInstances[0].Endpoint.Address' --output text --region ${AWS_REGION}"
  exit 1
fi

# Pobierz hasło z Secrets Manager (zapisane przez setup-rds.sh)
DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id "bonapka/DB_PASSWORD" \
  --query "SecretString" \
  --output text \
  --region "${AWS_REGION}")

DB_USER="${DB_USER:-bonapka_user}"
DB_NAME="${DB_NAME:-bonapka}"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/${DB_NAME}"

echo "🔐 Ustawianie sekretów w Secrets Manager..."
echo "   Region: ${AWS_REGION}"
echo ""

set_secret() {
  local name=$1
  local value=$2

  aws secretsmanager describe-secret --secret-id "${name}" --region "${AWS_REGION}" > /dev/null 2>&1 && \
    aws secretsmanager update-secret --secret-id "${name}" --secret-string "${value}" --region "${AWS_REGION}" > /dev/null && \
    echo "   ✅ Zaktualizowano: ${name}" || \
    aws secretsmanager create-secret --name "${name}" --secret-string "${value}" --region "${AWS_REGION}" > /dev/null && \
    echo "   ✅ Utworzono: ${name}"
}

set_secret "bonapka/DATABASE_URL" "${DATABASE_URL}"

# Pozostałe sekrety – podaj wartości lub ustaw jako env vars
echo ""
echo "⚠️  Ustaw pozostałe sekrety (edytuj poniższe wartości lub podaj jako env vars):"
echo ""

JWT_SECRET="${JWT_SECRET:-ZMIEN_MNIE_$(openssl rand -hex 16)}"
set_secret "bonapka/JWT_SECRET" "${JWT_SECRET}"

SENTRY_DSN="${SENTRY_DSN:-}"
if [ -n "${SENTRY_DSN}" ]; then
  set_secret "bonapka/SENTRY_DSN" "${SENTRY_DSN}"
else
  echo "   ⏭️  Pominięto SENTRY_DSN (ustaw env var SENTRY_DSN jeśli używasz)"
fi

echo ""
echo "✅ Sekrety ustawione. DATABASE_URL:"
echo "   ${DATABASE_URL}"
echo ""
echo "Następny krok – migracja bazy:"
echo "   DATABASE_URL=\"${DATABASE_URL}\" npx prisma migrate deploy"
