# MOSAIC — Common Ground, by Design

**Interactive public preview (SYNTHETIC ONLY):** https://abdullah-m7.github.io/qloo-mosaic/


**An evidence-aware cultural negotiation agent for the Qloo Agentic Hackathon 2026.**

> Most recommendation engines optimize for the average. MOSAIC designs for the people the average overlooks.

MOSAIC helps organizers conceptually design one cultural experience for **two taste communities** rather than only the majority: music + a place + a movie/experience. It is not a ticketing, pricing, availability, identity, or demographic-profiling application.

## The product idea

An organizer supplies two groups' **public cultural anchors**, a rough planning budget, and vetoes. The agent:

1. **Discovers** cultural candidates using Qloo recommendations grounded in combined tastes.
2. **Ranks** the identical candidate set twice, once against each audience profile.
3. **Normalizes ordinal ranks separately** into relative [0,1] proxy utilities. Qloo warns that scores from separate rank calls are not directly comparable; MOSAIC never combines raw scores.
4. **Negotiates** the 3-piece event concept, maximizing the **minimum** group proxy score. The mean breaks ties, and budget is a hard constraint. The interface compares a one-sided Group A-first baseline and a maximum-average baseline, both globally optimized under identical constraints.
5. **Explains and replans** when the user rejects an option or adjusts the budget. Every candidate requires source metadata; incomplete evidence causes abstention.

This is a research prototype. The rank-percentile proxies do **not** predict attendance, individual preferences, real satisfaction, or a causal outcome. Costs are illustrative planning tokens and not quotes or operational budgets.

## Quick start (sample mode)

Requires Node.js >=22:

```bash
npm install
QLOO_MODE=sample npm start
# Open http://localhost:8788
npm test
```

**CRITICAL: Sample mode shows SYNTHETIC test values. It does not contact Qloo.** This mode illustrates the planner's logic, not actual cultural fit. The product page labels this prominently.

## Public static preview (not the contest's live demo)

To illustrate the interaction without a Qloo credential, build a client-side-only preview:

    npm run build:preview

The generator uses the same engine and fixture source but replaces server calls with a local, synthetic-only adapter. Its HTML clearly labels fictional affinity values, and it never attempts to contact Qloo. This is NOT the API-driven demo required for the final Qloo Devpost entry.

The static preview is published and publicly verified at https://abdullah-m7.github.io/qloo-mosaic/ from an independent gh-pages branch. The Node application remains on main; no Qloo secret is ever embedded in GitHub Pages.

## Live Qloo mode (requires separate event credential)

The project uses the official `@qloo/qloo-harness` and `@modelcontextprotocol/sdk`. Obtain a key using the form linked from the [official hackathon resources](https://qloo.devpost.com/resources). Use `npx qloo setup --qloo` locally, or set `QLOO_API_KEY` securely in your server environment. Never commit or display the credential.

```bash
QLOO_MODE=live npm start
```

In live mode, the organizer can configure up to five public taste anchors per audience and a public location. Synthetic preview mode locks these fields, so it cannot pretend that fabricated scores respond to custom taste inputs.\n\nThe app pins the Qloo hackathon API base URL for its MCP subprocess (the upstream harness otherwise defaults to the production endpoint). The server caches small Qloo candidate sets per public audience/location context, allowing repeated budget and veto replans without repeatedly calling Qloo.\n\nThe backend calls `qloo_capabilities`, then `qloo_recommend` and `qloo_rank` through the read-only MCP transport. Missing credentials, partial ranks, ambiguity, or Qloo errors **fail closed**; no synthetic output is silently substituted. **Real API integration is not yet validated** because an event credential has not been supplied. Qloo result-schema adaptation may still be required after first live request.

Deployment requirement: The hackathon needs an **externally hosted demo**, accessible to judges until November 16, 2026. Running localhost is insufficient. Host the Node service on a managed VM/container; attach the event credential only as a protected server-side secret. Do not deploy in sample mode and claim a fully Qloo-powered submission.

## Repo map

- `src/engine.mjs` — budget-constrained maximin optimizer, baselines, evidence gates, replanning
- `src/fixtures.mjs` — synthetic scenario, **not Qloo data**
- `src/qloo.mjs` — Qloo MCP tool caller, rank-normalization logic; unvalidated with live key
- `server.mjs` — web server with server-only Qloo access and failure handling
- `public/` — responsive product prototype and interactive controls
- `tests/` — unit/contract tests, including missing evidence and cross-call rank comparability
- `docs/STATUS.md` — tested vs pending state
- `docs/DECISIONS.md` — technical and ethical design rationale

## Results and limitations

34 automated unit, adversarial and HTTP integration tests passed (run npm test). Chrome desktop and narrow-screen mobile smoke checks passed for budgeting, repeated vetoes, undo, and baseline comparisons.

500 seeded **synthetic** scenarios can be recreated with npm run benchmark. Of these 500, 429 had feasible plans. Maximin maintained a worst-off-group proxy at least as high as both comparison policies in 429/429 feasible scenarios, improving on Group A-first by 0.132 on average and the max-mean alternative by 0.024. Mean preference relative to max-mean changed by -0.014 on average.

**Critical limitation:** The above behavior primarily follows from the programmed objectives. Synthetic scores and costs are invented for algorithm verification, not evidence of Qloo quality, audience preferences or actual product impact. Real Qloo testing has not occurred, since the event key has not arrived.

Key request form receipt: confirmed October 12, 2026. Event API URL: https://hackathon.api.qloo.com (not the production Qloo API URL).

## Open source

Public repository: https://github.com/Abdullah-m7/qloo-mosaic

GitHub Actions verification template: docs/examples/github-actions-ci.template.yml (not activated).

MIT licensed original code. A GitHub Actions template is provided under docs/examples and can run checks without a Qloo secret. Automatic CI is not yet activated because the current GitHub OAuth grant lacks workflow modification permission. This project is isolated from all other research and competition programs.

**Submission status:** local demo and public repository are ready; the publicly hosted live demo and real Qloo API validation are still pending the organizer-issued API key.

## Official competition

[Qloo Agentic Hackathon](https://qloo.devpost.com/) | Deadline: Oct 30, 2026 at 11:45pm EDT.
