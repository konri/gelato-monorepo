#!/usr/bin/env bash
# .env.local always takes precedence over .env.production in Expo's dotenv
# loading order, so a plain `expo export` on a dev machine silently builds
# with local/dev config even when NODE_ENV=production is set. Move it aside
# for the duration of the build so .env.production actually wins, then
# restore it no matter what (including on failure/Ctrl-C).
set -euo pipefail
cd "$(dirname "$0")/.."

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

NODE_ENV=production npx expo export --platform web --clear
