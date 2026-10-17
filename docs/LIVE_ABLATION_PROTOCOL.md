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

The GitHub workflow runs this protocol only when the latest commit message contains `[ablation]` (or on an explicit manual run). The workflow never prints scores: a one-time AES-256-GCM data key encrypts all results, and RSA-OAEP-SHA256 wraps that key for the public recipient key under `evidence/ablation_results_public.pem`. The corresponding private decryption key remains outside the Git repository on the authorized Mac. The encrypted workflow artifact is retained for 7 days. This protects private research metrics from public repository logs.

Run with protected environment variables `QLOO_API_KEY`, `QLOO_RESULT_PUBLIC_KEY` and `QLOO_RESULT_OUTPUT`. Output encryption is mandatory; plaintext experiment results are not printed.

## Post-pilot protocol amendment — 15 October 2026
An initial private pilot exposed ambiguous name-only resolution in Qloo Search.
Before rerunning, the protocol now specifies the **known public category of each
anchor** (artist versus movie), using the same names, splits, planning algorithm,
comparators and held-out evaluation. Typed lookup does not inspect Qloo affinities
or change selection based on an observed outcome. Genuine within-category
ambiguity still counts as blocked. The initial private pilot is retained as
a separate result and must not be silently pooled with the amended run.

## Exploratory analysis extension — after two private pilots
This extension is explicitly **exploratory**, not confirmatory. It forces the
documented `sort_by=affinity` option in ranking/discovery, records training-to-
holdout rank correlations, and evaluates the already-computed one-sided and
mean-first baseline plans on the *same* held-out data without extra ranking
requests. If name resolution is blocked, only the category and public anchor
input are included in the encrypted artifact, not any raw provider response.
Earlier pilots remain separate evidence; metric differences must not be
represented as clean independent replications after seeing prior outcomes.
