# MOSAIC Active Frontier — fixed fresh-case exploratory protocol

**Locked before the first live Actions run, 17 October 2026.**  
**Scope:** experimental branch only; not the public Render app, Devpost or production `main`.  
**Status:** protocol, NOT a result or superiority claim.

## Motivation
The current live MOSAIC agent picks at most five Qloo-ranked candidates
per slot from a joint discovery query. It asks for more only when fewer
than two were found. The new prototype asks Qloo **one extra, targeted
discovery question** about the relatively disadvantaged audience, in the
slot where that audience has the largest feasible-option regret.

Qloo is load-bearing: both entity discovery and the two audience-rank
queries use Qloo IDs/affinity ordering. The experimental agent NEVER
changes the production release or creates invented Qloo data.

## Four locked test scenarios
Preexisting October 15 development/ablation cases are excluded.

| Case | A training anchors | B training anchors | Held-out A | Held-out B | City |
| --- | --- | --- | --- | --- | --- |
| soul-synth | Nina Simone; Moonlight (2016) | Kraftwerk; Her (2013) | Norah Jones | Boards of Canada | Chicago |
| afrobeats-indie | Burna Boy; Black Panther (2018) | The National; Lost in Translation (2003) | Wizkid | Bon Iver | Boston |
| latin-minimalism | Bad Bunny; Coco (2017) | Ludovico Einaudi; Amélie (2001) | J Balvin | Max Richter | Miami |
| garage-ambient | Arctic Monkeys; Whiplash (2014) | Nils Frahm; Arrival (2016) | The Strokes | Ólafur Arnalds | Austin |

All names refer to public artist/movie identities, not actual participant
profiles. Names and release years are explicit in
`scripts/active-frontier-holdout.mjs`; do not modify after any live
results are inspected.

## Selection algorithm (fixed)
1. Standard Qloo discovery and independent ranks for two training groups.
2. Freeze the original maximin plan and identify the lower group (A on a
   tie). Find the slot with greatest *within-slot* gap to that group's
   best ranked option; fixed slot order breaks ties.
3. One `qloo_recommend` with that group's training anchors and the same
   city (if place). Up to three genuinely new provider IDs, bounded by
   the existing 8-option matched-rank cap.
4. Qloo re-ranks the **same exact union** of old and new entities
   independently for A and B; if any old entity is unavailable on
   either new rank list, classify the case as blocked.
5. Optimize the original-only candidates and expanded candidates using
   these exact same union-relative ordinal rankings. Log the in-sample
   difference only as a structural diagnostic, not evidence of superiority.
6. **Only after the choices are frozen**, evaluate the two final plans
   using entirely distinct, withheld public artist anchors. The same
   candidate union is re-ranked for both held-out groups, across all
   three slots. No missing held-out item may be imputed; report
   missing/blocked cases, not just successful experiments.

## Fixed metrics and interpretation
Primary: signed paired difference in worst-group held-out **ordinal rank
proxy** (expanded minus original-only), evaluated on the same Qloo-ranked
candidate pool. Also record wins/ties/losses, coverage, number of new
Qloo entities mutually ranked, selected novel item, provider calls and
elapsed seconds. All results encrypted with the existing local-only
private key; public Actions logs show only completion counts.

This is an exploratory **four-case technical feasibility pilot**. Even
4/4 improvement does NOT establish human satisfaction, probability,
commercial impact, statistical superiority or fairness. Provider-held-out
Qloo evaluations are not independent real users.

For the next, larger pre-registered stage, proceed only if at least 3/4
cases have evaluable held-out results, at least three completed cases
improve over their matched baseline by a nonzero amount, the mean
difference reaches +0.05 or better, and the added provider calls/latency
do not make the demo unusable. These are **engineering advancement
thresholds**, not scientific proof. If they fail, do not merge this
experimental feature into `main`.

## Fixed safety, no-cherry-picking rules
- Treat unresolved public anchor identities, missing Qloo ranks, API
  quotas and timeouts as documented blocked cases.
- No repeat or edit of the same scenarios after inspecting outcomes,
  unless creating a separately dated amended study.
- No use of held-out anchors in candidate discovery or optimizer input.
- No credential, raw Qloo payload, provider tag list or private numeric
  research rows in CI logs, plaintext artifacts, GitHub discussions,
  README, or Devpost.
- `QLOO_API_KEY` comes from the already protected GitHub Actions secret.
  The study never requests it from Render, Gmail or the user's device.
- No updates to Render, `main`, unrelated project branches or the
  submission application. Competition entry remains unsubmitted.

## Code fixture fingerprint (frozen before first API run)

The immutable scenario/evaluation source is `scripts/active-frontier-holdout.mjs`:

```
d8b54187070854c5450edf37ef33aa2e6313f5a16977145b6c6570c5e0174d34  scripts/active-frontier-holdout.mjs
```
