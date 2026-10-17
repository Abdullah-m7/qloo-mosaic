# MOSAIC — multi-anchor robustness experiment

**Exploratory extension:** 15 October 2026, after the original holdout pilot.
This is not an independent confirmatory validation; no results are claimed
in this document.

## Question
For two different cultural audiences, is a plan informed by **one artist and
one film anchor per audience** more stable on previously unseen artist
preferences than a plan informed by one artist anchor alone?

## Frozen arms and procedure
The exact three public scenarios, input categories, holdout labels and locale
filters are versioned in `scripts/multi-anchor-ablation.mjs`. For each:
1. Create a **single shared Qloo candidate shortlist** using all four training
   anchors. This guarantees that every policy chooses from identical options.
2. Rank that same shortlist separately using (a) both training anchors and
   (b) only the first artist anchor, for each audience.
3. Generate three decision policies: standard maximin with two anchors,
   standard maximin with one anchor, and the two-anchor polarization-penalized
   maximin (fixed penalty coefficient 0.25).
4. Also compare against a deterministic alphabetical, rank-blind option
   from each category. This still uses Qloo *discovery*; it is not a full
   independent no-Qloo recommendation engine.
5. Evaluate all four choices using the same held-out artist anchor per
   audience. Report the signed paired differences without dropping a case
   merely because the result is unfavorable.

## Interpretation and guards
- Outcome is the **lower audience mean of within-shortlist ordinal rank
  proxies** across artist, place and movie slots, not user satisfaction.
- All variants use Qloo-derived candidate pools. The experiment isolates
  incremental signal choice and negotiation policies, not global Qloo impact.
- Disambiguating the public film `Barbie` by the known 2023 release year
  uses identity metadata only, **never affinity**, and refuses to guess when
  release-year metadata are absent or inconsistent.
- Invalid, missing or ambiguous identities, incomplete matched rankings and
  API quota failures are explicit blocked results.
- Test credentials enter via server-side `QLOO_API_KEY` only.
- Numerical research results are sealed with AES-256-GCM and an RSA-OAEP-wrapped
  key for a local private recipient; GitHub receives ciphertext only.
- The public user-facing planner is unchanged by this exploratory run.

## Missingness-aware exploratory amendment — after multi-anchor pilot
Qloo sometimes returns **fewer ranked items than the requested shortlist**.
For the next exploratory run, a Qloo tool reply with at least two grounded,
matched identifiers is retained rather than treating the entire call as
unusable. The agent takes only the *intersection* of options independently
ranked for both groups; options absent from either rank are discarded,
not guessed or assigned a zero. In the multi-arm experiment a second
intersection restricts all four policies to identical candidates having
multi-anchor training, single-anchor training and held-out rankings. At
least two common candidates must survive in **each** of the three slots.
Every slot re-normalizes relative percentile ranks on this common list and
records discarded counts. These are changes to evidence availability and
the evaluation sample, not a claim of increased model ability. Results
are exploratory because amendments followed inspected pilot failures.
The public 2019 release year for the original film *Parasite* is specified
in the private study's preexisting anchor metadata, with no score-based
choice of homonymous Qloo IDs. Missing or conflicting year evidence
continues to block that case.
