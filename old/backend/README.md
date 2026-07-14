# EasyBons - GraphQL API Server

## Getting started

### 1. Install PostgreSQL 14.10

```bash
brew update
brew install wget
brew install postgresql
pg_ctl -D /usr/local/var/postgres start && brew services start postgresql
```

### 2. Create a new database

```bash
psql postgres
create user easybons_admin with password 'password';
CREATE DATABASE easybons;
grant all privileges on database easybons to easybons_admin;
CREATE DATABASE easybons_shadow;
grant all privileges on database easybons_shadow to easybons_admin;
```

### 3. Install dependecies

```bash
yarn install
```

### 4. Set up env variables for the database in prisma/.env

```bash
DATABASE_URL=postgres://easybons_admin:password@localhost:5432/easybons
DATABASE_URL_SHADOW=postgres://easybons_admin:password@localhost:5432/easybons_shadow
```

### 5. Apply database migrations and create Prisma client

```bash
# For local development
yarn migrate-db-local

# For dev server through tunnel
yarn migrate-db-tunnel

# Seed is automatically run with migrate commands
```

#### Database management commands:

```bash
# MIGRATE (development with shadow database)
yarn migrate-db-local     # Local environment with shadow
yarn migrate-db-dev       # Dev environment with shadow
yarn migrate-db-tunnel    # Dev environment through tunnel with shadow

# DEPLOY (production without shadow database)
yarn deploy-db-local      # Local environment without shadow
yarn deploy-db-dev        # Dev environment without shadow
yarn deploy-db-tunnel     # Dev environment through tunnel without shadow

# UTILITIES
yarn drop-all-tunnel      # Drop all tables through tunnel
yarn tunnel               # Start SSH tunnel manually
```

### 6. Set up env variables for the server

```bash
# For local development
cp .env.local .env

# For dev environment
cp .env.dev .env

# Set OAuth credentials (FACEBOOK_APP_ID, GOOGLE_APP_ID, etc.)
```

### 7. Start the server

#### Start app with dev creds ( only at dev or if you have set tunnel at your local machine )

```bash
yarn dev
```

#### Start app with dev creds at local machine with tunnel

```bash
yarn dev-tunnel
```

#### Start app with local creds

```bash
yarn local
```

## Deploy to MyDevil DEV Environment

### Prerequisites

- Domain: `easybons.com` configured on MyDevil
- Subdomain DNS: `api-dev.easybons.com` (A record pointing to server IP)
- Reserved TCP port 4000 on MyDevil
- SSH access to MyDevil server

### Deploy Commands

```bash
# Deploy to DEV environment (builds locally, uploads compiled files to MyDevil)
yarn deploy-dev-mydevil-compiled
```

**Note**: We use `deploy-dev-mydevil-compiled` because MyDevil's FreeBSD doesn't support Prisma engine binaries and has limited Node.js build capabilities. This script:

- Builds the application locally (where all tools work properly)
- Compiles TypeScript to JavaScript
- Generates Prisma Client with proper binaries
- Uploads the compiled files to MyDevil server
- Installs only production dependencies on server

### Application URLs

- **API Endpoint**: `https://api-dev.easybons.com:4000`
- **GraphQL Playground**: `https://api-dev.easybons.com:4000/graphql`
- **Environment**: DEV (uses `.env.dev` configuration)

### Server Management

```bash
# SSH to server
ssh kraczo@s5.mydevil.net
cd /usr/home/kraczo/domains/easybons.com/public_nodejs/api-dev

# Check application status
ps aux | grep "node dist/index.js"
yarn start-pm2

# View logs
tail -f app.log
yarn logs-pm2

# Restart application
pkill -f "node dist/index.js"
nohup yarn start > app.log 2>&1 &
yarn stop-pm2 && yarn start-pm2

# Check if port is listening
netstat -tuln | grep 4000
```

### Deploy Process

The `deploy-dev-mydevil-compiled` script:

1. Builds application locally (including Prisma Client)
2. Uploads files to MyDevil server via rsync
3. Installs production dependencies on server
4. Automatically starts the application

### Configuration

- **Database**: Direct connection to MyDevil PostgreSQL
- **Environment**: `.env.dev` (copied to `.env` on server)
- **SSL**: Uses domain SSL certificate
- **Port**: 4000 (reserved on MyDevil)

### Troubleshooting

- **Prisma issues**: MyDevil uses FreeBSD which doesn't have Prisma engine binaries available. We solve this by building locally and uploading compiled files via `deploy-dev-mydevil-compiled` script
- **SSL Certificate**: Currently requires port number in URL
- **Port in URL**: Due to MyDevil subdomain SSL limitations, API requires explicit port `:4000`. This can be changed later by configuring proxy in main domain application
- **Logs**: Check `app.log` for application errors
- **Database**: Uses direct connection (no tunnel needed)

### Future Improvements

- **Remove port from URL**: Configure proxy in main domain application (`/domains/easybons.com/public_nodejs/app.js`) to redirect `api-dev.easybons.com` traffic to `localhost:4000`
- **SSL for subdomain**: MyDevil currently doesn't support SSL certificates for subdomains, only main domains

## Working with Dev Server through Tunnel

### Database Operations

```bash
# Migrate database schema (creates/updates tables + runs seed)
yarn migrate-db-tunnel

# Deploy migrations only (no seed)
yarn deploy-db-tunnel

# Drop all tables and start fresh
yarn drop-all-tunnel
```

### Running the Application

```bash
# Start app connected to dev server through tunnel
yarn dev-tunnel
```

**Note**: Tunnel commands automatically:

- Start SSH tunnel to dev server
- Configure database connection
- Execute database operations
- Close tunnel when finished

## API Design

### Authentication

#### Local Authentication

- `POST /authorization/signup` - Register new user with email verification
- `POST /authorization/login` - Login user with email/password
- `POST /authorization/change-password` - Change user password
- `POST /authorization/forgot` - Send password reset email
- `GET /authorization/resetPassword/confirm` - Password reset form
- `POST /authorization/resetPassword/confirm` - Confirm password reset
- `POST /authorization/resend-verification` - Resend email verification
- `POST /authorization/verify-code` - Verify email with code
- `GET /authorization/verification-status/:email` - Check email verification status

#### OAuth Authentication

**Google OAuth:**

- `GET /authorization/login/google` - Initiate Google OAuth
- `GET /authorization/login/google?redirect=panel/dashboard` - OAuth with redirect parameter
- `GET /authorization/login/google/return` - Google OAuth callback

**Facebook OAuth:**

- `GET /authorization/login/facebook` - Initiate Facebook OAuth
- `GET /authorization/login/facebook?redirect=panel/dashboard` - OAuth with redirect parameter
- `GET /authorization/login/facebook/callback` - Facebook OAuth callback

**OAuth Flow:**

1. User visits: `https://api-dev.easybons.com/authorization/login/google?redirect=panel/dashboard`
2. Redirected to Google for authentication
3. After successful auth, redirected to: `https://app.easybons.com/panel/dashboard?type=SUCCESS&token=eyJ...`
4. Frontend extracts JWT token from URL parameters
5. Token contains full user data: `{id, email, role, name, firstName, surname, picture, profileId, profileType}`

**Apple OAuth:**

- `POST /authorization/login/apple` - Apple OAuth (custom implementation)

### UserResolver

