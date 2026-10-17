# MOSAIC — Judge Release Gate

**Status:** NOT READY TO SUBMIT · Updated 16 October 2026
**Scope:** Abdullah-m7/qloo-mosaic only
**Candidate:** `feature/qloo-rest-validation-20261015`
**Public judge URL (not live yet):** https://mosaic-agent-2026.onrender.com/

## Verified independently
- Source is public under Abdullah-m7 with an MIT license.
- Real Qloo event key is stored in GitHub Actions secrets; it is not in source.
- The protected event key successfully authenticated real Qloo Search, Insights,
  artist/place/movie discovery, matched-list audience rankings and a three-slot
  agent run: https://github.com/Abdullah-m7/qloo-mosaic/actions/runs/38718037660
- Production dependencies are empty and the clean GitHub Actions audit found
  zero known advisories in the direct-REST branch.
- The local automated test suite covers fail-closed API behavior, provenance,
  insufficient mutual rankings, live error mapping, and UI stale-result clearing.
- Real held-out exploratory comparisons have been conducted using separately
  encrypted artifacts; they DO NOT establish consistent decision uplift.
  Never publish private experiment rows or claim real-world human outcomes.

## Release blockers — do not mark complete prematurely
1. Render currently reports `QLOO_MODE=sample`; its public response remains
   explicitly synthetic. GitHub's Actions secret does NOT configure Render.
2. The final branch is not merged or deployed; review this feature branch
   as a draft PR first.
3. Store `QLOO_API_KEY` in the existing Render service's protected Environment
   secrets, with `QLOO_MODE=live`. Never paste it into a GitHub issue, PR,
   commit, browser bundle, documentation, screen recording or chat.
4. Verify three separate live public scenarios from a browser with no login,
   including a successful plan and a clear insufficient-evidence case.
5. Verify direct access from mobile, initial cold start, cache-backed veto/undo,
   default inputs, API throttling, CORS and absence of secret leakage.
6. Confirm the public source points to the exact deployed commit, that the
   MIT license is visible, and that judge instructions are unambiguous.
7. Prepare the final Devpost entry; no final submission is claimed.

## Required release check (after secure Render provisioning)
- GET `/health` responds `status=ok,mode=live`.
- POST `/api/plan` using publicly known cultural entities returns
  `mode=qloo-live,source_mode=evidence-backed`, three Qloo-backed slots,
  and provenance IDs. It must NOT return synthetic fixture data.
- Inspect the exact Pareto-efficient negotiation frontier and its interactive dial; verify the maximin recommendation, category-level alternatives and rank-blind alphabetical comparator are all derived from the same Qloo-grounded shortlist with zero additional provider calls. Do not claim held-out uplift from in-sample optimizing.
- Inspect the three single-option resilience counterfactuals; confirm each is derived from the same verified shortlist, uses zero additional provider calls, and labels proxy changes without claiming real booking availability.
- Veto a live recommendation; confirm a cached replan (zero extra Qloo calls).
- Use typed public anchors such as `Movie: Barbie (2023)` to resolve known identity ambiguity by category and release year, without revealing an entity ID or a private profile. Verify malformed hints are rejected safely.
- Use ambiguous public inputs; confirm a non-200 explanation and no leaked
  source, stale previous agreement, or fabricated ranking.
- Inspect browser Network and logs: zero exposed Qloo credentials.
- Test after an idle period to assess Render free-tier cold-start delay.
- No paid plan changes unless separately approved.

**Deadline:** October 30, 2026 at 11:45 PM EDT (October 31 at
06:45 AM Asia/Riyadh). Keep the public application available during judging.

## Live judging reliability hardening (16 October)
- Render's public Cloudflare `CF-Connecting-IP` is validated as a single IP
  before being trusted for per-visitor request quotas only when
  `RENDER=true`. Locally, the server uses the socket peer and ignores
  spoofable forwarded headers. This avoids treating all judges as one client.
- Identical concurrent public planner requests are coalesced into a single
  Qloo call; up to three distinct contexts may be in flight. Busy responses
  fail closed without triggering extra provider calls. The limiter's
  ephemeral client map is bounded to avoid memory growth.
- Same-context coalescing, 429 handling, authentic IP selection and failed-job
  cleanup are unit-tested. Never log visitor IPs or event secrets.
- These protections do not replace real anonymous browser, cold-start and
  event quota testing after Render is configured with the protected API key.

