# MOSAIC deployment checklist

This is a Qloo-dependent agent. The official challenge requires an externally reachable, fully published demo. A local app or a demo without working Qloo API access does not qualify.

## Preferred deployment (Render)
1. Publish this source as a public open-source GitHub repository under Abdullah-m7. Verify the MIT license appears in the GitHub About section.
2. In Render, create a Node web service from the repo or import render.yaml as a Blueprint. The Node runtime installs npm dependencies and runs npm start.
3. Set server environment secrets: QLOO_MODE=live and QLOO_API_KEY with the **event-issued** key only. The key must be supplied through Render's protected secret input, never in files, docs or Git history.
4. Use the Qloo **hackathon** endpoint, https://hackathon.api.qloo.com. The event credential will fail against production and staging endpoints. Validate the official CLI's effective base URL; do not assume it is correct.
5. Exercise at least three real end-to-end scenarios (different public cultural anchor pairs, location refinements, and reject/undo). If ranking schema or Qloo service differs, fail closed until corrected.
6. Validate that visiting /health does not expose credentials; inspect deployed logs and frontend network traffic for secret leakage.
7. Check mobile responsiveness and test unauthenticated demo access. Confirm direct browser access with a fresh session, without account login.
8. Keep service available throughout the judging period, until November 16, 2026. Free-tier sleep/cold starts may undermine judges' access, so verify uptime and consider upgrading only with explicit budget approval.
9. A false successful-looking synthetic fallback is forbidden in live mode. Disable or remove sample demos from the final judge-submission URL.

## Local verification
- npm ci
- npm test
- npm run benchmark (synthetic algorithm checking only)
- PORT=8788 QLOO_MODE=sample npm start (local dry run)
- PORT=8788 QLOO_MODE=live npm start (requires protected event key)

## Notes
- The public-facing app never needs a paid LLM or proxy token.
- Qloo aggregate taste data are not personal profiling or calibrated likelihood.
- Live planner does not claim venue prices, availability, ticketing, or permissions for screenings or performances.
- Qloo discovery is cached by audience profile, so budget changes and vetoes avoid repeating paid API calls.

## Current public preview
https://abdullah-m7.github.io/qloo-mosaic/ is a verified offline synthetic demo served by GitHub Pages, not the Node API-backed app. It cannot host Qloo secrets and must not be submitted as the final live Qloo application.