- `updateUser` mutation with arguments: `id: Int!`, `name: String`, `email: String`, `password: String`, `phone: String`, `address: String`, `city: String`, `country: String`, `zip: String`, `avatar: String`, `banner: String`, `description: String

### CompanyOwnerResolver: choose type of user

- `createCompanyOwner` mutation with arguments: `companyName: String!`, `companyAddress: String!`, `companyCity: String!`, `companyCountry: String!`, `companyZip: String!`, `companyPhone: String!`, `companyEmail: String!`, `companyWebsite: String!`, `companyDescription: String!`, `companyLogo: String!`, `companyBanner: String!`
- `addCooperatorToComapny` mutation with arguments: `cooperatorId: Int!`
- `removeCooperatorFromCompany` mutation with arguments: `cooperatorId: Int!`
- `updateCompany` mutation with arguments: `id: Int!`, `companyName: String`, `companyAddress: String`, `companyCity: String`, `companyCountry: String`, `companyZip: String`, `companyPhone: String`, `companyEmail: String`, `companyWebsite: String`, `companyDescription: String`, `companyLogo: String`, `companyBanner: String`

### ClientResolver:

- `createClient` mutation withou any arguments

### CooperatorResolver:

- `createCooperator` mutation with argument type
- `updateCooperator` mutation with arguments type

## OAuth Authentication System (IMPLEMENTED)

### Overview

System OAuth obsługuje logowanie przez Google i Facebook z automatycznym przekierowaniem na frontend z JWT tokenem.

### OAuth Flow

1. **Frontend inicjuje OAuth** z opcjonalnym parametrem redirect:

   ```
   GET /authorization/login/google?redirect=dashboard
   GET /authorization/login/facebook?redirect=profile/settings
   ```

2. **Backend przekierowuje** na OAuth provider (Google/Facebook)

3. **OAuth provider** przekierowuje z kodem autoryzacyjnym na backend callback

4. **Backend przetwarza** OAuth response, tworzy/znajduje użytkownika

5. **Backend generuje JWT token** i przekierowuje na frontend:

   ```
   https://app.easybons.com/dashboard?type=SUCCESS&token=eyJhbGci...
   ```

6. **Frontend dekoduje JWT token** i wyciąga dane użytkownika:
   ```javascript
   const urlParams = new URLSearchParams(window.location.search)
   const token = urlParams.get('token')
   if (token) {
     const payload = JSON.parse(atob(token.split('.')[1]))
     const userData = payload.user
     localStorage.setItem('authToken', token)
     localStorage.setItem('user', JSON.stringify(userData))
   }
   ```

### OAuth Endpoints

- `GET /authorization/login/google?redirect=<path>` - Inicjuje Google OAuth
- `GET /authorization/login/facebook?redirect=<path>` - Inicjuje Facebook OAuth
- `GET /authorization/login/google/return` - Google callback (automatyczny)
- `GET /authorization/login/facebook/callback` - Facebook callback (automatyczny)

### User Data w JWT Token

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "firstName": "John",
    "surname": "Doe",
    "picture": "https://...",
    "role": "NEW_USER",
    "profileType": "google" // lub "facebook"
  }
}
```

### Environment Configuration

#### Local (.env.local)

```bash
FACEBOOK_CALLBACK='http://localhost:4000/authorization/login/facebook/callback'
GOOGLE_CALLBACK='http://localhost:4000/authorization/login/google/return'
FRONT_END_APP_URL='http://localhost:3001'
```

#### Dev (.env.dev)

```bash
FACEBOOK_CALLBACK='https://api-dev.easybons.com:4000/authorization/login/facebook/callback'
GOOGLE_CALLBACK='https://api-dev.easybons.com:4000/authorization/login/google/return'
FRONT_END_APP_URL='https://app.easybons.com'
```

### OAuth Provider Setup

#### Google Console

1. https://console.developers.google.com
2. **Credentials** → **OAuth 2.0 Client IDs**
3. **Authorized redirect URIs**: Dodaj callback URLs z .env

#### Facebook Developers

1. https://developers.facebook.com
2. **Facebook Login** → **Settings**
3. **Valid OAuth Redirect URIs**: Dodaj callback URLs z .env
4. **App Mode**: Development (dla localhost) lub Live (dla production)

### Troubleshooting OAuth

- **Facebook blokuje localhost**: Ustaw App Mode na "Development" lub użyj ngrok
- **Google działa z localhost**: Bez dodatkowej konfiguracji
- **CORS problemy**: JWT w URL omija problemy CORS
- **Middleware blokuje**: Frontend middleware musi pozwolić na `?type=SUCCESS&token=...`

## Loyalty Stamps System (FULLY IMPLEMENTED)

### Overview

System pieczątek lojalnościowych z automatyczną walidacją integralności danych, pełnym audytem operacji i systemem pośrednich nagród (milestones).

### Core Components

1. **Loyalty Stamp Cards** - karty pieczątek użytkowników per merchant
2. **Loyalty Stamps** - pojedyncze pieczęcie z metadanymi
3. **Stamp Transactions** - historia wszystkich operacji na pieczątkach
4. **Stamp Audit Log** - automatyczny audit trail z triggerami PostgreSQL
5. **Integrity Service** - walidacja i naprawa niezgodności danych
6. **Stamp Milestones** - pośrednie nagrody za określoną liczbę pieczątek

### LoyaltyStampResolver

#### Queries

- `myStampCards` - karty pieczątek zalogowanego użytkownika
- `validateStampCardIntegrity(cardId: ID!)` - walidacja integralności karty (ADMIN)
- `getStampIntegrityReport` - raport integralności całego systemu (ADMIN)
- `getAvailableMilestones(cardId: ID!)` - dostępne nagrody pośrednie dla karty
- `myStampCardTemplates` - szablony kart pieczątek dla merchantów (OWNER/COOPERATOR)
- `availableStampCardTemplates` - dostępne szablony kart pieczątek

#### Mutations

- `addStamp(cardId: ID!, description: String!)` - dodanie pieczęci (OWNER/COOPERATOR/ADMIN)
- `fixStampCardDiscrepancy(cardId: ID!)` - naprawa niezgodności danych (ADMIN)
- `createStampCardTemplate(data: CreateStampCardTemplateInput!)` - tworzenie szablonu karty z milestones (OWNER/COOPERATOR/ADMIN)
- `activateStampCard(merchantId: ID!, templateId: ID?)` - aktywacja karty pieczątek dla użytkownika
- `activateStampCardForUser(userId: ID!, merchantId: ID!, templateId: ID?)` - aktywacja karty dla innego użytkownika (OWNER/COOPERATOR/ADMIN)

### Key Features

#### Data Integrity

- **Triple Validation** - saldo karty = suma transakcji = liczba fizycznych pieczątek
- **Automatic Triggers** - PostgreSQL triggery tworzą audit log przy każdej zmianie
- **Constraint Checks** - database constraints zapobiegają nieprawidłowym stanom
- **Self-Healing** - funkcje automatycznej naprawy niezgodności

#### Security & Authorization

- **Role-Based Access** - różne uprawnienia per rola użytkownika
- **Per-User Data** - użytkownicy widzą tylko swoje karty
- **Admin Functions** - funkcje diagnostyczne tylko dla adminów
- **Audit Trail** - pełna historia wszystkich operacji

