import { Platform } from 'react-native';

const ENV = process.env.EXPO_PUBLIC_ENV || 'dev'; // 'dev' or 'prod'

// The Android emulator can't resolve the host machine's `localhost` — it
// needs the special `10.0.2.2` alias instead. Only rewrite in dev, and only
// on Android (iOS simulator and physical devices are unaffected: iOS sim
// shares the host's loopback, and physical devices already use a LAN IP).
const forDevice = (url: string) =>
  Platform.OS === 'android' ? url.replace('localhost', '10.0.2.2') : url;

export const config = {
  // API Configuration
  API_URL: ENV === 'prod'
    ? (process.env.EXPO_PUBLIC_BACKEND_API_URL_PROD || 'https://loodly-be-production.up.railway.app')
    : forDevice(process.env.EXPO_PUBLIC_BACKEND_API_URL_DEV || 'http://localhost:4000'),

  // REST API URL (separate from GraphQL)
  REST_API_URL: ENV === 'prod'
    ? (process.env.EXPO_PUBLIC_BACKEND_REST_API_URL_PROD || 'https://loodly-be-production.up.railway.app')
    : forDevice(process.env.EXPO_PUBLIC_BACKEND_REST_API_URL_DEV || 'http://localhost:4000'),

  // GraphQL API URL
  GRAPHQL_API_URL: ENV === 'prod'
    ? (process.env.EXPO_PUBLIC_BACKEND_GRAPHQL_API_URL_PROD || 'https://loodly-be-production.up.railway.app/graphql')
    : forDevice(process.env.EXPO_PUBLIC_BACKEND_GRAPHQL_API_URL_DEV || 'http://localhost:4000/graphql'),

  // Google Sign-In Configuration
  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',

  // Google Maps API Key (same key as app.json android.config.googleMaps)
  GOOGLE_MAPS_API_KEY:
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    'AIzaSyD-RP8vcHqSgv_xgC5mhVxF_A_hNu8Joeo',

  // Stripe Configuration
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51TcVfe8uoyf2v2KaHScAmH7Q2IONBUvuc9rTldpjDfuFkdNOcdV4dEuy13kuHMBiKhWGJInI8S7USh3pPHTZyw8g00YSQ66dtf',
  // Apple Pay merchant ID — must match app.json Stripe plugin + Apple Developer
  STRIPE_MERCHANT_IDENTIFIER: 'merchant.com.konradhopek.gelato.client',
  STRIPE_URL_SCHEME: 'gelato',

  // Legal pages (landing-page-new, static export)
  TERMS_URL: 'https://loodly.pl/terms',
  PRIVACY_POLICY_URL: 'https://loodly.pl/policy',
} as const;

export const GOOGLE_SIGNIN_CONFIG = {
  webClientId: config.GOOGLE_WEB_CLIENT_ID,
  iosClientId: config.GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
};
