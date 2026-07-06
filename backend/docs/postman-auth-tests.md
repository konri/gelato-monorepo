# Auth Flow Tests - Postman Collection

## 1. Register User - WEB_MERCHANT

```bash
curl --location '{{base_url}}/authorization/signup' \
--header 'Content-Type: application/json' \
--data '{
    "email": "test-web@example.com",
    "password": "password123",
    "name": "Test Web User",
    "registrationSource": "WEB_MERCHANT"
}'
```

## 2. Register User - MOBILE_CLIENT

```bash
curl --location '{{base_url}}/authorization/signup' \
--header 'Content-Type: application/json' \
--data '{
    "email": "test-mobile@example.com",
    "password": "password123",
    "name": "Test Mobile User",
    "registrationSource": "MOBILE_CLIENT"
}'
```

## 3. Check User Exists

```bash
curl --location '{{base_url}}/authorization/check-user/test-web@example.com' \
--header 'Content-Type: application/json'
```

## 4. Login NEW_USER (WEB_MERCHANT source) to WEB_MERCHANT

```bash
curl --location '{{base_url}}/authorization/login' \
--header 'Content-Type: application/json' \
--data '{
    "email": "test-web@example.com",
    "password": "password123",
    "loginContext": "WEB_MERCHANT"
}'
```

## 5. Login NEW_USER (MOBILE_CLIENT source) to MOBILE_CLIENT

```bash
curl --location '{{base_url}}/authorization/login' \
--header 'Content-Type: application/json' \
--data '{
    "email": "test-mobile@example.com",
    "password": "password123",
    "loginContext": "MOBILE_CLIENT"
}'
```

## 6. Login NEW_USER (MOBILE_CLIENT source) to WEB_MERCHANT (Cross-app upgrade)

```bash
curl --location '{{base_url}}/authorization/login' \
--header 'Content-Type: application/json' \
--data '{
    "email": "test-mobile@example.com",
    "password": "password123",
    "loginContext": "WEB_MERCHANT"
}'
```

## 7. Login NEW_USER (WEB_MERCHANT source) to MOBILE_CLIENT

```bash
curl --location '{{base_url}}/authorization/login' \
--header 'Content-Type: application/json' \
--data '{
    "email": "test-web@example.com",
    "password": "password123",
    "loginContext": "MOBILE_CLIENT"
}'
```

## 9. Verify Email Code (to complete registration)

```bash
curl --location '{{base_url}}/authorization/verify-code' \
--header 'Content-Type: application/json' \
--data '{
    "email": "test-web@example.com",
    "code": "123456"
}'
```

## 10. Resend Verification Email

```bash
curl --location '{{base_url}}/authorization/resend-verification' \
--header 'Content-Type: application/json' \
--data '{
    "email": "test-web@example.com"
}'
```

## 11. Check Verification Status

```bash
curl --location '{{base_url}}/authorization/verification-status/test-web@example.com' \
--header 'Content-Type: application/json'
```

## 12. OAuth Google Registration (WEB_MERCHANT)

```bash
curl --location '{{base_url}}/authorization/login/google?registrationSource=WEB_MERCHANT&redirect=dashboard' \
--header 'Content-Type: application/json'
```

## 13. OAuth Facebook Registration (MOBILE_CLIENT)

```bash
curl --location '{{base_url}}/authorization/login/facebook?registrationSource=MOBILE_CLIENT&redirect=profile' \
--header 'Content-Type: application/json'
```

## 14. Test Duplicate Email Registration

```bash
curl --location '{{base_url}}/authorization/signup' \
--header 'Content-Type: application/json' \
--data '{
    "email": "test-web@example.com",
    "password": "password123",
    "name": "Duplicate User",
    "registrationSource": "MOBILE_CLIENT"
}'
```

## 15. Test Wrong Password Login

```bash
curl --location '{{base_url}}/authorization/login' \
--header 'Content-Type: application/json' \
--data '{
    "email": "test-web@example.com",
    "password": "wrongpassword",
    "loginContext": "WEB_MERCHANT"
}'
```

## 16. Test Non-existent User Login

```bash
curl --location '{{base_url}}/authorization/login' \
--header 'Content-Type: application/json' \
--data '{
    "email": "nonexistent@example.com",
    "password": "password123",
    "loginContext": "WEB_MERCHANT"
}'
```

---

## Expected Responses:

### Registration Success:

```json
{
  "message": "Signup successful"
}
```

### Registration - Account Exists:

```json
{
  "status": 409,
  "message": "Account with this email already exists. Please login instead."
}
```

### User Check - Exists:

```json
{
  "exists": true,
  "user": {
    "role": "NEW_USER",
    "registrationSource": "WEB_MERCHANT",
    "emailVerified": false
  }
}
```

### Login - Requires Action:

```json
{
  "requiresAction": true,
  "action": "COMPLETE_COMPANY_DATA",
  "message": "COMPLETE_COMPANY_REGISTRATION",
  "user": {
    "email": "test-web@example.com",
    "role": "NEW_USER",
    "registrationSource": "WEB_MERCHANT"
  }
}
```

### Login - Success:

```json
{
  "token": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "type": "Bearer"
  },
  "user": {
    "email": "test@example.com",
    "roles": ["CLIENT"],
    "name": "Test User",
    "registrationSource": "MOBILE_CLIENT"
  }
}
```

### Login - First Mobile Login (OWNER → Mobile):

```json
{
  "token": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "type": "Bearer"
  },
  "user": {
    "email": "owner@example.com",
    "roles": ["OWNER", "CLIENT"],
    "name": "Owner User",
    "firstName": "Owner"
  },
  "firstMobileLogin": true,
  "welcomeMessage": "Witamy w aplikacji klienckiej, Owner! 🎉"
}
```

### Login - Missing Context:

```json
{
  "status": 400,
  "message": "Login context is required (WEB_MERCHANT or MOBILE_CLIENT)"
}
```

---

## Test Sequence:

1. **Register users** with different sources (tests 1-2)
2. **Check user existence** (test 3)
3. **Test duplicate registration** (test 13) - should return "login required"
4. **Test login scenarios** without email verification (tests 4-7) - should require email verification
5. **Verify emails** (tests 8-10)
6. **Test login scenarios** after verification (repeat tests 4-7) - should show company forms or succeed
7. **Test OAuth flows** (tests 11-12)
8. **Test error cases** (tests 14-15)

## Corrected Flow:

- **Registration**: Only creates account or says "login required"
- **Login**: Handles all role logic and form requirements
- **Email verification**: Always required first for local accounts
