/**
 * Public client config. NEXT_PUBLIC_* wins when set at build time; otherwise
 * we fall back to the same production values the mobile app ships in eas.json
 * so a static export is not missing Maps / Google Sign-In / Stripe.
 */
export const publicConfig = {
  apiUrl:
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql",
  googleClientId:
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "268509902642-tiajg536hrhbl6rk2i8e7c1u6r5fq6jd.apps.googleusercontent.com",
  googleMapsApiKey:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "AIzaSyD-RP8vcHqSgv_xgC5mhVxF_A_hNu8Joeo",
  stripePublishableKey:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_51TcVfe8uoyf2v2KaHScAmH7Q2IONBUvuc9rTldpjDfuFkdNOcdV4dEuy13kuHMBiKhWGJInI8S7USh3pPHTZyw8g00YSQ66dtf",
} as const;