## Protected judge HTTP simulation (16 October, validation candidate)
- `scripts/judge-http-smoke.mjs` starts a temporary, **localhost-only**
  Node server in live mode with the GitHub event secret. It uses exactly the
  default cultural names appearing in the public UI, not simplified test-only
  anchors; it never opens a public endpoint or logs provider payloads.
- The run asserts Qloo-backed evidence, three plan categories and ranking
  traces, then tests a veto and cache re-negotiation (zero extra Qloo calls),
  and rejects a private/email-like anchor without falling back to fixtures.
- CI runs this extra live HTTP scenario **only** for commits tagged
  `[http-e2e]`, limiting event quota use. A green direct tool smoke does not
  imply that the judge HTTP path is valid; require both as release evidence.
- This still cannot prove Render's protected secret or public deployment;
  that requires a separate production smoke test.

## Public release probe — no browser-side credential
Run `npm run judge:check` after the existing Render service receives its
protected `QLOO_API_KEY`, the verified branch is deployed, and
`QLOO_MODE=live` is confirmed. The checker uses **only public HTTPS**
endpoints and holds no Qloo credential. It asserts:
- `/health` returns product MOSAIC, `mode=live`, `version=0.3.0`;
- the page is actually served; the default public anchor request creates
  three Qloo-sourced, ID-backed categories with rank provenance;
- three exclusion counterfactuals exist and report zero additional
  provider calls;
- veto re-planning reuses cached evidence, while email-like input
  is rejected without synthetic fallback;
- response timings are reported without printing personal identifiers,
  event keys, raw Qloo results or private research metrics.

The current live link is intentionally still synthetic, so the probe must
return `MOSAIC_PUBLIC_RELEASE_BLOCKED: RENDER_STILL_SAMPLE` until the
production secret/deployment gate is passed. A passing Actions smoke in
a separate runner is NOT a substitute for this public release gate.

**Observed result, 16 October 2026:** the read-only checker was run
against https://mosaic-agent-2026.onrender.com/ and deliberately blocked
with `MOSAIC_PUBLIC_RELEASE_BLOCKED: RENDER_STILL_SAMPLE` before issuing
any Qloo-funded planner requests. This confirms the remaining deployment
and protected environment-key work; it does not negate the already-green
GitHub event API and localhost HTTP smoke tests.

## Negotiation frontier check — candidate version
- The app returns an exact nondominated frontier from already validated
  mutually ranked artist/place/movie options. The maximin recommendation
  must remain present even if the displayed points are downsampled.
- Judges can use the dial or focus the plotted points to preview changes to
  both group-relative rank proxies and the selected cultural entities.
- Check this in a clean 320px, 390px and desktop browser: the preview must not
  call the Qloo API or overflow horizontally.
- The separate alphabetical control chooses from **Qloo-discovered entities**
  without their taste order. Its in-sample score difference is NOT an
  independent Qloo-free LLM baseline and NOT measured preference uplift.
- Run `npm run judge:check` against Render after credentialed deployment:
  the check now refuses a public app without the negotiation frontier.

## Qloo explainability and real source-tag provenance
Qloo's documented `feature.explainability=true` was verified with the
hackathon key in a protected GitHub Actions diagnostic: per-result and
aggregate metadata were present. Returned discovery entities also contained
real tag IDs, names and types. We now reuse the provider-returned tags from
those grounded entities for cultural thread verification without additional
Insights requests or invalid `urn:tag` recommendation calls. Identical tag
IDs across **different** selected categories are required to make a shared
thread claim; otherwise the UI states no verified thread. The default live
HTTP judge smoke requires three cached tag provenance stages, each recording
zero additional provider calls. Per-anchor explainability details will only
be publicly surfaced if their exact data schema is validated; no fabricated
contribution numbers or interpretive labels may be shown.

## Qloo provider-tag cultural thread gate (16 October)
- The alternative must be computed from exact Qloo **provider tag IDs**
  shared by different shortlisted categories; equal-looking tag labels
  with different IDs never establish a link.
- Limit the alternative's lower-audience ordinal rank proxy drop to a
  preregistered **5 percentage points**. The original maximin choice is
  unchanged; no real booking, revenue or human preference advantage is
  claimed.
- Accept a safe "no verified thread" outcome. Never invent motifs or
  assign invented proxy values when provider tags are absent.
- Cache-backed veto replans must rebuild selected tag evidence from the
  exact saved provider responses, and compute the alternative without
  any additional Qloo call. Raw candidate tag arrays must remain
  server-side, never in the browser response.
- The GitHub event-key-backed HTTP smoke must verify this contract and
  emit **status and counts only**, not raw tag identities or private research.
