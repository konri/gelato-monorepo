const ENV = process.env.EXPO_PUBLIC_ENV || 'dev'; // 'dev' or 'prod'

export const config = {
  // API Configuration
  API_URL: ENV === 'prod'
    ? (process.env.EXPO_PUBLIC_BACKEND_API_URL_PROD || 'https://api.bonapka.pl')
    : (process.env.EXPO_PUBLIC_BACKEND_API_URL_DEV || 'http://localhost:4000'),

  // REST API URL (separate from GraphQL)
  REST_API_URL: ENV === 'prod'
    ? (process.env.EXPO_PUBLIC_BACKEND_REST_API_URL_PROD || 'https://api.bonapka.pl')
    : (process.env.EXPO_PUBLIC_BACKEND_REST_API_URL_DEV || 'http://localhost:4000'),

  // GraphQL API URL
  GRAPHQL_API_URL: ENV === 'prod'
    ? (process.env.EXPO_PUBLIC_BACKEND_GRAPHQL_API_URL_PROD || 'https://api.bonapka.pl/graphql')
    : (process.env.EXPO_PUBLIC_BACKEND_GRAPHQL_API_URL_DEV || 'http://localhost:4000/graphql'),

  // Google Sign-In Configuration
  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '549326700978-nn5h5eqvon1c2fkl1b96ja0n640grr59.apps.googleusercontent.com',
  GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '549326700978-qqbvmfajruhfjsepgkj09hamme92r82q.apps.googleusercontent.com',

  // Google Maps API Key
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',

  // Mapbox Configuration
  MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
} as const;

export const GOOGLE_SIGNIN_CONFIG = {
  webClientId: config.GOOGLE_WEB_CLIENT_ID,
  iosClientId: config.GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
};
