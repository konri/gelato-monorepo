# Configuration Files

This directory contains sensitive configuration files that should NOT be committed to version control.

## Firebase Service Account

To enable push notifications, you need to add your Firebase service account credentials:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Save the downloaded JSON file as `firebase-service-account.json` in this directory

The file should look like `firebase-service-account.example.json` but with real credentials.

## .gitignore

Make sure `config/firebase-service-account.json` is in your `.gitignore`:

```
config/firebase-service-account.json
config/*.json
!config/*.example.json
```

## Security

Never commit these files to version control. If accidentally committed:
1. Rotate the credentials immediately in Firebase Console
2. Remove from git history: `git filter-branch` or BFG Repo-Cleaner
3. Update `.gitignore` to prevent future accidents
