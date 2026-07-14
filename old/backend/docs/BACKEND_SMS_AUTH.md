# Backend SMS Phone Authentication

## Quick Start

### 1. Send SMS Code

```bash
# Send verification code
curl --location '{{base_url}}/authorization/phone/send-code' \
--header 'Content-Type: application/json' \
--data '{
    "phoneNumber": "+48123456789"
}'
```

**Response:**

```json
{
  "success": true,
  "message": "Verification code sent successfully"
}
```

### 2. Verify Code & Login

```bash
# Verify code and get JWT token
curl --location '{{base_url}}/authorization/phone/verify-code' \
--header 'Content-Type: application/json' \
--data '{
    "phoneNumber": "+48123456789",
    "code": "123456"
}'
```

**Response:**

```json
{
  "success": true,
  "isNewUser": true,
  "token": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "type": "Bearer"
  },
  "user": {
    "id": "clx123",
    "phone": "+48123456789",
    "roles": ["CLIENT"],
    "profileType": "phone"
  }
}
```

---

## Frontend Integration

```typescript
// 1. Send code
const sendCode = async (phoneNumber: string) => {
  const res = await fetch('{{base_url}}/authorization/phone/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
  })
  return await res.json()
}

// 2. Verify code
const verifyCode = async (phoneNumber: string, code: string) => {
  const res = await fetch('{{base_url}}/authorization/phone/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, code }),
  })
  const data = await res.json()

  if (data.success) {
    await AsyncStorage.setItem('authToken', data.token.access_token)
    await AsyncStorage.setItem('user', JSON.stringify(data.user))
  }

  return data
}

// 3. Use token in GraphQL
const token = await AsyncStorage.getItem('authToken')
fetch('{{base_url}}/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ query: '...' }),
})
```

---

## Features

- ✅ Rate limiting: 1 SMS per 4 minutes
- ✅ Code expires after 5 minutes
- ✅ Auto-creates user if phone doesn't exist
- ✅ Phone format: `+48123456789` (must include country code)

---

## Overview

System autoryzacji przez SMS wysyłany z backendu. Backend generuje kod weryfikacyjny i wysyła go przez SMS (Twilio/Vonage).

## Endpoints

### 1. **POST /authorization/phone/send-code**

Wysyła kod weryfikacyjny SMS na podany numer telefonu.

**Request Body:**

```json
{
  "phoneNumber": "+48123456789"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Verification code sent successfully"
}
```

**Response (Error - 400):**

```json
{
  "success": false,
  "error": "Phone number is required",
  "message": "Phone number is required"
}
```

**Response (Rate Limit - 400):**

```json
{
  "success": false,
  "message": "Please wait 240 seconds before requesting a new code"
}
```

---

### 2. **POST /authorization/phone/verify-code**

Weryfikuje kod SMS i loguje/rejestruje użytkownika.

**Request Body:**

```json
{
  "phoneNumber": "+48123456789",
  "code": "123456"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "isNewUser": true,
  "token": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "type": "Bearer"
  },
  "user": {
    "id": "user-uuid",
    "phone": "+48123456789",
    "name": "+48123456789",
    "firstName": "",
    "surname": "",
    "roles": ["CLIENT"],
    "profileType": "phone",
    "registrationSource": "MOBILE_CLIENT"
  }
}
```

**Response (Error - 400):**

```json
{
  "success": false,
  "error": "Invalid verification code",
  "message": "Invalid verification code"
}
```

**Response (Expired - 400):**

```json
{
  "success": false,
  "message": "Verification code expired. Please request a new code."
}
```

---

## Flow

```
1. User wpisuje numer telefonu
   ↓
2. Frontend → POST /authorization/phone/send-code
   ↓
3. Backend generuje 6-cyfrowy kod
   ↓
4. Backend wysyła SMS przez Twilio/Vonage
   ↓
5. User dostaje SMS z kodem
   ↓
6. User wpisuje kod
   ↓
7. Frontend → POST /authorization/phone/verify-code
   ↓
8. Backend weryfikuje kod
   ↓
9. Backend tworzy/znajduje użytkownika
   ↓
10. Backend zwraca JWT token
```

---

## Features

### ✅ Rate Limiting

- Max 1 SMS na 4 minuty dla tego samego numeru
- Kod ważny przez 5 minut

### ✅ Auto Registration

- Jeśli numer nie istnieje → tworzy nowego użytkownika
- Jeśli numer istnieje → loguje użytkownika

### ✅ Security

