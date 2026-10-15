# MOSAIC — falsifiable live Qloo ranking ablation

**Protocol frozen:** 2026-10-15, before first credentialed API test.
**Status:** Not yet executed with real Qloo responses. No empirical claim is made.

## Question
Does Qloo-derived preference ranking improve decisions for *unseen cultural anchors*, compared with a planner that cannot see those rankings?

## Method
1. Use three preregistered public cultural scenarios in `scripts/live-ablation.mjs`.
2. Resolve one training anchor per audience through `GET /search` and discover exactly the same Qloo-grounded candidate pools for both planners through `GET /v2/insights`.
3. **Qloo-aware arm:** choose one artist, one place and one movie with trained group rankings using the project's maximin policy.
4. **Rank-blinded comparator:** within those *same* candidate pools, choose one per slot by deterministic alphabetical name. This is not a full no-Qloo entity-discovery baseline.
5. **Held-out evaluation:** ask Qloo to rank the unchanged shortlisted options using a previously unseen second anchor per audience. Compute each plan's lower of the two mean within-slot ordinal-rank percentiles.
6. Record the signed paired difference; report failures, zero gains, and negative gains. Never discard a scenario merely for an unfavorable outcome.

## Interpretive limits
- Held-out Qloo agreement is **within-provider consistency**, not human satisfaction or a causal uplift.
- Both arms inherit Qloo's candidate discovery. The test isolates incremental value from Qloo **ranking** only.
- A positive result is not guaranteed by the maximin objective, because evaluation uses separate anchors.
- Missing entity identities, sparse categories, API denials, incomplete rankings or timeouts count as blocked cases.
- Aggregate metrics can be shared; do not commit raw API results, event credentials or private research material.
- No cost, event booking, film licensing, artist availability or attendee conversion is estimated.

Run only on a secure local or server environment with a protected event key: `npm run benchmark:live`.