### Stamp Milestones System (NEW)

#### Overview

System pośrednich nagród pozwala na definiowanie różnych typów nagród za określoną liczbę pieczątek przed osiągnięciem końcowej nagrody.

#### Milestone Types

- `DISCOUNT_PERCENT` - procentowa zniżka (np. 20% przy 5 pieczątkach)
- `DISCOUNT_AMOUNT` - stała zniżka kwotowa (np. 10zł przy 3 pieczątkach)
- `FREE_SERVICE` - darmowa usługa (np. darmowa kawa przy 7 pieczątkach)
- `POINTS_REWARD` - nagroda punktowa (np. 100 punktów przy 4 pieczątkach)

#### Creating Template with Milestones

```graphql
mutation {
  createStampCardTemplate(
    data: {
      title: "Karta Kawy Premium"
      description: "Zbieraj pieczątki i odbieraj nagrody!"
      stampsRequired: 10
      rewardTitle: "Darmowa kawa"
      rewardDescription: "Duża kawa dowolnego rodzaju"
      milestones: [
        {
          stampsRequired: 3
          milestoneType: DISCOUNT_PERCENT
          discountPercent: 10
          title: "10% zniżki"
          description: "10% zniżki na następny zakup"
        }
        {
          stampsRequired: 5
          milestoneType: DISCOUNT_PERCENT
          discountPercent: 20
          title: "20% zniżki"
          description: "20% zniżki na następny zakup"
        }
        {
          stampsRequired: 8
          milestoneType: DISCOUNT_PERCENT
          discountPercent: 50
          title: "50% zniżki"
          description: "Połowa ceny za następną kawę"
        }
      ]
    }
  ) {
    id
    title
    milestones {
      id
      stampsRequired
      milestoneType
      discountPercent
      title
    }
  }
}
```

#### Checking Available Rewards

```graphql
query {
  getAvailableMilestones(cardId: "card-id") {
    id
    stampsRequired
    milestoneType
    discountPercent
    discountAmount
    pointsReward
    title
    description
  }
}
```

### Usage Flow

1. **Sprawdzanie kart użytkownika**:

   ```graphql
   query {
     myStampCards {
       id
       merchant {
         name
       }
       stampsCollected
       stampsRequired
       template {
         title
         milestones {
           stampsRequired
           milestoneType
           title
           discountPercent
         }
       }
       stamps {
         id
         isUsed
       }
     }
   }
   ```

2. **Dodawanie pieczątek** (OWNER/COOPERATOR/ADMIN):

   ```graphql
   mutation {
     addStamp(cardId: "card-id", description: "Zakup kawy") {
       id
       cardId
       createdAt
     }
   }
   ```

3. **Sprawdzanie dostępnych nagród**:

   ```graphql
   query {
     getAvailableMilestones(cardId: "card-id") {
       stampsRequired
       milestoneType
       discountPercent
       title
       description
     }
   }
   ```

4. **Admin - raport integralności**:
   ```graphql
   query {
     getStampIntegrityReport
   }
   ```

## Point Vouchers System (FULLY IMPLEMENTED)

### Overview

System voucherów punktowych składa się z czterech głównych komponentów:

1. **Point Vouchers** - definicje voucherów do zakupu
2. **Point Balance & Transactions** - zarządzanie punktami użytkowników z automatyczną walidacją
3. **Voucher History** - pełna historia wszystkich voucherów z automatycznym tworzeniem
4. **User Point Management** - dodawanie punktów i zarządzanie saldem per użytkownik

### Voucher Types

- `SINGLE_SERVICE` - jedna usługa za ustaloną cenę w punktach
- `MULTI_USE` - voucher wielokrotnego użytku
- `SERVICE_PACKAGE` - pakiet usług
- `DISCOUNT_PERCENT` - procentowa zniżka
- `CASH_EQUIVALENT` - ekwiwalent pieniężny

### PointVoucherResolver

#### Queries

- `pointVouchers` - lista dostępnych voucherów punktowych
- `pointVoucher(id: ID!)` - szczegóły konkretnego vouchera

#### Mutations

- `createPointVoucher(data: CreatePointVoucherInput!)` - tworzenie nowego vouchera (admin)
- `purchasePointVoucher(pointVoucherId: ID!)` - zakup vouchera za punkty z automatyczną walidacją salda

### UserPointVoucherResolver

#### Queries

- `myPointVouchers` - lista voucherów użytkownika
- `userPointVoucherByQr(qrCode: String!)` - voucher po kodzie QR

#### Mutations

- `usePointVoucher(qrCode: String!)` - wykorzystanie vouchera z automatyczną historią

### PointsResolver (NEW)

#### Queries

- `myPointBalance` - saldo punktów zalogowanego użytkownika
- `myPointTransactions` - historia transakcji punktowych użytkownika
- `myVoucherHistory` - pełna historia voucherów użytkownika

#### Mutations

- `addPoints(amount: Float!, description: String!)` - dodanie punktów do konta użytkownika

### Point Balance System

#### UserPointBalance

- `totalPoints` - łączna liczba zdobytych punktów
- `availablePoints` - dostępne punkty do wydania
- `lockedPoints` - zablokowane punkty

#### PointTransaction Types

- `EARNED` - zdobyte punkty (referrals, bonusy)
- `SPENT` - wydane punkty (zakup voucherów) - **automatyczne przy zakupie**
- `REFUND` - zwrot punktów
- `BONUS` - dodatkowe punkty
- `PENALTY` - kara punktowa

### Voucher History (IMPLEMENTED)

Pełna historia wszystkich voucherów użytkownika:

- `POINT_VOUCHER` - vouchery punktowe
- `MERCHANT_VOUCHER` - vouchery merchant
- `SUBSCRIPTION_VOUCHER` - vouchery subskrypcji

Actions: `PURCHASED`, `USED`, `EXPIRED`, `REFUNDED`

**Automatyczne tworzenie historii:**

- Przy zakupie vouchera - wpis z `action: 'PURCHASED'`
- Przy wykorzystaniu vouchera - wpis z `action: 'USED'`

### Database Schema

```sql
-- Vouchery punktowe
PointVoucher {
  code: String (unique)
  title: String
  voucherType: VoucherType
  pointsCost: Int
  maxUses: Int
  metadata: Json // elastyczne dane
}

-- Zakupione vouchery użytkowników
UserPointVoucher {
  qrCode: String (unique)
  isUsed: Boolean
  validUntil: DateTime
}

-- Saldo punktów użytkownika
UserPointBalance {
  totalPoints: Int
  availablePoints: Int
  lockedPoints: Int
}

-- Historia transakcji punktowych
PointTransaction {
  type: TransactionType
  amount: Int
  balanceBefore: Int
  balanceAfter: Int
}

-- Historia wszystkich voucherów
VoucherHistory {
  voucherType: String
  action: String
  pointsSpent: Int?
  metadata: Json?
}
```

### Usage Flow

1. **Dodaj punkty użytkownikowi**:

   ```graphql
   mutation {
     addPoints(amount: 100, description: "Punkty startowe") {
       totalPoints
       availablePoints
     }
   }
   ```

2. **Admin tworzy voucher**:

   ```graphql
   mutation {
     createPointVoucher(
       data: {
         code: "COFFEE50"
         title: "Kawa za 50 punktów"
         voucherType: SINGLE_SERVICE
         pointsCost: 50
         maxUses: 100
       }
     ) {
       id
       code
     }
   }
   ```

