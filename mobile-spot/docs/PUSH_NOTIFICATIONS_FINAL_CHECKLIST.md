# Push Notifications - Final Checklist ✅

## Status: Gotowe do testowania! 🎉

### ✅ Co zostało zrobione

#### 1. Package Name Update
- [x] Zaktualizowano package name na `com.bonapka.app` w:
  - `app.json` (iOS bundleIdentifier i Android package)
  - `android/app/build.gradle` (namespace i applicationId)
  - Pliki Kotlin (MainActivity.kt, MainApplication.kt)
  - Struktura katalogów: `android/app/src/main/java/com/bonapka/app/`

#### 2. Firebase Configuration
- [x] `android/app/google-services.json` - ✅ Dodany z package name: `com.bonapka.app`
- [x] `ios/GoogleService-Info.plist` - ✅ Dodany z bundle ID: `com.bonapka.app`
- [x] Firebase credentials w `.env` - ✅ Skonfigurowane

#### 3. Push Notifications Implementation
- [x] `NotificationService` - Singleton zarządzający notyfikacjami
- [x] `useNotificationRegistration` - Hook rejestrujący urządzenie
- [x] `useNotificationInitialization` - Inicjalizacja przy starcie
- [x] `useNotifications` - Hook dla ekranu onboardingu
- [x] GraphQL mutations i queries
- [x] Integracja w `app/_layout.tsx`
- [x] Tłumaczenia PL/EN

#### 4. Dokumentacja
- [x] `PUSH_NOTIFICATIONS_README.md` - Główne podsumowanie
- [x] `PUSH_NOTIFICATIONS_SETUP.md` - Pełna dokumentacja techniczna
- [x] `PUSH_NOTIFICATIONS_QUICKSTART.md` - Quick start guide
- [x] `PUSH_NOTIFICATIONS_IMPLEMENTATION.md` - Szczegóły implementacji
- [x] `PACKAGE_NAME_UPDATE.md` - Dokumentacja zmiany package name
- [x] `PUSH_NOTIFICATIONS_FINAL_CHECKLIST.md` - Ten plik

## 🚀 Następne kroki (do wykonania przez Ciebie)

### 1. Wyczyść build cache
```bash
# Android
cd android
./gradlew clean
cd ..

# iOS (jeśli używasz)
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..

# Expo
rm -rf .expo
```

### 2. Zrób rebuild aplikacji
```bash
# Android
npm run android

# iOS (jeśli używasz)
npm run ios
```

**WAŻNE:** Push notyfikacje **NIE DZIAŁAJĄ** w Expo Go! Musisz zbudować aplikację natywnie.

### 3. Testowanie

#### Krok 1: Sprawdź rejestrację
1. Zaloguj się do aplikacji
2. Otwórz logi konsoli
3. Poszukaj: `"Push notifications registered successfully"`

#### Krok 2: Sprawdź token w bazie danych
Sprawdź w bazie danych czy token został zapisany:
```sql
SELECT * FROM device_tokens WHERE user_id = [twoje_user_id];
```

Powinien być:
- `fcm_token` - Expo Push Token
- `platform` - "ios" lub "android"
- `device_id` - ID urządzenia
- `device_name` - Nazwa urządzenia

#### Krok 3: Testuj wysyłanie notyfikacji
1. Wykonaj akcję na backendzie (np. dodaj pieczątkę przez admin panel)
2. Sprawdź logi backendu (BullMQ queue)
3. Sprawdź czy notyfikacja przyszła na urządzenie

#### Krok 4: Testuj różne scenariusze
- [ ] App w foreground - notyfikacja powinna się wyświetlić
- [ ] App w background - notyfikacja powinna się wyświetlić
- [ ] App zamknięty - notyfikacja powinna się wyświetlić
- [ ] Kliknięcie w notyfikację - app powinien się otworzyć

## 🐛 Troubleshooting

