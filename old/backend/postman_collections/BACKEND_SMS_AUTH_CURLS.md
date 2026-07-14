# Backend SMS Phone Auth - cURL Commands for Postman

## 1. Send SMS Verification Code

# Send SMS Code - Valid Phone Number

curl --location '{{base_url}}/authorization/phone/send-code' \
--header 'Content-Type: application/json' \
--data '{
"phoneNumber": "+48123456789"
}'

# Send SMS Code - Missing Phone Number (Error)

curl --location '{{base_url}}/authorization/phone/send-code' \
--header 'Content-Type: application/json' \
--data '{}'

# Send SMS Code - Invalid Format (Error)

curl --location '{{base_url}}/authorization/phone/send-code' \
--header 'Content-Type: application/json' \
--data '{
"phoneNumber": "123456789"
}'

## 2. Verify SMS Code and Login/Register

# Verify SMS Code - Valid Code (New User)

curl --location '{{base_url}}/authorization/phone/verify-code' \
--header 'Content-Type: application/json' \
--data '{
"phoneNumber": "+48123456789",
"code": "123456"
}'

# Verify SMS Code - Valid Code (Existing User)

curl --location '{{base_url}}/authorization/phone/verify-code' \
--header 'Content-Type: application/json' \
--data '{
"phoneNumber": "+48987654321",
"code": "654321"
}'

# Verify SMS Code - Invalid Code (Error)

curl --location '{{base_url}}/authorization/phone/verify-code' \
--header 'Content-Type: application/json' \
--data '{
"phoneNumber": "+48123456789",
"code": "000000"
}'

# Verify SMS Code - Missing Fields (Error)

curl --location '{{base_url}}/authorization/phone/verify-code' \
--header 'Content-Type: application/json' \
--data '{
"phoneNumber": "+48123456789"
}'

## 3. Test Complete Flow

# Step 1: Send code

curl --location '{{base_url}}/authorization/phone/send-code' \
--header 'Content-Type: application/json' \
--data '{
"phoneNumber": "+48111222333"
}'

# Step 2: Check backend console for code (Development mode)

# Look for: 📱 SMS Code for +48111222333: 123456

# Step 3: Verify code (use code from console)

curl --location '{{base_url}}/authorization/phone/verify-code' \
--header 'Content-Type: application/json' \
--data '{
"phoneNumber": "+48111222333",
"code": "123456"
}'

## 4. Rate Limiting Test

# Send first code

curl --location '{{base_url}}/authorization/phone/send-code' \
--header 'Content-Type: application/json' \
--data '{
"phoneNumber": "+48555666777"
}'

# Try to send second code immediately (should fail with rate limit)

curl --location '{{base_url}}/authorization/phone/send-code' \
--header 'Content-Type: application/json' \
--data '{
"phoneNumber": "+48555666777"
}'

## 5. Expired Code Test

# Send code

curl --location '{{base_url}}/authorization/phone/send-code' \
--header 'Content-Type: application/json' \
--data '{
"phoneNumber": "+48888999000"
}'

# Wait 5+ minutes, then try to verify (should fail with expired message)

curl --location '{{base_url}}/authorization/phone/verify-code' \
--header 'Content-Type: application/json' \
--data '{
"phoneNumber": "+48888999000",
"code": "123456"
}'

## Expected Responses

### Send Code - Success (200)

{
"success": true,
"message": "Verification code sent successfully"
}

### Send Code - Rate Limited (400)

{
"success": false,
"message": "Please wait 240 seconds before requesting a new code"
}

### Verify Code - Success New User (200)

{
"success": true,
"isNewUser": true,
"token": {
"access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"type": "Bearer"
},
"user": {
"id": "uuid",
"phone": "+48123456789",
"name": "+48123456789",
"firstName": "",
"surname": "",
"roles": ["CLIENT"],
"profileType": "phone",
"registrationSource": "MOBILE_CLIENT"
}
}

### Verify Code - Success Existing User (200)

{
"success": true,
"isNewUser": false,
"token": {
"access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"type": "Bearer"
},
"user": {
"id": "uuid",
"phone": "+48123456789",
"name": "John Doe",
"firstName": "John",
"surname": "Doe",
"roles": ["CLIENT"],
"profileType": "phone",
"registrationSource": "MOBILE_CLIENT"
}
}

### Verify Code - Invalid (400)

{
"success": false,
"error": "Invalid verification code",
"message": "Invalid verification code"
}

### Verify Code - Expired (400)

{
"success": false,
"message": "Verification code expired. Please request a new code."
}

## Testing Notes

1. **Development Mode**: Kody są logowane w konsoli backendu

   - Sprawdź logi: `📱 SMS Code for +48123456789: 123456`
   - Użyj tego kodu w `/verify-code`

2. **Rate Limiting**:

   - Max 1 SMS na 4 minuty dla tego samego numeru
   - Jeśli zostało więcej niż 4 minuty, można wysłać nowy kod

3. **Code Expiration**:

   - Kod ważny przez 5 minut
   - Po weryfikacji kod jest automatycznie usuwany

4. **Phone Number Format**:

   - Musi zaczynać się od `+` (country code)
   - Przykład: `+48123456789` (Poland)
   - Przykład: `+1234567890` (USA)

5. **Auto Registration**:
   - Jeśli numer nie istnieje → tworzy nowego użytkownika
   - Jeśli numer istnieje → loguje użytkownika
   - Zwraca `isNewUser: true/false`
