# MOSAIC checkpoint — Qloo Agentic Hackathon 2026

## Completed
- Fresh independent repository on the user's Mac: /Users/3obd/Developer/qloo-mosaic.
- Responsive demo UI tested with desktop and 390px mobile Chrome.
- Repeated reject/undo, planning budget changes and dual baseline comparisons.
- Evidence-gated global maximin solver with budget constraints.
- 34/34 automated unit, adversarial and HTTP integration tests passing.
- 500 deterministic-seed synthetic scenarios: 429 feasible, 71 infeasible; maximin objective at least as high as both baselines in 429/429 feasible cases (expected by construction).
- Server Qloo mode without credentials fails closed; no fabricated Qloo result is substituted.
- Qloo's official harness and MCP SDK installed.\n- Public taste anchors and geographic input in live mode, validated against personal contact data.

## Open requirements
- Official screenshot-confirmed API key request accepted; **key has not arrived yet**. Qloo says a few business days.
- Verify event key works against https://hackathon.api.qloo.com and live Qloo tool response schemas.
- Turn fixed taste anchors into live user-selectable public cultural anchors.
- The public repository is now published at https://github.com/Abdullah-m7/qloo-mosaic (MIT license detected); externally hosted demo is still required.
- Validate Qloo-based results and compare with baselines; document honest failure cases.
- Prepare English Devpost story and final review; NO submission has been made.

## Caveats
- Synthetic scores are not observed audience satisfaction or Qloo results.
- Planning tokens are arbitrary, not quotes or actual operating costs.
- Keep project isolated from ARC, RSNA, Gemma and other research.
- Deadline Oct 30 2026 11:45 PM EDT = Oct 31 06:45 AM Riyadh.
\n## GitHub remote publication\nThe GitHub CLI active account was reauthenticated to Abdullah-m7. The public repository exists at https://github.com/Abdullah-m7/qloo-mosaic and the initial remote main commit matches local commit 0994d36. GitHub identifies the MIT license. An Actions CI template was prepared, but activating workflow files is blocked by a missing workflow scope in the authenticated GitHub grant. Automatic CI is NOT active.\n

## Hardening checkpoint
- Live Qloo candidate lists now require actual Qloo entity IDs; no invented IDs can stand in for provenance.
- Live mode does not fabricate prices, availability, or budget constraints.
- Official SDK defaults to production Qloo URL, so MOSAIC overrides QLOO_BASE_URL to https://hackathon.api.qloo.com in subprocess and deployment definitions.
- Live Qloo candidate discovery is cached separately from optimizer runs, reducing event API consumption for vetoes/replans.
- Render Blueprint, Docker image definition, deployment checklist and judge demo playbook are committed as deployment-ready artifacts; no external deployment is claimed before it actually exists.

## Latest publication checkpoint
- Github target: Abdullah-m7/qloo-mosaic (public)
- Confirmed repository uses MIT and branch main.
- Local checks pass 34 tests and 500 seeded synthetic cases. A CI template is available at docs/examples/github-actions-ci.template.yml; GitHub Actions is NOT active.
- Deployment and Qloo API key are still pending; no final Devpost submission.

## Static preview checkpoint
- Added a build:preview deterministic generator, with an offline adapter using the unchanged maximin engine and synthetic example.
- Chrome desktop and 390px mobile test passed, including veto undo; zero Qloo API/network requests.
- Public GitHub Pages deployment being prepared. Live Qloo demo still blocked on event-issued key.

## 12 October 2026 GitHub Pages verified
- Public preview: https://abdullah-m7.github.io/qloo-mosaic/
- Origin: isolated gh-pages branch, d3be4a3, while source stays on main.
- GitHub Pages API reported status built; public HTTPS served HTTP 200 and fetched all JS/CSS successfully.
- Browser smoke test against PUBLIC HTTPS at 390px confirmed a 3-option plan, veto/undo, zero page errors, no API/Qloo requests and no horizontal overflow.
- Core test suite now 35/35 passing, including static-preview module tests.
- This public preview intentionally uses fictional data and is NOT the Qloo-powered final submission.

## Bounded agentic loop checkpoint
- Implemented Qloo discovery, one bounded fallback query when joint discovery is sparse, paired rankings on identical option lists and evidence-gated maximin negotiation.
- Added a visible agent trace for actual Qloo-backed runs, preserving trace during cache-based replan.
- Five mocked Qloo-tool orchestration checks and one official MCP capabilities schema check bring total to 41 automated tests, all green.
- Explicit limitation: mocked behavior is not live Qloo API validation. The key request remains pending.