3. **Sprawdź saldo przed zakupem**:

   ```graphql
   query {
     myPointBalance {
       availablePoints
       totalPoints
     }
   }
   ```

4. **Użytkownik kupuje voucher** (automatyczna walidacja i odejmowanie punktów):

   ```graphql
   mutation {
     purchasePointVoucher(pointVoucherId: "voucher-id") {
       qrCode
       validUntil
       pointVoucher {
         title
         pointsCost
       }
     }
   }
   ```

5. **Wykorzystanie vouchera** (automatyczna historia):

   ```graphql
   mutation {
     usePointVoucher(qrCode: "qr-code") {
       isUsed
       usedAt
     }
   }
   ```

6. **Sprawdź historię voucherów**:

   ```graphql
   query {
     myVoucherHistory {
       voucherType
       voucherTitle
       action
       pointsSpent
       createdAt
     }
   }
   ```

7. **Sprawdź historię transakcji punktowych**:
   ```graphql
   query {
     myPointTransactions {
       type
       amount
       description
       balanceBefore
       balanceAfter
       createdAt
     }
   }
   ```

### Key Features (IMPLEMENTED)

#### Automatic Point Management

- **Balance Validation** - sprawdzanie czy użytkownik ma wystarczająco punktów
- **Automatic Deduction** - automatyczne odejmowanie punktów przy zakupie
- **Transaction History** - pełna historia wszystkich operacji punktowych
- **Reference Tracking** - łączenie transakcji z konkretnymi voucherami

#### Security & User Isolation

- **Per-User Data** - każdy użytkownik widzi tylko swoje dane
- **JWT Authentication** - wszystkie operacje wymagają zalogowania
- **Balance Protection** - niemożliwość zakupu bez wystarczających punktów

#### Automatic History Tracking

- **Purchase History** - automatyczny wpis przy zakupie vouchera
- **Usage History** - automatyczny wpis przy wykorzystaniu vouchera
- **Complete Audit Trail** - pełna ścieżka audytu wszystkich operacji

### Integration with Existing Systems

- **Merchant Vouchers** - istniejący system voucherów merchant pozostaje bez zmian
- **Subscription Vouchers** - istniejący system voucherów subskrypcji pozostaje bez zmian
- **Referral System** - integracja z systemem punktów za polecenia
- **Point Balance** - centralne zarządzanie punktami użytkowników z pełną walidacją

## User Activities System (FULLY IMPLEMENTED)

### Overview

System aktywności użytkownika agreguje wszystkie akcje użytkownika (karty pieczątek, kupony, vouchery punktowe) w jeden endpoint z możliwością filtrowania i sortowania.

### UserActivityResolver

#### Queries

- `myActivities(filter?: UserActivityFilter, sort?: Sort[])` - wszystkie aktywności użytkownika z filtrami

#### Activity Types

- `STAMP_CARD` - karty pieczątek
- `COUPON` - kupony
- `POINT_VOUCHER` - vouchery punktowe

#### Activity Status

- `ACTIVE` - aktywne (kupony/vouchery ważne, nowe karty pieczątek)
- `IN_PROGRESS` - w trakcie (karty pieczątek z częściowymi pieczątkami)
- `COMPLETED` - ukończone (karty pieczątek z pełnymi pieczątkami)
- `EXPIRED` - przeterminowane
- `USED` - wykorzystane

### Filtering Options

- **types**: filtrowanie po typach aktywności
- **statuses**: filtrowanie po statusach
- **merchantId**: filtrowanie po konkretnym punkcie
- **searchText**: wyszukiwanie w tytule, opisie, nazwie merchanta

### Usage Flow

1. **Pobierz wszystkie aktywności użytkownika**:

   ```graphql
   query {
     myActivities {
       id
       type
       status
       title
       merchant {
         name
       }
       createdAt
       stampsCollected
       stampsRequired
     }
   }
   ```

2. **Filtrowanie aktywnych kart pieczątek**:

   ```graphql
   query {
     myActivities(filter: { types: [STAMP_CARD], statuses: [ACTIVE, IN_PROGRESS] }) {
       id
       type
       status
       title
       stampsCollected
       stampsRequired
     }
   }
   ```

3. **Wyszukiwanie z sortowaniem**:

   ```graphql
   query {
     myActivities(filter: { searchText: "kawa" }, sort: [{ field: "createdAt", order: desc }]) {
       id
       type
       title
       merchant {
         name
       }
     }
   }
   ```

## Activity Timeline System (NEW - FULLY IMPLEMENTED)

### Overview

System timeline aktywności użytkownika - **jeden endpoint** zwracający wszystkie aktywności z kierunkiem transakcji (▲/▼), czasem względnym i ikonami.

### ActivityTimelineResolver

#### Query

- `myActivityTimeline` - kompletna historia aktywności użytkownika

#### Timeline Activity Types

- `STAMP_ADDED` - otrzymano pieczątkę (▲)
- `STAMP_CARD_COMPLETED` - zrealizowano kartę pieczątek (▼)
- `STAMP_CARD_ACTIVATED` - aktywowano kartę pieczątek (▲)
- `POINTS_EARNED` - otrzymano punkty (▲)
- `POINTS_SPENT` - wydano punkty (▼)
- `COUPON_CLAIMED` - odebrano kupon (▲)
- `COUPON_USED` - wykorzystano kupon (▼)
- `VOUCHER_PURCHASED` - zakupiono voucher (▼)
- `VOUCHER_USED` - wykorzystano voucher (▼)

#### Transaction Direction

- `INCOMING` - ▲ Trójkąt w górę (otrzymano coś)
- `OUTGOING` - ▼ Trójkąt w dół (wykorzystano/wydano coś)

#### Response Fields

```typescript
{
  id: string
  type: TimelineActivityType
  direction: TransactionDirection // INCOMING lub OUTGOING
  title: string // "Otrzymano pieczątkę"
  description: string // "Pieczątka w Piekarnia Dorodka"
  createdAt: Date // 2024-01-15T10:30:00Z
  timeAgo: string // "2 godziny temu" lub "3 dni temu"
  iconUrl: string // URL ikony pieczątki/punktów
  merchantName: string // "Piekarnia Dorodka"
  merchantLogo: string // URL logo merchanta
  storeName: string // Nazwa sklepu (opcjonalnie)
  amount: number // Liczba punktów/pieczątek
  merchant: Merchant // Pełne dane merchanta
}
```

### Key Features

#### Automatic Time Formatting

- **< 1 minuta**: "Teraz"
- **< 60 minut**: "5 minut temu", "45 minut temu"
- **< 24 godziny**: "2 godziny temu", "23 godziny temu"
- **≥ 24 godziny**: "1 dzień temu", "5 dni temu"

#### Polish Pluralization

- Automatyczna odmiana: "1 minuta", "2 minuty", "5 minut"
- Poprawna gramatyka: "1 godzina", "3 godziny", "10 godzin"
- Dni: "1 dzień", "2 dni", "7 dni"

#### Icons & Branding

- **Pieczątki**: `template.iconUrl` - ikona z szablonu karty
- **Punkty**: `/assets/points-icon.png` - domyślna ikona punktów
- **Vouchery**: `/assets/voucher-icon.png` - ikona vouchera
- **Merchant Logo**: `merchant.logo` - logo punktu sprzedaży

