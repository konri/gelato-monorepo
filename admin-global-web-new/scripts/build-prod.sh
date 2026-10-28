#!/usr/bin/env bash
# Production static build for admin.loodly.pl.
#
# Vite inlines VITE_* at build time. A plain `npm run build` keeps the
# defaults: the API stays on localhost and Places stays off, so the spot
# form never fills coordinates. Shell env wins over .env files, so this
# script exports the production values first (same Railway host and Maps
# key as the Spot web build and the landing page).
set -euo pipefail
cd "$(dirname "$0")/.."

PROD_API="https://loodly-be-production.up.railway.app"

export VITE_API_URL="${VITE_API_URL:-$PROD_API/graphql}"
export VITE_SPOT_APP_URL="${VITE_SPOT_APP_URL:-https://spot.loodly.pl}"
export VITE_GOOGLE_MAPS_API_KEY="${VITE_GOOGLE_MAPS_API_KEY:-AIzaSyD-RP8vcHqSgv_xgC5mhVxF_A_hNu8Joeo}"

echo "Building admin web"
echo "API:  $VITE_API_URL"
echo "Spot: $VITE_SPOT_APP_URL"
echo "Maps: set"

npm run build

if grep -Rql --include='*.js' 'localhost:4000' dist; then
  echo "ERROR: dist still contains localhost:4000 — aborting so we don't ship a dev build." >&2
  exit 1
fi

if ! grep -Rql --include='*.js' 'loodly-be-production.up.railway.app' dist; then
  echo "ERROR: production API host is missing from dist." >&2
  exit 1
fi

if ! grep -Rql --include='*.js' "$VITE_GOOGLE_MAPS_API_KEY" dist; then
  echo "ERROR: Google Maps API key is missing from dist — address suggestions will stay off." >&2
  exit 1
fi

echo
echo "Exported: dist"
