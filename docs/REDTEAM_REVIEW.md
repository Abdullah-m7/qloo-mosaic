# Why MOSAIC Pivoted: Independent Red-Team Decision (12 October 2026)

Branch: feature/lineup-red-team. These notes preserve the outcome of two **independent, read-only** reviews performed on previous main commit `06e567a`. They are not hackathon jury scores.

## Claude Fable: Product/adversarial judging

Decision: **PIVOT**, preserving core library/test/UI infrastructure.
The present two-audience recommendation framing repeats features already offered by group-fairness, cultural bridge, and evidence-backed negotiation entries.
Best differentiated target: **Lineup Red-Team**, which audits already published cultural programs and proposes the **fewest changes** protecting multiple taste groups after constraints or artist cancellations.

Critical warnings: no issued event key, no live Qloo data, text-first Qloo signals not explicitly resolved, weak cross-category tag assumptions, synthetic benchmark designed to reward its own maximin objective, misleading budget control in live mode, and asymmetric discovery fallback.

## Codex Astra: Independent technical adversarial review

Decision: prototype technically disciplined but not yet strongly differentiated, agreeing that a **one-change culture-aware lineup rescue** is a more specific product than generating a fresh set of generic recommendations.

Reproduced risks in the previous code:
- An artist with identical name but different Qloo ID can silently be scored as the first entity.
- Swapping A/B audiences can change whether discovery succeeds.
- Adding a weak, non-selected option can change the winner due to mixed-category percentile normalization.
- A non-first preference can be counted as common ground even if both groups score it extremely poorly.
- Older pending request results can overwrite newer choices in the UI; a failed API call may leave a stale agreement visible.
- Unbounded session context entries may raise cache/rate behavior issues.

## Decision taken

Keep original MOSAIC on `main` intact. Use an isolated feature branch for an actual working Lineup Red-Team prototype. Its first product is **one-artist repair of an existing lineup**, not vague two-audience cultural recommendations. The prototype uses one homogeneous Qloo category (artist) and compares 2–5 anonymous, aggregate audiences on the **same exact lineup+alternatives ID universe**, capped to the official Qloo rank workflow limit of ten options.

The tool avoids the previous fake pricing/budget control. It respects organizer-supplied availability and supports hard lineup protection conditions; Qloo cannot itself prove bookings, performer availability, contractual rights, or attendance.

## First audited implementation

- Pure module `src/lineupAudit.mjs`: strict ID comparisons, one-change optimal repair, max-loss policy, no-unverified-availability exclusion, symmetric audience objective and auditable proof of compared IDs.
- Fictional preview `public/lineup.html`, `public/lineup.js`, `public/lineup.css`: visually clear cancellation story; two audience rank-proxy bars, availability toggles, non-stale error display and zero Qloo data claims.
- Sample-only API `POST /api/lineup-demo` for the prototype. Qloo live mode returns HTTP 503 until a real, identity-validated rank adapter has been tested.
- Pre-registered real festival test list `docs/REDTEAM_PROTOCOL.md`: real published artist names with **hypothetical** cancellations. No live Qloo claims.
- Automated tests include role-swap invariance, wrong IDs, hard constraints, no fake availability, API/live fail-closed; browser tested desktop and mobile.

## Do not merge/submit until

1. Qloo event key arrives, and the official live endpoint's ID+rank schema is confirmed.
2. A live adapter resolves 3–8 lineup identities + up to 2 verified replacement identities, ranks the identical union for every audience, refuses missing/mismatched identifiers, and observes rate budget.
3. At least 3 pre-registered public lineup scenarios have honest Qloo results, identity validation and recorded failure cases.
4. A realistic no-Qloo comparison is run; objective optimization alone is NOT interpreted as consumer outcomes.
5. The public Render link contains this scenario in Qloo live mode with protected credentials, and judge demo is accessible for the entire judging window.
6. The broader previous UI/rate/cache findings are either fixed or isolated from the live path.

**Only then:** make Lineup Red-Team the lead experience on main, keep the current interactive preview as explicitly fictional onboarding, and prepare Devpost text for user review before submitting.
\n## Verified public prototype (12 October 2026)\n- URL: https://abdullah-m7.github.io/qloo-mosaic/lineup/\n- Served via the existing GitHub Pages site under a separate /lineup/ path. The previous main homepage and Node production server were left intact.\n- Public HTTP 200; tested in desktop and 390px mobile Chrome via actual HTTPS. No JavaScript errors or horizontal overflow, cancellation toggles and unavailable replacement abstention work, and the previous decision is cleared on failure.\n- Uses a client-only adapter with fictional characters and seeded rankings. NO Qloo calls or event key. This does not qualify as a final live Qloo submission.\n- Feature branch tests: 65/65 passing; base main remains unchanged.\n