### Usage Flow

1. **Pobierz pełną historię aktywności**:

   ```graphql
   query {
     myActivityTimeline {
       id
       type
       direction
       title
       description
       createdAt
       timeAgo
       iconUrl
       merchantName
       merchantLogo
       storeName
       amount
       merchant {
         id
         name
         logo
       }
     }
   }
   ```

2. **Przykładowa odpowiedź**:

   ```json
   [
     {
       "id": "stamp-abc123",
       "type": "STAMP_ADDED",
       "direction": "INCOMING",
       "title": "Otrzymano pieczątkę",
       "description": "Pieczątka w Piekarnia Dorodka",
       "createdAt": "2024-01-15T10:30:00Z",
       "timeAgo": "2 godziny temu",
       "iconUrl": "https://cdn.easybons.com/stamps/coffee.png",
       "merchantName": "Piekarnia Dorodka",
       "merchantLogo": "https://cdn.easybons.com/merchants/dorodka.png",
       "amount": 1,
       "merchant": { "id": "merchant-123", "name": "Piekarnia Dorodka" }
     },
     {
       "id": "point-xyz789",
       "type": "POINTS_EARNED",
       "direction": "INCOMING",
       "title": "Otrzymano punkty",
       "description": "Punkty startowe",
       "createdAt": "2024-01-14T15:20:00Z",
       "timeAgo": "1 dzień temu",
       "iconUrl": "/assets/points-icon.png",
       "merchantName": "EasyBons",
       "merchantLogo": "/assets/easybons-logo.png",
       "amount": 100
     }
   ]
   ```

### Mobile App Integration

```typescript
const ActivityTimelineScreen = () => {
  const { data } = useQuery(GET_ACTIVITY_TIMELINE)

  return (
    <FlatList
      data={data.myActivityTimeline}
      renderItem={({ item }) => (
        <ActivityCard>
          {/* Trójkąt kierunku */}
          <DirectionIcon direction={item.direction} />

          {/* Ikona aktywności */}
          <Image source={{ uri: item.iconUrl }} />

          {/* Tytuł i opis */}
          <Text>{item.title}</Text>
          <Text>{item.description}</Text>

          {/* Czas względny */}
          <Text>{item.timeAgo}</Text>

          {/* Logo merchanta */}
          <Image source={{ uri: item.merchantLogo }} />
          <Text>{item.merchantName}</Text>

          {/* Kwota (jeśli dotyczy) */}
          {item.amount && <Text>+{item.amount}</Text>}
        </ActivityCard>
      )}
    />
  )
}
```

### Benefits

1. **Jeden endpoint** - zamiast 3-4 zapytań, jedno zwraca wszystko
2. **Kierunek transakcji** - od razu wiadomo czy to dodanie (▲) czy odjęcie (▼)
3. **Czas względny** - "2 godziny temu" zamiast "2024-01-15T10:30:00Z"
4. **Ikony i branding** - wszystkie URL gotowe do wyświetlenia
5. **Sortowanie** - automatycznie od najnowszych
6. **Pełne dane** - merchant name, logo, store name w jednym miejscu

## Activity Timeline vs User Activities

### Kiedy używać którego?

**`myActivityTimeline`** - dla historii aktywności użytkownika:

- ✅ Timeline z kierunkiem transakcji (▲/▼)
- ✅ Czas względny ("2 godziny temu")
- ✅ Ikony i logo gotowe do wyświetlenia
- ✅ Wszystkie typy aktywności w jednym miejscu
- ✅ Sortowanie chronologiczne

**`myActivities`** - dla filtrowania i wyszukiwania:

- ✅ Filtrowanie po typach (STAMP_CARD, COUPON, POINT_VOUCHER)
- ✅ Filtrowanie po statusach (ACTIVE, COMPLETED, USED)
- ✅ Wyszukiwanie tekstowe
- ✅ Filtrowanie po merchantId
- ✅ Custom sortowanie

## Coupon System (FULLY IMPLEMENTED)

### Overview

System kuponów oferuje elastyczne rozwiązanie dla różnych typów promocji i zniżek. Kupony są automatycznie przypisywane do merchantów na podstawie zalogowanego użytkownika.

### Coupon Types

- `MULTI_BUY` - kup X, dostaniesz Y (np. kup 2, dostaniesz 3)
- `DISCOUNT` - zniżka procentowa lub kwotowa
- `DAY_OF_WEEK` - promocje w określone dni tygodnia
- `THRESHOLD_DISCOUNT` - zniżka przy przekroczeniu progu zakupów
- `ITEM_SPECIFIC` - promocja na konkretny produkt
- `BIRTHDAY` - specjalne oferty urodzinowe
- `ACTIVITY` - kupony za aktywność (np. pierwsze logowanie)

### Availability Types

- `FREE` - darmowe kupony
- `POINTS` - kupony za punkty

### CouponResolver

#### Queries

- `availableCoupons(merchantId?: String)` - dostępne kupony (opcjonalnie filtrowane po merchant)
- `myCoupons` - kupony użytkownika (zdobyte i zakupione)
- `myMerchantCoupons` - kupony merchanta (OWNER/COOPERATOR/ADMIN)

#### Mutations

- `createCoupon(data: CreateCouponInput!)` - tworzenie kuponu (OWNER/COOPERATOR/ADMIN)
- `claimCoupon(couponId: ID!, storeId?: ID)` - odebranie kuponu przez użytkownika (store opcjonalny)
- `useCoupon(couponId: ID!, storeId: ID!)` - wykorzystanie kuponu (store wymagany)

### Usage Flow

1. **Merchant tworzy kupon**:

   ```graphql
   mutation {
     createCoupon(
       data: {
         code: "COFFEE20"
         title: "20% zniżki na kawę"
         description: "Specjalna promocja na wszystkie kawy"
         couponType: DISCOUNT
         availability: FREE
         validFrom: "2024-01-01T00:00:00Z"
         validUntil: "2024-12-31T23:59:59Z"
         discountType: PERCENTAGE
         discountValue: 20
         maxUsesPerUser: 1
       }
     ) {
       id
       code
       title
       merchant {
         name
       }
     }
   }
   ```

2. **Użytkownik sprawdza dostępne kupony**:

   ```graphql
   query {
     availableCoupons {
       id
       code
       title
       description
       couponType
       availability
       pointsCost
       discountType
       discountValue
       validUntil
       merchant {
         name
       }
     }
   }
   ```

3. **Użytkownik odbiera kupon**:

   ```graphql
   mutation {
     claimCoupon(couponId: "coupon-id", storeId: "store-id") {
       id
       title
       merchant {
         name
       }
     }
   }
   ```

4. **Użytkownik wykorzystuje kupon**:

   ```graphql
   mutation {
     useCoupon(couponId: "coupon-id", storeId: "store-id")
   }
   ```

5. **Sprawdzanie kuponów użytkownika**:

   ```graphql
   query {
     myCoupons {
       id
       code
       title
       isUsed
       usedAt
       merchant {
         name
       }
     }
   }
   ```

### Key Features

#### Automatic Merchant Assignment

