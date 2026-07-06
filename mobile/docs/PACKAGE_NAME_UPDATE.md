# Package Name Update - com.bonapka.app

## ✅ Zmiany wykonane

Package name został zaktualizowany z `com.konradhopek.bonapka` na `com.bonapka.app` we wszystkich wymaganych miejscach.

### 1. Konfiguracja Expo (`app.json`)
```json
{
  "ios": {
    "bundleIdentifier": "com.bonapka.app"
  },
  "android": {
    "package": "com.bonapka.app"
  }
}
```

### 2. Android Build Configuration (`android/app/build.gradle`)
```gradle
namespace 'com.bonapka.app'
defaultConfig {
    applicationId 'com.bonapka.app'
}
```

### 3. Kotlin Source Files
Pliki przeniesione i zaktualizowane:
- `android/app/src/main/java/com/bonapka/app/MainActivity.kt`
- `android/app/src/main/java/com/bonapka/app/MainApplication.kt`

Package declaration w plikach:
```kotlin
package com.bonapka.app
```

### 4. Firebase Configuration Files

#### Android (`android/app/google-services.json`)
```json
{
  "client_info": {
    "android_client_info": {
      "package_name": "com.bonapka.app"
    }
  }
}
```
✅ Plik już zawiera poprawny package name

#### iOS (`ios/GoogleService-Info.plist`)
```xml
<key>BUNDLE_ID</key>
<string>com.bonapka.app</string>
```
✅ Plik już zawiera poprawny bundle ID

## 📋 Weryfikacja

### Sprawdź package name w plikach:
```bash
# Android
grep -r "com.bonapka.app" android/app/build.gradle
grep "package_name" android/app/google-services.json

# iOS
grep "BUNDLE_ID" ios/GoogleService-Info.plist
grep "bundleIdentifier" app.json

# Kotlin files
grep "package com.bonapka.app" android/app/src/main/java/com/bonapka/app/*.kt
```

### Sprawdź strukturę katalogów:
```bash
ls -la android/app/src/main/java/com/bonapka/app/
# Powinny być:
# - MainActivity.kt
# - MainApplication.kt
```

## 🚀 Następne kroki

### 1. Wyczyść build cache
```bash
# Android
cd android
./gradlew clean
cd ..

# iOS
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### 2. Usuń stare buildy
```bash
rm -rf android/app/build
rm -rf ios/build
rm -rf .expo
```

### 3. Zrób rebuild aplikacji
```bash
# Android
npm run android

# iOS
npm run ios
```

### 4. Testowanie push notyfikacji
Po zbudowaniu aplikacji:
1. Zaloguj się do aplikacji
2. Sprawdź logi: `"Push notifications registered successfully"`
3. Sprawdź w bazie danych czy token został zapisany z nowym package name
4. Wykonaj akcję na backendzie (np. dodaj pieczątkę)
5. Sprawdź czy notyfikacja przyszła

## ⚠️ Ważne uwagi

### Dla istniejących użytkowników
Jeśli aplikacja była już zainstalowana na urządzeniach z starym package name:
- **Android**: Użytkownicy będą musieli odinstalować starą wersję i zainstalować nową
- **iOS**: Użytkownicy będą musieli odinstalować starą wersję i zainstalować nową
- Stare tokeny FCM z poprzednim package name nie będą działać

### Dla Firebase
- Upewnij się, że w Firebase Console są zarejestrowane aplikacje z nowym package name:
  - Android: `com.bonapka.app`
  - iOS: `com.bonapka.app`
- Jeśli nie ma, dodaj nowe aplikacje w Firebase Console

### Dla Google Play / App Store
Jeśli aplikacja jest już opublikowana:
- **Google Play**: Nie można zmienić package name dla istniejącej aplikacji. Trzeba utworzyć nową aplikację.
- **App Store**: Nie można zmienić bundle ID dla istniejącej aplikacji. Trzeba utworzyć nową aplikację.

## 📝 Checklist

- [x] Zaktualizowano `app.json`
- [x] Zaktualizowano `android/app/build.gradle`
- [x] Przeniesiono i zaktualizowano pliki Kotlin
- [x] Zweryfikowano `google-services.json`
- [x] Zweryfikowano `GoogleService-Info.plist`
- [ ] Wyczyszczono build cache
- [ ] Zrobiono rebuild aplikacji
- [ ] Przetestowano push notyfikacje

## ✅ Status

**Package name został pomyślnie zaktualizowany na `com.bonapka.app`**

Wszystkie pliki konfiguracyjne i source code są zsynchronizowane z nowym package name.
