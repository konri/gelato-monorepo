# Lottie scenes (onboarding)

`scan.json`, `rewards.json` and `couriers.json` are **generated** files, copied
byte-for-byte from `landing-page-new/public/lottie/`. Do not edit them by hand.

They are built by `landing-page-new/scripts/lottie` from the scene modules in
`landing-page-new/scripts/lottie/scenes/<name>.mjs` (shape layers only, no
images; each scene has a `poster` marker, used here for Reduce Motion and as
the resting frame of off-screen slides).

To regenerate:

```sh
cd landing-page-new
npm run lottie:build -- scan rewards couriers   # writes public/lottie/*.json
npm run lottie:render -- scan rewards couriers  # optional: PNG contact sheet
cp public/lottie/{scan,rewards,couriers}.json ../mobile/assets/lottie/
```

Used by `components/onboarding/OnboardingLottie.tsx` (via `app/onboarding`).