- **Security** - kupony automatycznie przypisywane do merchanta na podstawie JWT tokena
- **Simplicity** - brak potrzeby podawania merchantId w formularzach
- **Validation** - tylko właściciele/współpracownicy mogą tworzyć kupony dla swoich merchantów

#### Flexible Coupon System

- **Multiple Types** - 7 różnych typów kuponów dla różnych scenariuszy
- **Point Integration** - kupony mogą być darmowe lub za punkty
- **Usage Limits** - kontrola nad liczbą użyć na użytkownika
- **Time Validity** - okresy ważności kuponów

#### User Experience

- **Easy Discovery** - użytkownicy mogą przeglądać dostępne kupony
- **Simple Claiming** - łatwe odbieranie kuponów
- **Usage Tracking** - pełna historia wykorzystania kuponów

## Location-Based Search System (FULLY IMPLEMENTED)

### Overview

System wyszukiwania po lokalizacji umożliwia znajdowanie sklepów i kuponów w pobliżu użytkownika z wykorzystaniem GPS, user's preferred city i fallback detection.

**Pełna dokumentacja**: [docs/USER_LOCATION_SYSTEM.md](docs/USER_LOCATION_SYSTEM.md)

### Location Priority Flow

```
1. GPS Coordinates (user provides lat/lng)
   ↓ (if not provided)
2. User's Preferred City (from database: User.preferredCity)
   ↓ (if not set)
3. Default Location (Kraków, Poland)
```

### Key Features

- **Generic Location Resolution** - jedna metoda `resolveUserLocation()` dla wszystkich endpointów
- **OpenStreetMap Nominatim API** - darmowe geocoding dla dowolnych polskich miast
- **Database Integration** - pole `preferredCity` w modelu User
- **Automatic Fallback** - zawsze zwraca lokalizację (Kraków jako default)

## Profile Setup Progress System (FULLY IMPLEMENTED)

### Overview

System automatycznego śledzenia postępu wypełniania profilu firmy z zapisywaniem częściowych danych formularzy (drafts).

### Key Features

1. **Automatyczne wykrywanie kroku** - system sam wykrywa na jakim etapie jest użytkownik
2. **Zapisywanie drafts** - częściowo wypełnione formularze są zapisywane
3. **Jedno zapytanie** - zamiast 4-5 zapytań, jedno zwraca wszystko
4. **Elastyczne dane** - JSON pozwala na dowolną strukturę formularza

### ProfileSetupResolver

#### Query

- `myProfileSetupStatus` - zwraca kompletny stan konfiguracji profilu (currentStep, completedSteps, hasCompany, hasMerchant, hasStore, hasSubscription, drafts)

#### Mutations

- `saveFormDraft(input: SaveFormDraftInput!)` - zapisuje częściowo wypełniony formularz
- `clearFormDraft(formType: String!)` - usuwa zapisany draft

### Setup Steps

1. **COMPANY_INFO** - podstawowe informacje o firmie
2. **COMPANY_PHOTO** - zdjęcie firmy (logo)
3. **MERCHANT_INFO** - krótki opis firmy
4. **MERCHANT_LOCATION** - dodaj punkt sprzedaży
5. **COMPANY_DETAILS** - informacje o firmie (NIP, adres)
6. **SUBSCRIPTION** - wybierz plan
7. **COMPLETED** - gotowe!

### Usage Example

```graphql
query {
  myProfileSetupStatus {
    currentStep
    completedSteps
    isCompleted
    hasCompany
    hasMerchant
    hasStore
    hasSubscription
    companyDraft
    merchantDraft
    storeDraft
  }
}

mutation {
  saveFormDraft(
    input: { formType: "COMPANY", formData: { name: "Cofnij", cityOperate: ["Warszawa"] }, step: COMPANY_INFO }
  )
}
```

Pełna dokumentacja: [docs/PROFILE_SETUP_SYSTEM.md](docs/PROFILE_SETUP_SYSTEM.md)

## Location-Based Search System (FULLY IMPLEMENTED)

### Overview

System wyszukiwania po lokalizacji umożliwia znajdowanie sklepów i kuponów w pobliżu użytkownika z wykorzystaniem GPS i fallback detection.

### Core Features

1. **GPS-Based Search** - precyzyjne wyszukiwanie po współrzędnych GPS
2. **Fallback Location Detection** - automatyczne wykrywanie lokalizacji z IP, timezone
3. **Distance Calculation** - obliczanie odległości wzorem Haversine
4. **Combined Results** - sklepy i kupony w jednym zapytaniu
5. **Sorted by Distance** - wyniki sortowane od najbliższych

### LocationResolver

#### Queries

- `searchByLocation(location: LocationSearchInput!)` - główne wyszukiwanie GPS
- `searchByFallbackLocation(fallback: FallbackLocationInput!, radiusKm: Float, searchText: String)` - fallback detection
- `nearbyStores(location: LocationSearchInput!)` - tylko sklepy w pobliżu
- `nearbyCoupons(location: LocationSearchInput!)` - tylko kupony w pobliżu

#### Input Types

```graphql
input LocationSearchInput {
  latitude: Float!
  longitude: Float!
  radiusKm: Float = 10
  searchText: String
}

input FallbackLocationInput {
  ipAddress: String
  userAgent: String
  timezone: String
  language: String
}
```

#### Output Types

```graphql
type StoreWithDistance {
  store: MerchantStore!
  merchant: Merchant!
  distanceKm: Float!
}

type CouponWithDistance {
  coupon: Coupon!
  merchant: Merchant!
  store: MerchantStore!
  distanceKm: Float!
}

type LocationSearchResult {
  stores: [StoreWithDistance!]!
  coupons: [CouponWithDistance!]!
  searchLatitude: Float!
  searchLongitude: Float!
  searchRadiusKm: Float!
}
```

### Usage Flow

1. **GPS-based search**:

   ```graphql
   query {
     searchByLocation(location: { latitude: 52.2297, longitude: 21.0122, radiusKm: 5 }) {
       stores {
         store {
           name
           address
         }
         merchant {
           name
         }
         distanceKm
       }
       coupons {
         coupon {
           title
           discountValue
         }
         distanceKm
       }
     }
   }
   ```

2. **Fallback location search**:

   ```graphql
   query {
     searchByFallbackLocation(fallback: { timezone: "Europe/Warsaw" }, radiusKm: 20) {
       stores {
         store {
           name
         }
         distanceKm
       }
       searchLatitude
       searchLongitude
     }
   }
   ```

3. **Nearby coupons only**:

   ```graphql
   query {
     nearbyCoupons(location: { latitude: 52.2297, longitude: 21.0122, radiusKm: 10 }) {
       coupon {
         title
         discountValue
         validUntil
       }
       merchant {
         name
       }
       store {
         name
         address
       }
       distanceKm
     }
   }
   ```

### Key Features

#### Smart Location Detection

- **GPS Priority** - najdokładniejsze wyniki z GPS coordinates
- **User Preferred City** - pobiera miasto z bazy danych (User.preferredCity)
- **Nominatim Geocoding** - konwertuje nazwę miasta na współrzędne GPS
- **IP Geolocation** - fallback z ip-api.com dla przybliżonej lokalizacji
- **Timezone Mapping** - mapowanie timezone na współrzędne
- **Default Location** - Kraków jako ostateczny fallback

#### Distance Calculation