### Problem: Token nie jest generowany
**Rozwiązanie:**
1. Sprawdź czy `expo-notifications` i `expo-device` są zainstalowane
2. Sprawdź czy EAS projectId jest w `app.json` (✅ jest: `5c499f13-b9f0-48dc-9888-daf664d07485`)
3. Zrób rebuild: `npm run android` lub `npm run ios`
4. Sprawdź czy użytkownik zaakceptował uprawnienia

### Problem: "Push notifications only work on physical devices"
**Rozwiązanie:**
To normalne - użyj fizycznego urządzenia do testowania.

### Problem: Notyfikacje nie przychodzą
**Rozwiązanie:**
1. Sprawdź logi backendu (BullMQ queue)
2. Sprawdź czy token jest w bazie danych
3. Sprawdź czy Firebase credentials są poprawne na backendzie:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
4. Sprawdź czy Redis działa (dla BullMQ)
5. Sprawdź połączenie z internetem

### Problem: Build error na Android
**Rozwiązanie:**
```bash
cd android
./gradlew clean
cd ..
rm -rf android/app/build
npm run android
```

### Problem: Build error na iOS
**Rozwiązanie:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
rm -rf ios/build
npm run ios
```

## 📊 Weryfikacja końcowa

### Sprawdź package name:
```bash
# Powinno zwrócić: com.bonapka.app
grep "package" app.json | grep android -A 1
grep "bundleIdentifier" app.json
grep "package_name" android/app/google-services.json
grep "BUNDLE_ID" ios/GoogleService-Info.plist
```

### Sprawdź strukturę plików:
```bash
# Powinny istnieć:
ls -la android/app/google-services.json
ls -la ios/GoogleService-Info.plist
ls -la android/app/src/main/java/com/bonapka/app/MainActivity.kt
ls -la android/app/src/main/java/com/bonapka/app/MainApplication.kt
ls -la services/notificationService.ts
ls -la hooks/useNotificationRegistration.ts
```

### Sprawdź czy nie ma starych plików:
```bash
# Nie powinny istnieć:
ls -la android/app/src/main/java/com/konradhopek/ 2>/dev/null && echo "❌ Stare pliki istnieją!" || echo "✅ Stare pliki usunięte"
```

## 📚 Dokumentacja

Pełna dokumentacja znajduje się w:
- `docs/PUSH_NOTIFICATIONS_README.md` - **START TUTAJ**
- `docs/PUSH_NOTIFICATIONS_QUICKSTART.md` - Szybki start
- `docs/PUSH_NOTIFICATIONS_SETUP.md` - Szczegółowa konfiguracja
- `docs/PUSH_NOTIFICATIONS_IMPLEMENTATION.md` - Szczegóły implementacji
- `docs/PACKAGE_NAME_UPDATE.md` - Zmiana package name

## 🎯 Podsumowanie

### Co działa automatycznie:
✅ Rejestracja urządzenia przy starcie (jeśli zalogowany)  
✅ Requestowanie uprawnień do notyfikacji  
✅ Pobieranie i wysyłanie Expo Push Token  
✅ Odbieranie notyfikacji z backendu  
✅ Wyświetlanie notyfikacji (foreground i background)  
✅ Obsługa kliknięcia w notyfikację  

### Backend automatycznie wysyła notyfikacje przy:
- Dodaniu pieczątki (`STAMP_ADDED`)
- Ukończeniu karty pieczątek (`STAMP_CARD_COMPLETED`)
- Otrzymaniu punktów (`POINTS_EARNED`)
- Wydaniu punktów (`POINTS_SPENT`)
- Nowym kuponie (`NEW_COUPON_AVAILABLE`)
- Wygasającym kuponie (`COUPON_EXPIRING`)
- Gotowym zamówieniu (`ORDER_READY`)
- Zrealizowanym referralu (`REFERRAL_COMPLETED`)

## ✨ Gotowe!

Wszystko jest skonfigurowane i gotowe do testowania. Wystarczy:
1. Wyczyścić cache
2. Zbudować aplikację natywnie
3. Przetestować na fizycznym urządzeniu

Powodzenia! 🚀
