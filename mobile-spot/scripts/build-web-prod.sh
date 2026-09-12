#!/usr/bin/env bash
# Production web export for spot.loodly.pl.
#
# Two gotchas this script exists to avoid:
# 1. Expo dotenv: .env.local always beats .env.production, so a plain
#    `expo export` on a dev machine silently bakes localhost even with
#    NODE_ENV=production. We move .env.local aside for the build.
# 2. Without EXPO_PUBLIC_ENV=prod, config/index.ts defaults to 'dev' and
#    http://localhost:4000. NODE_ENV=production does NOT flip that switch,
#    and there is no committed .env.production — so we inject the Railway
#    prod URLs here (same values as eas.json).
set -euo pipefail
cd "$(dirname "$0")/.."

PROD_API="https://loodly-be-production.up.railway.app"

export NODE_ENV=production
export EXPO_PUBLIC_ENV=prod
export EXPO_PUBLIC_BACKEND_API_URL_PROD="$PROD_API"
export EXPO_PUBLIC_BACKEND_REST_API_URL_PROD="$PROD_API"
export EXPO_PUBLIC_BACKEND_GRAPHQL_API_URL_PROD="$PROD_API/graphql"
export EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID="${EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:-268509902642-tiajg536hrhbl6rk2i8e7c1u6r5fq6jd.apps.googleusercontent.com}"
export EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID="${EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID:-549326700978-qqbvmfajruhfjsepgkj09hamme92r82q.apps.googleusercontent.com}"
export EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="${EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:-AIzaSyD-RP8vcHqSgv_xgC5mhVxF_A_hNu8Joeo}"

LOCAL_ENV=".env.local"
BACKUP=".env.local.build-backup"

restore() {
  if [ -f "$BACKUP" ]; then
    mv "$BACKUP" "$LOCAL_ENV"
  fi
}
trap restore EXIT

if [ -f "$LOCAL_ENV" ]; then
  mv "$LOCAL_ENV" "$BACKUP"
fi

# Metro's transform cache persists in the OS tmp dir across builds/machines
# and is keyed independently of .env changes — a dev-mode cache entry for a
# file can silently survive `rm -rf dist`/`.expo` and get reused here,
# baking stale (dev) env values into an otherwise-correct production build.
rm -rf "${TMPDIR:-/tmp}/metro-cache" ./node_modules/.cache

echo "Building web with EXPO_PUBLIC_ENV=$EXPO_PUBLIC_ENV"
echo "REST/API: $EXPO_PUBLIC_BACKEND_REST_API_URL_PROD"
echo "GraphQL:  $EXPO_PUBLIC_BACKEND_GRAPHQL_API_URL_PROD"

npx expo export --platform web --clear

# Fail the build if localhost leaked into the bundle (the previous silent failure mode).
if grep -Rql --include='*.js' 'localhost:4000' dist; then
  echo "ERROR: dist still contains localhost:4000 — aborting so we don't ship a dev build." >&2
  exit 1
fi

echo
echo "Exported: dist"
echo "Upload with:"
echo "  scp -r dist/* kraczo@s5.mydevil.net:~/domains/spot.loodly.pl/public_html/"
