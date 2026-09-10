#!/usr/bin/env node

/**
 * Sets production API env vars, then runs the remaining CLI args.
 * Used by `npm run ios:prod` so the iOS simulator talks to Railway prod.
 */
const { spawn } = require('child_process');
const path = require('path');

const PROD = 'https://loodly-be-production.up.railway.app';

Object.assign(process.env, {
  EXPO_PUBLIC_ENV: 'prod',
  EXPO_PUBLIC_BACKEND_API_URL_PROD: PROD,
  EXPO_PUBLIC_BACKEND_REST_API_URL_PROD: PROD,
  EXPO_PUBLIC_BACKEND_GRAPHQL_API_URL_PROD: `${PROD}/graphql`,
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    '268509902642-tiajg536hrhbl6rk2i8e7c1u6r5fq6jd.apps.googleusercontent.com',
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    '268509902642-fs458nip621upn9ops28edfdjvqi5ml8.apps.googleusercontent.com',
});

require(path.join(__dirname, 'show-api-info.js'));

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/with-prod-env.js <command> [args...]');
  process.exit(1);
}

const child = spawn(args[0], args.slice(1), {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