- Kod 6-cyfrowy (100,000 - 999,999)
- Automatyczne usuwanie kodu po weryfikacji
- Automatyczne wygasanie po 5 minutach

---

## TODO: Integracja z Twilio

Obecnie kody są logowane w konsoli (DEVELOPMENT ONLY). Aby wysyłać prawdziwe SMS-y:

### 1. Zainstaluj Twilio SDK

```bash
npm install twilio
```

### 2. Dodaj zmienne środowiskowe

```bash
# .env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Odkomentuj kod w `PhoneSmsService.ts`

```typescript
private static async sendSmsViaTwilio(phoneNumber: string, code: string): Promise<void> {
  const twilio = require('twilio')
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

  await client.messages.create({
    body: `Your EasyBons verification code is: ${code}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  })
}
```

### 4. Wywołaj w `sendVerificationCode()`

```typescript
// Replace console.log with:
await this.sendSmsViaTwilio(phoneNumber, code)
```

---

## Frontend Integration

```typescript
// 1. Wyślij kod SMS
const sendCode = async (phoneNumber: string) => {
  const response = await fetch('https://api-dev.easybons.com:4000/authorization/phone/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
  })

  const data = await response.json()
  return data.success
}

// 2. Zweryfikuj kod
const verifyCode = async (phoneNumber: string, code: string) => {
  const response = await fetch('https://api-dev.easybons.com:4000/authorization/phone/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, code }),
  })

  const data = await response.json()

  if (data.success) {
    // Zapisz token
    await AsyncStorage.setItem('authToken', data.token.access_token)
    await AsyncStorage.setItem('user', JSON.stringify(data.user))
    return data
  }

  throw new Error(data.message)
}
```

---

## Testing (Development)

W trybie development kody są logowane w konsoli backendu:

```
📱 SMS Code for +48123456789: 123456
```

Możesz użyć tego kodu do testowania bez wysyłania prawdziwych SMS-ów.

---

## Production Checklist

- [x] Zainstaluj Twilio SDK
- [x] Dodaj zmienne środowiskowe Twilio
- [x] Zaimplementuj `sendSmsViaTwilio()` w `PhoneSmsService.ts`
- [x] Skonfiguruj AWS Secrets Manager dla production
- [ ] Skonfiguruj Redis dla production (zamiast in-memory Map)

---

## Twilio Configuration

### Production (AWS Secrets Manager)

**Credentials:**

- `TWILIO_ACCOUNT_SID`: <redacted — see AWS Secrets Manager / 1Password>
- `TWILIO_AUTH_TOKEN`: <redacted — see AWS Secrets Manager / 1Password>
- `TWILIO_PHONE_NUMBER`: <redacted — see AWS Secrets Manager / 1Password>

**AWS Secrets Manager Setup:**

```bash
# Create secrets
aws secretsmanager create-secret \
  --name bonapka/TWILIO_ACCOUNT_SID \
  --secret-string "$TWILIO_ACCOUNT_SID" \
  --region eu-central-1

aws secretsmanager create-secret \
  --name bonapka/TWILIO_AUTH_TOKEN \
  --secret-string "$TWILIO_AUTH_TOKEN" \
  --region eu-central-1

aws secretsmanager create-secret \
  --name bonapka/TWILIO_PHONE_NUMBER \
  --secret-string "+17752641570" \
  --region eu-central-1
```

**ECS Task Definition:**

```json
({
  "name": "TWILIO_ACCOUNT_SID",
  "valueFrom": "arn:aws:secretsmanager:eu-central-1:190275053744:secret:bonapka/TWILIO_ACCOUNT_SID"
},
{
  "name": "TWILIO_AUTH_TOKEN",
  "valueFrom": "arn:aws:secretsmanager:eu-central-1:190275053744:secret:bonapka/TWILIO_AUTH_TOKEN"
},
{
  "name": "TWILIO_PHONE_NUMBER",
  "valueFrom": "arn:aws:secretsmanager:eu-central-1:190275053744:secret:bonapka/TWILIO_PHONE_NUMBER"
})
```

**IMPORTANT**: AWS adds random suffixes to secret ARNs (e.g., `-MusnYz`), but ECS accepts ARNs without suffixes.

**Deploy:**

```bash
# Register new task definition
aws ecs register-task-definition \
  --cli-input-json file://infra/ecs-task-definition.json \
  --region eu-central-1

# Deploy
./infra/deploy.sh
```

### Local/Dev Environment

**Add to `.env.local` and `.env.dev`:**

```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```
