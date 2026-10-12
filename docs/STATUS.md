# MOSAIC — Execution checkpoint

**Project:** Qloo Agentic Hackathon 2026 · **Owner:** Abdullah Almohammedi
**Updated:** October 12, 2026
**Repository:** https://github.com/Abdullah-m7/qloo-mosaic
**Render app:** https://mosaic-agent-2026.onrender.com/
**Synthetic static preview:** https://abdullah-m7.github.io/qloo-mosaic/

## Completed and verified

- GitHub public repository under the correct account, MIT license recognized by GitHub.
- Live publicly accessible **Node service on Render** in `QLOO_MODE=sample`; HTTPS homepage and health checks returned 200. Render is configured on the free plan, region Frankfurt, auto-deploy from main.
- Separate GitHub Pages client-only sample that cannot call the Qloo API.
- Responsive UI with two audience scenarios, veto/undo, alternative baseline comparisons, and a Cultural Bridge Agreement explaining trade-offs between two group-level ordinal preference proxies.
- Qloo client implemented using event-harness read-only MCP workflows: recommend, rank, capability check and optional entity tags for at most three selected entities, with bounded fallback discovery.
- Cross-domain cultural thread is shown only if Qloo returns identical tag IDs in more than one selected category; missing or inadequate data yields an explicit `no shared tag verified` state.
- 50/50 tests passed: optimization, adversarial evidence gating, HTTP sample/live fail-closed, mocked tool orchestration, Qloo capability contract, tag enrichment, static preview and treaty.
- 500 deterministic synthetic assignments: 429 feasible; maximin wins or ties the baseline worst-off proxy in all feasible cases, as **guaranteed by that mathematical objective**. No empirical product impact is claimed.
- Desktop 1440px and 390px mobile Chrome tests verified proposed treaty updates on veto, no JS errors and no horizontal overflow.
- Production clean-room install was tested from a public GitHub clone.

## Not yet validated (critical)

1. The user submitted the official key form and received a screen confirmation. **Qloo event API key has not been received or configured.**
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

**Key arrives → live integration proof → empirical Qloo-versus-no-Qloo case study → judge-accessible live demo → polished Devpost entry.** The goal is strong evidence for a non-obvious and useful product, not increasing test counts for their own sake.

## Dependency security preflight (12 October 2026)
- npm audit for the production tree detected two HIGH-severity transitive advisories: undici 8.9.0 and brace-expansion 5.0.9, inherited from the upstream Qloo harness/Pi agent dependency. Two additional MODERATE dependent-package findings cascade from these.
- Compatible patched releases exist, but an npm override resolution attempt did NOT change the nested upstream-locked versions. The ineffective overrides were reverted; **do not claim that these findings are patched**.
- The public Render service remains in sample mode, with no Qloo credential. Before enabling live Qloo mode, repeat security review and apply an upstream-compatible fix or isolate the affected runtime behind bounded, non-user-supplied Qloo API paths.
