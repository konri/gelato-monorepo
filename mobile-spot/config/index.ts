const ENV = process.env.EXPO_PUBLIC_ENV || 'dev'; // 'dev' or 'prod'

export const config = {
  // API Configuration
  API_URL: ENV === 'prod'
    ? (process.env.EXPO_PUBLIC_BACKEND_API_URL_PROD || 'https://loodly-be-production.up.railway.app')
    : (process.env.EXPO_PUBLIC_BACKEND_API_URL_DEV || 'http://localhost:4000'),

  // REST API URL (separate from GraphQL)
  REST_API_URL: ENV === 'prod'
    ? (process.env.EXPO_PUBLIC_BACKEND_REST_API_URL_PROD || 'https://loodly-be-production.up.railway.app')
    : (process.env.EXPO_PUBLIC_BACKEND_REST_API_URL_DEV || 'http://localhost:4000'),

  // GraphQL API URL
  GRAPHQL_API_URL: ENV === 'prod'
    ? (process.env.EXPO_PUBLIC_BACKEND_GRAPHQL_API_URL_PROD || 'https://loodly-be-production.up.railway.app/graphql')
    : (process.env.EXPO_PUBLIC_BACKEND_GRAPHQL_API_URL_DEV || 'http://localhost:4000/graphql'),

  // Google Sign-In Configuration
  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',

  // Google Maps API Key (Static Maps on order details — same key as the client app)
  GOOGLE_MAPS_API_KEY:
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    'AIzaSyD-RP8vcHqSgv_xgC5mhVxF_A_hNu8Joeo',

  // Legal pages (landing-page-new, static export)
  TERMS_URL: 'https://loodly.pl/terms',
  PRIVACY_POLICY_URL: 'https://loodly.pl/policy',

  // Admin web (brand setup: rewards, promotions, spots, cities, logo). Same
  // target as the backend's GELATO_ADMIN_URL. Empty = the link is hidden.
  ADMIN_WEB_URL: ENV === 'prod'
    ? (process.env.EXPO_PUBLIC_ADMIN_WEB_URL_PROD || '')
    : (process.env.EXPO_PUBLIC_ADMIN_WEB_URL_DEV || 'http://localhost:5173'),

  // Store pages for the "Update app" button (UPGRADE_REQUIRED). The Play Store
  // URL follows the Android package id in app.json; the App Store URL needs the
  // numeric app id, so it comes from the environment (empty = button hidden).
  APP_STORE_URL: process.env.EXPO_PUBLIC_SPOT_APP_STORE_URL || '',
  PLAY_STORE_URL:
    process.env.EXPO_PUBLIC_SPOT_PLAY_STORE_URL ||
    'https://play.google.com/store/apps/details?id=com.konradhopek.gelato.spot',
} as const;

export const GOOGLE_SIGNIN_CONFIG = {
  webClientId: config.GOOGLE_WEB_CLIENT_ID,
  iosClientId: config.GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
};
