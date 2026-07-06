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

// Extract environment
let env = process.env.EXPO_PUBLIC_ENV || 'dev';
const envMatch = combined.match(/EXPO_PUBLIC_ENV=(\w+)/);
if (envMatch) {
  env = envMatch[1];
}

// Extract API URLs
function extractUrl(pattern, defaultValue) {
  const match = combined.match(new RegExp(pattern + '=(.+)'));
  return match ? match[1].trim() : defaultValue;
}

const restApiUrl = env === 'dev'
  ? extractUrl('EXPO_PUBLIC_BACKEND_REST_API_URL_DEV', 'http://localhost:4000')
  : extractUrl('EXPO_PUBLIC_BACKEND_REST_API_URL_PROD', 'https://api.bonapka.pl');

const graphqlApiUrl = env === 'dev'
  ? extractUrl('EXPO_PUBLIC_BACKEND_GRAPHQL_API_URL_DEV', 'http://localhost:4000/graphql')
  : extractUrl('EXPO_PUBLIC_BACKEND_GRAPHQL_API_URL_PROD', 'https://api.bonapka.pl/graphql');

console.log('\n' + '='.repeat(60));
console.log('🚀 Starting Gelato Mobile App');
console.log('='.repeat(60));
console.log(`📡 Environment: ${env.toUpperCase()}`);
console.log(`🔗 REST API: ${restApiUrl}`);
console.log(`🔗 GraphQL API: ${graphqlApiUrl}`);
console.log('='.repeat(60) + '\n');