- **Haversine Formula** - precyzyjne obliczanie odległości między punktami GPS
- **Radius Filtering** - filtrowanie wyników w określonym promieniu
- **Sorted Results** - automatyczne sortowanie od najbliższych

#### Database Integration

- **MerchantStore GPS** - wykorzystuje pola `latitude`, `longitude` w sklepach
- **Active Only** - tylko aktywne sklepy i ważne kupony
- **Text Search** - dodatkowe filtrowanie po nazwie/adresie

### Test Data

Seed zawiera przykładowe sklepy z GPS coordinates:

```
# Warsaw stores
Starbucks Warsaw: 52.2297, 21.0122 (Złote Tarasy)
McDonald's Warsaw: 52.2319, 21.0067 (Centrum)

# Krakow stores
Starbucks Krakow: 50.0647, 19.9450 (Galeria Krakowska)
McDonald's Krakow: 50.0616, 19.9373 (Rynek Główny)

# Sample coupons
COFFEE20: 20% off Coffee (Starbucks)
BIGMAC50: 50% off Big Mac (McDonald's)
```

### Mobile App Integration

```javascript
// GPS-based search
const searchNearby = async (lat, lng, radius = 10) => {
  const query = `
    query SearchByLocation($lat: Float!, $lng: Float!, $radius: Float!) {
      searchByLocation(location: {
        latitude: $lat
        longitude: $lng
        radiusKm: $radius
      }) {
        stores {
          store { name address phone }
          merchant { name }
          distanceKm
        }
        coupons {
          coupon { title discountValue }
          distanceKm
        }
      }
    }
  `

  return await graphqlClient.query({
    query,
    variables: { lat, lng, radius },
  })
}

// Fallback search
const searchByFallback = async () => {
  const query = `
    query SearchByFallback($fallback: FallbackLocationInput!) {
      searchByFallbackLocation(fallback: $fallback, radiusKm: 25) {
        stores { store { name } distanceKm }
        coupons { coupon { title } distanceKm }
        searchLatitude
        searchLongitude
      }
    }
  `

  return await graphqlClient.query({
    query,
    variables: {
      fallback: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
      },
    },
  })
}
```

## Troubleshoting

### Error with canvas:

try to use first:

```bash
arch -arm64 brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

then:
install node_module once again

## How to use

### 1. Download example & install dependencies

Clone this repository:

```
git clone git@github.com:prisma/prisma-examples.git --depth=1
```

Install npm dependencies:

```
cd prisma-examples/typescript/graphql-typegraphql
npm install
```

Note that this also generates Prisma Client JS into `node_modules/@prisma/client` via a `postinstall` hook of the `@prisma/client` package from your `package.json`.

### 2. Start the GraphQL server

Launch your GraphQL server with this command:

```
npm run dev
```

Navigate to [http://localhost:4000](http://localhost:4000) in your browser to explore the API of your GraphQL server in a [GraphQL Playground](https://github.com/prisma/graphql-playground).

## Using the GraphQL API

The schema specifies the API operations of your GraphQL server. TypeGraphQL allows you to define a schema using TypeScript classes and decorators. The schema is generated at runtime, and is defined by the following classes:

- [`./src/PostResolvers.ts`](./src/PostResolvers.ts)
- [`./src/UserResolvers.ts`](./src/UserResolvers.ts)
- [`./src/User.ts`](src/User/objectType/User.ts)
- [`./src/Post.ts`](src/Post/Post.ts)
- [`./src/UserCreateInput.ts`](./src/UserCreateInput.ts)
- [`./src/PostCreateInput.ts`](./src/PostCreateInput.ts)

Below are a number of operations that you can send to the API using the GraphQL Playground.

Feel free to adjust any operation by adding or removing fields. The GraphQL Playground helps you with its auto-completion and query validation features.

#### Retrieve all published posts and their authors

```graphql
query {
  feed {
    id
    title
    content
    published
    author {
      id
      name
      email
    }
  }
}
```

<Details><Summary><strong>See more API operations</strong></Summary>

#### Create a new user

```graphql
mutation {
  signupUser(data: { name: "Sarah", email: "sarah@prisma.io" }) {
    id
  }
}
```

#### Create a new draft

```graphql
mutation {
  createDraft(data: { title: "Join the Prisma Slack", content: "https://slack.prisma.io", email: "alice@prisma.io" }) {
    id
    published
  }
}
```

#### Publish an existing draft

```graphql
mutation {
  publish(id: __POST_ID__) {
    id
    published
  }
}
```

> **Note**: You need to replace the `__POST_ID__`-placeholder with an actual `id` from a `Post` item. You can find one e.g. using the `filterPosts`-query.

#### Search for posts with a specific title or content

```graphql
{
  filterPosts(searchString: "graphql") {
    id
    title
    content
    published
    author {
      id
      name
      email
    }
  }
}
```

#### Retrieve a single post

```graphql
{
  post(id: __POST_ID__) {
    id
    title
    content
    published
    author {
      id
      name
      email
    }
  }
}
```

> **Note**: You need to replace the `__POST_ID__`-placeholder with an actual `id` from a `Post` item. You can find one e.g. using the `filterPosts`-query.

#### Delete a post

```graphql
mutation {
  deleteOnePost(id: __POST_ID__) {
    id
  }
}
```

> **Note**: You need to replace the `__POST_ID__`-placeholder with an actual `id` from a `Post` item. You can find one e.g. using the `filterPosts`-query.

</Details>

## Evolving the app

Evolving the application typically requires four subsequent steps:

1. Migrating the database schema using SQL
1. Updating your Prisma schema by introspecting the database with `prisma introspect`
1. Generating Prisma Client to match the new database schema with `prisma generate`
1. Using the updated Prisma Client in your application code

For the following example scenario, assume you want to add a "profile" feature to the app where users can create a profile and write a short bio about themselves.

### 1. Change your database schema using SQL

The first step would be to add a new table, e.g. called `Profile`, to the database. In SQLite, you can do so by running the following SQL statement:

```sql
CREATE TABLE "Profile" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "bio" TEXT,
  "user" INTEGER NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE SET NULL
);
```

To run the SQL statement against the database, you can use the `sqlite3` CLI in your terminal, e.g.:

```bash
sqlite3 dev.db \
'CREATE TABLE "Profile" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "bio" TEXT,
  "user" INTEGER NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE SET NULL
);'
```

Note that we're adding a unique constraint to the foreign key on `user`, this means we're expressing a 1:1 relationship between `User` and `Profile`, i.e.: "one user has one profile".

While your database now is already aware of the new table, you're not yet able to perform any operations against it using Prisma Client. The next two steps will update the Prisma Client API to include operations against the new `Profile` table.

### 2. Introspect your database

The Prisma schema is the foundation for the generated Prisma Client API. Therefore, you first need to make sure the new `Profile` table is represented in it as well. The easiest way to do so is by introspecting your database:

```
npx prisma introspect
```

> **Note**: You're using [npx](https://github.com/npm/npx) to run Prisma 2 CLI that's listed as a development dependency in [`package.json`](./package.json). Alternatively, you can install the CLI globally using `npm install -g @prisma/cli`. When using Yarn, you can run: `yarn prisma dev`.

The `introspect` command updates your `schema.prisma` file. It now includes the `Profile` model and its 1:1 relation to `User`:

```prisma
model Post {
  author    User?
  content   String?
  id        Int     @id
  published Boolean @default(false)
  title     String
}

