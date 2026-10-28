# MOSAIC — Judge Release Gate

**Status:** PUBLIC LIVE TECHNICAL CHECK PASSED · Devpost submission NOT CONFIRMED · Updated 28 October 2026
**Scope:** Abdullah-m7/qloo-mosaic only
**Deployed release:** `main` commit `8a7a297` (Render; live from 28 October 2026, 09:16 UTC)
**Public live judge URL:** https://mosaic-agent-2026.onrender.com/

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

## Verified production checks and remaining submission tasks

**Verified 28 October 2026 (anonymous public HTTPS):**
1. `GET /health` returned `status=ok`, `mode=live`, `version=0.3.0`.
2. `npm run judge:check` passed a public Qloo-backed plan with three ID-grounded categories, provider-tag cultural thread evidence, three no-new-Qloo-call stress checks, cached veto re-planning and bad-input refusal.
3. The public source is MIT licensed; Render reports commit `8a7a297` as **Live**. The public browser walkthrough below independently verifies the UI experience.

**Still required before final Devpost submission:**
1. **Browser production walkthrough passed on 390px and 1440px Chrome on 28 Oct**; additional browsers, cold-start and all failure states are outside the current verified coverage.
2. Keep the official live Render URL as the primary judge demo and clearly label the static GitHub Pages preview synthetic.
3. Keep public README, Devpost description and screenshot captions consistent with the actual deployed release; the final Devpost entry has not been submitted.
4. Confirm all mandatory Devpost fields and the logged-in submission status. The public deployment is complete, **but final Devpost submission has not occurred**.
5. Do not merge, redeploy, expose credentials or submit a final Devpost entry without owner approval. No paid plan changes.

## 28 October browser preflight and final live production acceptance

- Before the release, Chrome confirmed three Qloo-backed cards and veto re-planning on the older public Render instance. Its missing favicon returned 404; the deployed release now serves it with HTTP 200.
- The formerly isolated worktree `prep/qloo-judge-readiness-20261028` was first tested through a localhost-only proxy with real Render Qloo API data. After PR #3 merged and Render deployed `8a7a297`, the **actual public live URL** passed Chrome preflight again: mobile 390px and desktop 1440px, three Artist/Place/Film cards, source provenance, veto re-planning, no horizontal overflow or browser errors. Result: `PASS`.
- Browser checks cover this workflow and viewport sizes, not every device or all failure scenarios. Observed warm-cache candidate test took ~10 seconds; no production latency improvement is claimed. A previous live public browser plan took ~25.5 seconds.
- **Final release gate passed on public HTTPS**: Render reports `live` for `8a7a297`; public `/health` and `/favicon.svg` returned 200; `npm run judge:check` returned `MOSAIC_PUBLIC_RELEASE_PASS`, 3 grounded categories and 3 stress tests, a verified Qloo cultural thread, cached veto and a safe 400 refusal. One first Qloo plan took ~21.0s; this is not a latency guarantee. **Devpost final submission remains unconfirmed and requires owner approval.**

## Public release check contract
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
Run `npm run judge:check` to verify the existing Render endpoint and
after any future deployment. This checker uses **only public HTTPS**
endpoints, holds no Qloo credential and asserts:
- `/health` returns product MOSAIC, `mode=live`, `version=0.3.0`;
- the page is actually served; the default public anchor request creates
  three Qloo-sourced, ID-backed categories with rank provenance;
- three exclusion counterfactuals exist and report zero additional
  provider calls;
- veto re-planning reuses cached evidence, while email-like input
  is rejected without synthetic fallback;
- response timings are reported without printing personal identifiers,
  event keys, raw Qloo results or private research metrics.

**Observed 28 October 2026:** `MOSAIC_PUBLIC_RELEASE_PASS` against the actual
Render URL, with public Qloo evidence. One first live plan took ~20.9s;
cached veto re-planning took ~0.14s. These are single observed timings,
not guaranteed performance. GitHub Actions checks alone would not prove this
public gate, and this probe still does not run browser JavaScript.

**Historical result, 16 October 2026 (superseded):** the read-only checker was run
against https://mosaic-agent-2026.onrender.com/ and deliberately blocked
with `MOSAIC_PUBLIC_RELEASE_BLOCKED: RENDER_STILL_SAMPLE` before issuing
any Qloo-funded planner requests. This was a deployment blocker at that date; it was subsequently resolved,
as independently shown by the public pass on 28 October.

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
  a fixed **5 percentage points** design threshold.. The original maximin choice is
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
