# Project instructions

- For Silver.Vy feature inventories and technical descriptions, use the current `SilverVy/silvervy-shop` GitHub `main` branch as the source of truth; the Replit checkout may be at a different commit.
- Verify behavior in repository code instead of inferring it from common patterns. Distinguish code-backed features from README-only claims, and label partial or broken flows accurately.

## Educational catalog and fit prototype

- This is a diploma project. Conditional catalog compositions and dimensions are permitted, but must be identified as designed educational data, never empirical measurements.
- `npm run dev` explicitly starts catalog-only mode on port 5000. The catalog and size comparison work without a database; accounts, orders and image generation return an explicit unavailable response. This mode does not bypass authentication.
- `npm start` preserves the full PostgreSQL/JWT application. Configure its existing DB_NAME, DB_USER, DB_PASSWORD, DB_HOST and JWT_SECRET through Secrets before using it. Do not substitute a different database automatically. IDM_VTON_SPACE_URL and HF_TOKEN are optional provider configuration.
- `npm test` runs deterministic engine and public API tests. `npm run test:browser` runs browser smoke tests against the running preview, using the installed Chromium.
- `npm run test:photo` checks photo-preview consent, login, failures and stale-result handling with intercepted test responses; it is not live inference or live-auth verification.
- The user will update the existing Render deployment later. Do not require a Replit database or publish automatically. `docs/render-readiness.md` documents launch modes and compatibility with the original split frontend/backend.
- See `docs/fit-methodology.md` for exact formulas, assumptions and a proposed physical validation protocol. Passing software tests is not evidence of physical fitting accuracy.
- Main product references are AI-generated isolated front views. Model views are secondary illustrations, not validation data. Keep raw generated images and test output out of Git; optimized catalog images and their provenance are retained.