model User {
  email   String   @unique
  id      Int      @id
  name    String?
  post    Post[]
  profile Profile?
}

model Profile {
  bio  String?
  id   Int     @default(autoincrement()) @id
  user Int     @unique
  User User    @relation(fields: [user], references: [id])
}
```

### 3. Generate Prisma Client

With the updated Prisma schema, you can now also update the Prisma Client API with the following command:

```
npx prisma generate
```

This command updated the Prisma Client API in `node_modules/@prisma/client`.

### 4. Use the updated Prisma Client in your application code

#### Option A: Expose `Profile` operations via TypeGraphQL

You can use TypeGraphQL to expose the new `Profile` model.

Create a new file named `src\Profile.ts` and add the following code:

```ts
import 'reflect-metadata'
import { ObjectType, Field, ID } from 'type-graphql'
import { User } from './User'

@ObjectType()
export class Profile {
  @Field((type) => ID)
  id: number

  @Field((type) => User, { nullable: true })
  user?: User | null

  @Field((type) => String, { nullable: true })
  bio?: string | null
}
```

Create a new file named `src\ProfileCreateInput.ts` with the following code:

```ts
import 'reflect-metadata'
import { ObjectType, Field, ID, InputType } from 'type-graphql'
import { User } from './User'

@InputType()
export class ProfileCreateInput {
  @Field((type) => String, { nullable: true })
  bio?: string | null
}
```

Add the `bio` field to `.src\User.ts` and import the `Profile` class.

```ts
  @Field(type => Profile, { nullable: true })
  bio?: Profile | null;
```

Add the `bio` field to `src\UserCreateInput.ts` and import the `ProfileCreateInput` class:

```ts
  @Field(type => ProfileCreateInput, { nullable: true })
  bio?: ProfileCreateInput | null;
```

Extend the `src\UserResolver.ts` class with an additional field resolver:

```ts
  @FieldResolver()
  async bio(@Root() user: User, @Ctx() ctx: Context): Promise<Profile> {
    return (await ctx.prisma.user.findFirst({
      where: {
        id: user.id
      }
    }).profile())!
  }
```

Update the `signupUser` mutation to include the option to create a profile when you sign up a new user:

```ts
  @Mutation(returns => User)
  async signupUser(
    @Arg("data") data: UserCreateInput,
    @Ctx() ctx: Context): Promise<User> {
    try {
      return await ctx.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          profile: {
            create: {
              bio: data.bio?.bio
            }
          }
        }
      });
    }
    catch (error) {
      throw error;
    }
  }
```

Run the following mutation to create a user with a profile:

```
mutation {
  signupUser(data: {email:"katla@prisma.io", bio: { bio: "Sometimes I'm an Icelandic volcano, sometimes I'm a dragon from a book."}})
  {
    id,
    email,
    posts {
      title
    }
    bio {
      id,
      bio
    }
  }
}
```

Run the following query to return a user and their profile:

```
query {
  user(id:1) {
    email,
    bio {
      id,
      bio
    }
    posts {
      title,
      content
      }
  }
}
```

#### Option B: Use the `PrismaClient` instance directly

As the Prisma Client API was updated, you can now also invoke "raw" operations via `prisma.profile` directly.

##### Create a new profile for an existing user

```ts
const profile = await prisma.profile.create({
  data: {
    bio: 'Hello World',
    user: {
      connect: { email: 'alice@prisma.io' },
    },
  },
})
```

##### Create a new user with a new profile

```ts
const user = await prisma.user.create({
  data: {
    email: 'john@prisma.io',
    name: 'John',
    profile: {
      create: {
        bio: 'Hello World',
      },
    },
  },
})
```

##### Update the profile of an existing user

```ts
const userWithUpdatedProfile = await prisma.user.update({
  where: { email: 'alice@prisma.io' },
  data: {
    profile: {
      update: {
        bio: 'Hello Friends',
      },
    },
  },
})
```

## Next steps

- Check out the [Prisma docs](https://www.prisma.io/docs)
- Share your feedback in the [`prisma2`](https://prisma.slack.com/messages/CKQTGR6T0/) channel on the [Prisma Slack](https://slack.prisma.io/)
- Create issues and ask questions on [GitHub](https://github.com/prisma/prisma/)

## Push Notifications System (FULLY IMPLEMENTED)

### Overview

System push notifications przez Firebase Cloud Messaging (FCM) z automatycznym wysyłaniem powiadomień przy kluczowych akcjach użytkownika.

**Pełna dokumentacja dla frontend**: [docs/PUSH_NOTIFICATIONS_FRONTEND.md](docs/PUSH_NOTIFICATIONS_FRONTEND.md)

### Key Features

✅ **Automatyczne powiadomienia** - wysyłane przy każdej akcji użytkownika
✅ **Queue system** - BullMQ + Redis dla wydajności
✅ **Automatic retry** - 3 próby z exponential backoff
✅ **Invalid token cleanup** - automatyczne usuwanie nieaktywnych tokenów
✅ **Kategorie** - GENERAL, PROMOTIONS, SECURITY
✅ **20+ typów** - STAMP_ADDED, POINTS_EARNED, COUPON_CLAIMED, etc.

### Automatyczne powiadomienia dla:

- **Pieczątki**: Dodanie pieczątki, ukończenie karty, milestone
- **Punkty**: Otrzymanie punktów, wydanie punktów
- **Kupony**: Nowy kupon, kupon wygasa
- **Zamówienia**: Zamówienie gotowe do odbioru
- **Referrals**: Polecenie zrealizowane

### Backend Endpoints

```graphql
# Rejestracja urządzenia
mutation RegisterDevice($fcmToken: String!, $platform: String!, $deviceId: String!, $deviceName: String) {
  registerDevice(fcmToken: $fcmToken, platform: $platform, deviceId: $deviceId, deviceName: $deviceName)
}

# Pobierz powiadomienia
query MyNotifications($category: NotificationCategory) {
  myNotifications(category: $category) {
    id
    category
    type
    title
    message
    imageUrl
    isRead
    createdAt
  }
}

# Liczba nieprzeczytanych
query UnreadNotificationsCount($category: NotificationCategory) {
  unreadNotificationsCount(category: $category)
}

# Oznacz jako przeczytane
mutation MarkNotificationAsRead($notificationId: String!) {
  markNotificationAsRead(notificationId: $notificationId)
}
```

### Environment Variables

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
REDIS_URL=redis://localhost:6379
```

### Architecture

```
User Action (Stamp/Points/Coupon)
  ↓
PushNotificationHelper
  ↓
NotificationService
  ↓
BullMQ Queue (Redis)
  ↓
Worker (Background)
  ↓
Firebase Cloud Messaging
  ↓
Mobile Device
```

### Frontend Implementation

Szczegółowa dokumentacja dla frontend team: [docs/PUSH_NOTIFICATIONS_FRONTEND.md](docs/PUSH_NOTIFICATIONS_FRONTEND.md)

**Krótko:**

1. Zainstaluj `expo-notifications`
2. Dodaj Firebase config files (`google-services.json`, `GoogleService-Info.plist`)
3. Zaimplementuj `NotificationService`
4. Zarejestruj urządzenie przy logowaniu
5. Dodaj UI dla historii powiadomień

**Czas implementacji: ~2-3 godziny** 🚀
