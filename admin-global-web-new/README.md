# Loodly Admin Global Web

Brand console (Vite + React + TypeScript): the Loodly team (SUPER_ADMIN) manages
brands, plans and the platform; brand admins set up their brand, spots, rewards,
promotions and staff. Spot admins and employees use the Loodly Spot app.

## Run
```bash
npm install
npm run dev
```

## Environment
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | GraphQL endpoint (REST routes live on the same origin). Default `http://localhost:4000/graphql` |
| `VITE_APP_VERSION` | Version in the `x-loodly-client: admin-web@<version>` header (default: `package.json` version) |
| `VITE_SPOT_APP_URL` | Link behind "Open Loodly Spot" (setup checklist, activation, staff screen). Default `https://spot.loodly.pl` |
| `VITE_GOOGLE_MAPS_API_KEY` | Address and city suggestions (optional) |

## Checks
```bash
npm run build                      # tsc -b + vite build
npm run lint
npm run check:graphql              # every document vs ../loodly-be/schema.gql
npm run check:graphql -- <path/to/schema.gql>
```
`pl.ts` and `ua.ts` are typed against `en.ts` (`translations/resources/types.ts`),
so a missing or extra key fails the type check.
