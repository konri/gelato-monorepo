# Gelato Backend - Ice Cream Delivery Platform

GraphQL API backend for the Gelato ice cream delivery ecosystem, built with TypeScript, Prisma, and Apollo Server.

## 🎨 Brand Colors

- **Espresso (Primary):** `#4a044e`
- **Amber (Secondary):** `#b45309`
- **Soft Canvas (Background):** `#fffdfa`

## 🚀 Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.4+
- **Database:** PostgreSQL with Prisma ORM
- **API:** GraphQL (Apollo Server + TypeGraphQL)
- **Auth:** JWT + Passport.js (Email, Google OAuth, Apple OAuth, OTP via Twilio)
- **Payments:** Stripe
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Real-time:** WebSockets (graphql-ws)
- **Email:** SendGrid / Nodemailer
- **i18n:** i18next (PL, EN, UA)

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials and API keys

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed database with test data
npm run prisma:seed
```

## 🗄️ Database Schema

### User Roles

- **SUPER_ADMIN** - Creates Spots Admins
- **SPOTS_ADMIN** - Creates Spot Admins, manages multiple spots
- **SPOT_ADMIN** - Creates Employees, manages one spot
- **EMPLOYEE** - Views orders, scans QR codes
- **COURIER** - Delivery drivers
- **CLIENT** - Regular users ordering ice cream

### Core Models

- `User` - All users (clients, couriers, admins)
- `City` - Supported cities
- `Spot` - Ice cream spots/locations
- `Taste` - Ice cream flavors/tastes
- `Product` - Other products (coffee, desserts, etc.)
- `Order` - Customer orders with full delivery tracking
- `CourierProfile` - Courier details and GPS tracking
- `PointBalance` - Loyalty points system
- `Referral` - Referral rewards (+500pts referrer, +700pts referee)
- `Prize` - Rewards users can claim with points
- `Quest` - Tasks/quests (including birthday +700pts, referral)
- `News` - News feed with likes/comments
- `Review` - Order reviews (spot, courier, overall)

## 🏃 Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Run linter
npm run lint
```

Server runs on: `http://localhost:4000`  
GraphQL Playground: `http://localhost:4000/graphql`

## 🔑 Environment Variables

See `.env.example` for all required variables:

- Database URLs
- JWT secrets
- OAuth credentials (Google, Apple)
- Twilio (OTP/SMS)
- SendGrid (Email)
- Stripe (Payments)
- Firebase Admin (Push notifications)
- Google Maps API

## 📝 Key Features

### Authentication

- Email/password registration and login
- Google OAuth 2.0
- Apple Sign In
- OTP verification via SMS (Twilio)
- JWT access + refresh tokens
- Email verification

### Order Flow

1. Client browses tastes by city/spot
2. Add items to cart
3. Enter delivery address → validate radius
4. Payment via Stripe (card, Apple/Google Pay, BLIK)
5. Spot accepts order → assigns courier
6. Real-time GPS tracking
7. Delivery confirmation
8. Review system (rate spot + courier)

### Loyalty System

- **Points on purchase** (configurable per spot)
- **Referral rewards:** +500pts to referrer (after referee's first purchase), +700pts to referee
- **Birthday reward:** +700pts (one-time, birthday becomes immutable)
- **Custom quests** created by admins
- **Prizes** redeemable with points (QR code-based redemption at spots)

### Real-time Features

- WebSocket subscriptions for order status updates
- Live courier GPS tracking (1-minute ping intervals)
- Instant order notifications to spot admins/employees
- Push notifications via FCM to mobile apps

### Multi-language Support

- PL (Polish) - default
- EN (English)
- UA (Ukrainian)

All user-facing content supports localization via JSON objects.

## 📂 Project Structure

```
backend-new/
├── prisma/
│   └── schema.prisma     # Database schema
├── src/
│   ├── auth/             # Authentication logic
│   ├── resolvers/        # GraphQL resolvers
│   ├── services/         # Business logic services
│   ├── middleware/       # Express/GraphQL middleware
│   ├── types/            # TypeScript types
│   ├── config/           # Configuration
│   ├── shared/           # Shared utilities
│   ├── locales/          # Translation files (pl, en, ua)
│   └── index.ts          # Entry point
├── .env                  # Environment variables (git ignored)
├── .env.example          # Example environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Security Notes

- All passwords hashed with bcrypt
- JWT tokens have short expiry (15min access, 7d refresh)
- Token version tracking for instant invalidation
- CORS configured for allowed origins only
- Rate limiting recommended for production
- Input validation on all mutations
- SQL injection protected via Prisma parameterized queries

## 🧪 Testing (TODO)

```bash
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run coverage      # Coverage report
```

## 📦 Deployment

1. Setup PostgreSQL database (managed instance recommended)
2. Configure all environment variables
3. Run migrations: `npm run prisma:migrate`
4. Build: `npm run build`
5. Start: `npm start` (or use PM2/Docker)
6. Setup Redis for caching (optional)
7. Configure Sentry for error tracking
8. Setup monitoring (health check: `/health`)

## 📄 License

MIT
