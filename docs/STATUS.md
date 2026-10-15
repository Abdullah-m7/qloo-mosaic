# MOSAIC — Execution checkpoint

**Project:** Qloo Agentic Hackathon 2026 · **Owner:** Abdullah Almohammedi
**Updated:** October 15, 2026
**Repository:** https://github.com/Abdullah-m7/qloo-mosaic
**Render app:** https://mosaic-agent-2026.onrender.com/
**Synthetic static preview:** https://abdullah-m7.github.io/qloo-mosaic/

## Completed and verified

- GitHub public repository under the correct account, MIT license recognized by GitHub.
- Live publicly accessible **Node service on Render** in `QLOO_MODE=sample`; HTTPS homepage and health checks returned 200. Render is configured on the free plan, region Frankfurt, auto-deploy from main.
- Separate GitHub Pages client-only sample that cannot call the Qloo API.
- Responsive UI with two audience scenarios, veto/undo, alternative baseline comparisons, and a Cultural Bridge Agreement explaining trade-offs between two group-level ordinal preference proxies.
- An isolated direct-REST branch now implements read-only Qloo entity lookup, insights and ranking over an allowlisted event API host, plus bounded fallback discovery and optional tag enrichment. It is not yet live-verified.
- Cross-domain cultural thread is shown only if Qloo returns identical tag IDs in more than one selected category; missing or inadequate data yields an explicit `no shared tag verified` state.
- Original 50/50 checks passed on October 12. The isolated October 15 direct REST branch passes 54/54 tests after a clean dependency installation; network calls are mocked.
- 500 deterministic synthetic assignments: 429 feasible; maximin wins or ties the baseline worst-off proxy in all feasible cases, as **guaranteed by that mathematical objective**. No empirical product impact is claimed.
- Desktop 1440px and 390px mobile Chrome tests verified proposed treaty updates on veto, no JS errors and no horizontal overflow.
- Production clean-room install was tested from a public GitHub clone.

## Not yet validated (critical)

1. **Qloo event API key was emailed on October 13, 2026**, but has not been installed in a protected server environment or used in a successful live API test.
2. Real Qloo response formats, actual entity resolution, rank completeness, quota limits, and tag-evidence reproducibility must be validated end to end. All agent tool calls up to now are **mocked**, except the local, credential-free capability introspection.
3. Render service remains in explicit synthetic mode. Once a key arrives, store it only as a protected Render environment secret, set `QLOO_MODE=live`, validate the app and error handling, and verify no Qloo key reaches client JavaScript or logs.
4. Run empirical ablations on real Qloo-grounded cultural alternatives, including difficult cross-audience pairs, sparse results, a no-Qloo baseline, and honest failure cases.
5. Improve the judge walkthrough and prepare the final English Devpost entry; **nothing has been submitted**. Submission deadline: October 30 2026 at 11:45 PM EDT (October 31 06:45 AM Riyadh). The demo must remain accessible through judging ending November 16.
6. GitHub Actions CI template exists under `docs/examples/`, but cannot be activated without a separate `workflow` scope; local tests pass.
7. Render free instances can sleep between visits, so verify initial-load behavior before judging. Do not incur paid charges without approval.

## Responsible data/claims

- Synthetic group preference numbers are **invented**; rank-percentile transforms are not observed satisfaction or causal metrics.
- No attendee addresses, emails, identity data, medical data or individual taste histories are sent to Qloo.
- Qloo does not establish venue availability, event rights or ticket prices. Live planning budget control is disabled rather than fabricating them.
- Qloo requests are bound to the official event host: https://hackathon.api.qloo.com.
- Competition project remains isolated from ARC, RSNA, Gemma and other research programs.

## Next highest-value move

**Securely provision the arrived key → verify real API integration → run the falsifiable held-out ranking ablation → enable a judge-accessible live demo → finish Devpost.** The goal is strong evidence for a non-obvious and useful product, not increasing test counts for their own sake.

## Dependency security preflight (12 October 2026; historical findings)
- npm audit for the production tree detected two HIGH-severity transitive advisories: undici 8.9.0 and brace-expansion 5.0.9, inherited from the upstream Qloo harness/Pi agent dependency. Two additional MODERATE dependent-package findings cascade from these.
- Compatible patched releases exist, but an npm override resolution attempt did NOT change the nested upstream-locked versions. The ineffective overrides were reverted; **do not claim that these findings are patched**.
- The public Render service remains in sample mode, with no Qloo credential. Before enabling live Qloo mode, repeat security review and apply an upstream-compatible fix or isolate the affected runtime behind bounded, non-user-supplied Qloo API paths.

## Superseding checkpoint — 15 October 2026 (isolated branch)
- Branch: `feature/qloo-rest-validation-20261015`, NOT released to Render.
- The upstream Qloo harness and MCP SDK dependencies were **removed** in this branch, replacing them with a narrowly scoped Node REST client that never sends event credentials to the browser.
- `npm ci --omit=dev`, `npm test`: **54 passed, 0 failed**; `npm audit --omit=dev`: **0 known advisories**.
- This is risk removal by reducing dependencies, NOT a claim that the old upstream advisories have been fixed.
- `scripts/live-ablation.mjs` preregisters three real-Qloo holdout comparisons; without `QLOO_API_KEY`, the script exits with `LIVE_ABLATION_BLOCKED`. No fabricated benchmark results are emitted.
- Public Render `/health` and `/api/plan` still report **sample / synthetic**.
- **Critical gate:** configure the email-delivered key through protected server secret management, validate REST schemas, then test judge-accessible live mode. No secret has been copied into this repository.
- An updated `render.yaml` matches the existing public service name, to reduce accidental duplicate-service creation.
