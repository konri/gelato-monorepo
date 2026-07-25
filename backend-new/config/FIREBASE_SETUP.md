# Firebase setup — one project, three apps, one backend

Gelato has three mobile apps (client, courier, spot). They all share **one
Firebase project** and **one backend service account**. You do **not** create a
project per app.

- A Firebase **project** is a container that holds many apps + one FCM backend.
- Inside it you register **one app per (platform × bundle id)** — up to 6:

| App             | iOS bundle id                     | Android package                   |
| --------------- | --------------------------------- | --------------------------------- |
| Client (mobile) | `com.konradhopek.gelato.client`   | `com.konradhopek.gelato.client`   |
| Courier         | `com.konradhopek.gelato.courier`  | `com.konradhopek.gelato.courier`  |
| Spot            | `com.konradhopek.gelato.spot`     | `com.konradhopek.gelato.spot`     |

- The backend uses **one service-account key**. It can message all three apps
  because each device token already encodes which app/project it belongs to.
  (Push is real FCM via the Firebase Admin SDK — the apps register their native
  device token with `Notifications.getDevicePushTokenAsync()`.)

## A. Create the project & register the apps (Firebase Console)

1. https://console.firebase.google.com → **Add project** (e.g. `gelato-app`).
   Note the **Project ID** shown under Project settings → General.
2. For **each row** in the table above, register the app:
   - **Android:** Add app → Android → enter the exact `package` → download
     **`google-services.json`**.
   - **iOS:** Add app → Apple → enter the exact `bundleIdentifier` → download
     **`GoogleService-Info.plist`**.
   Repeat until all three apps have BOTH an iOS and an Android registration.
3. **iOS push also needs an APNs key** (once per project, covers all iOS apps):
   Project settings → **Cloud Messaging** → Apple app configuration → upload your
   **APNs Authentication Key** (.p8) from the Apple Developer portal (Keys →
   create a key with "Apple Push Notifications service (APNs)" enabled). Without
   this, iOS push silently never arrives.

## B. Drop the config files into each app (overwrite the existing ones)

Each `app.json` already points at these filenames via `googleServicesFile`, so
just replace the files — **do not** copy one app's file into another (the
current spot files are wrong; they hold the courier's config).

| App folder        | files to place                                             |
| ----------------- | ---------------------------------------------------------- |
| `mobile/`         | `google-services.json` + `GoogleService-Info.plist`        |
| `mobile-courier/` | `google-services.json` + `GoogleService-Info.plist`        |
| `mobile-spot/`    | `google-services.json` + `GoogleService-Info.plist`        |

Then rebuild the native apps (config plugins bake these in at prebuild):
`npx expo prebuild --clean` then a dev/EAS build. (A JS-only reload is not
enough — the native Firebase config changes.)

> These 6 files are currently committed to git but also match `.gitignore`
> patterns. See "Git note" below.

## C. Backend service account (one key, all apps)

1. Firebase Console → Project settings → **Service accounts** →
   **Generate new private key** → download the JSON.
2. Save it as `backend-new/config/firebase-service-account.json`
   (this exact path; it's gitignored).
3. Set the project id in `backend-new/.env`:
   `FIREBASE_PROJECT_ID=<your real project id from step A.1>`
4. Restart the backend. You should see `✅ Firebase Cloud Messaging initialized`
   instead of the "not configured" warning.

Hosted deploys (no file): instead of the JSON file, set `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` (keep the literal `\n`
escapes — the code restores them). See `.env.example`.

## Verify push end-to-end

1. Backend logs `✅ Firebase Cloud Messaging initialized`.
2. Run an app on a **physical device** (push doesn't work on simulators),
   log in → it calls `registerDevice` and stores a row in `DeviceToken`.
3. Trigger an event (place an order, assign a courier) → the device gets a push.

## Git note

`mobile*/google-services.json` and `GoogleService-Info.plist` are tracked in git
(committed before the ignore rule was added). They contain client identifiers,
not secrets, so this is low-risk, but to stop tracking them:

```
git rm --cached mobile/google-services.json mobile/GoogleService-Info.plist \
  mobile-courier/google-services.json mobile-courier/GoogleService-Info.plist \
  mobile-spot/google-services.json mobile-spot/GoogleService-Info.plist
```

The backend `config/firebase-service-account.json` is a **real secret** and is
already gitignored — never commit it.
