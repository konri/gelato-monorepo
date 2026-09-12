#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to read env file
function readEnvFile(filename) {
  const envPath = path.join(__dirname, '..', filename);
  if (fs.existsSync(envPath)) {
    return fs.readFileSync(envPath, 'utf8');
  }
  return '';
}

// Read .env.local first (takes precedence), then .env
const envLocalContent = readEnvFile('.env.local');
const envContent = readEnvFile('.env');
const combined = envLocalContent + '\n' + envContent;

// Extract environment (process.env wins over .env files)
let env = process.env.EXPO_PUBLIC_ENV || 'dev';
if (!process.env.EXPO_PUBLIC_ENV) {
  const envMatch = combined.match(/EXPO_PUBLIC_ENV=(\w+)/);
  if (envMatch) env = envMatch[1];
}

function extractUrl(key, defaultValue) {
  if (process.env[key]) return process.env[key];
  const match = combined.match(new RegExp(key + '=(.+)'));
  return match ? match[1].trim() : defaultValue;
}

const restApiUrl = env === 'dev'
  ? extractUrl('EXPO_PUBLIC_BACKEND_REST_API_URL_DEV', 'http://localhost:4002')
  : extractUrl('EXPO_PUBLIC_BACKEND_REST_API_URL_PROD', 'https://loodly-be-production.up.railway.app');

const graphqlApiUrl = env === 'dev'
  ? extractUrl('EXPO_PUBLIC_BACKEND_GRAPHQL_API_URL_DEV', 'http://localhost:4002/graphql')
  : extractUrl('EXPO_PUBLIC_BACKEND_GRAPHQL_API_URL_PROD', 'https://loodly-be-production.up.railway.app/graphql');

console.log('\n' + '='.repeat(60));
console.log('🚀 Starting Loodly Courier App');
console.log('='.repeat(60));
console.log(`📡 Environment: ${env.toUpperCase()}`);
console.log(`🔗 REST API: ${restApiUrl}`);
console.log(`🔗 GraphQL API: ${graphqlApiUrl}`);
console.log('='.repeat(60) + '\n');
