# Lineup Red-Team — Pre-registered evaluation v0.1

Date locked: 12 October 2026. Written **before receiving the Qloo event key**.
Purpose: falsifiable test of a practical one-change lineup repair assistant.
This document **does not** claim any real cancellation, performer availability, Qloo response, real audience preference or quantified social impact.

## Core testable product hypothesis

Given a **pre-existing public lineup** and one hypothetically unavailable artist, a Qloo-grounded agent can choose among **organizer-confirmed alternatives** while obeying fixed lineup and cultural-balance constraints. It must show an identity-checkable reason for the repair and abstain when evidence is incomplete.

The buyer is a professional venue/festival programmer; the task is minimizing changes to a planned program, **not** generating a new playlist or asserting attendance probability. We limit first release to **one-stage artist lineups**, up to 8 incumbents plus 2 proposed replacements, because a Qloo rank call accepts at most ten comparable options.

## Public lineup scenarios, selected before Qloo testing

All changes and replacement availability in these scenarios are **hypothetical counterfactuals**, not news about the named artists. Resolve all candidate names to exact unique Qloo IDs. If Qloo cannot resolve them, record the failure rather than cherry-pick substitutions.

| Case | Published public lineup source | Fixed initial three artists | Hypothetical unavailable artist | Two potential replacements to check with Qloo | Public taste anchors (A vs B; no individuals) |
| --- | --- | --- | --- | --- | --- |
| R1 Riyadh | [MDLBEAST SOUNDSTORM 25 lineup](https://mdlbeast.com/events/soundstorm-25/lineup/artists) | Post Malone; Benson Boone; Calvin Harris | Benson Boone | Swedish House Mafia; DJ Snake | A: Taylor Swift, Olivia Rodrigo; B: Daft Punk, The Chemical Brothers |
| B1 Barcelona | [Primavera Sound Barcelona 2026 official lineup](https://www.primaverasound.com/es/news/primavera-sound-barcelona-presenta-su-rutilante-cartel-para-2026-con-the-cure--doja-cat--the-xx--gorillaz--massive-attack--addison-rae-y-my-bloody-valentine) | The Cure; Doja Cat; The xx | Doja Cat | Gorillaz; Massive Attack | A: Radiohead, Slowdive; B: Charli XCX, FKA twigs |
| G1 Berlin | [Lollapalooza Berlin 2026 lineup](https://www.lollapaloozade.com/en/lineup/) | Pitbull; Lewis Capaldi; Lorde | Lorde | Zara Larsson; Lily Allen | A: Adele, Ed Sheeran; B: Robyn, Charli XCX |

Names and public event sources are fixed in advance. Any edition-specific errors discovered later must be noted in an amendment, not silently edited. Because the available substitutes came from the same published lineup, the simulation is **not an operational availability claim**.

## Test procedure, independent of results

1. With a real event key, use the official Qloo host https://hackathon.api.qloo.com. Verify the permission/rate-limit contract and log only **redacted** requests/responses.
2. Resolve each lineup artist, alternative, and each audience anchor into unambiguous Qloo IDs using authoritative Qloo search. Reject duplicate-name ambiguity and unresolved names.
3. Run *one* rank call per group on the **same five-artist union** (3 incumbent + 2 alternatives), using exact entity IDs. Keep source IDs and reply IDs. Any cross-ID mismatch, absent ID or incomplete ranked list is an abstention.
4. Evaluate the same pre-registered hypothetical cancellation with our frozen maximin one-change policy. Restrict replacements to the two explicitly proposed alternatives (a counterfactual availability assumption); the rest of the lineup is frozen.
5. Baselines, frozen before viewing Qloo results: **first available candidate in alphabetical order** (no Qloo), **average-first on the identical Qloo rank data** (Qloo-provided comparator), and **genre overlap from publicly available descriptive metadata** (only if that third-party source is consistently available for all compared artists). Report unavailable baseline data as unavailable, not zeros.
6. Test fairness under audience-order reversal and insertion of a weaker decoy in a **fixed and comparable** option universe; label model instability, and do not conceal it.
7. Publish all three runs, including failures; do not swap out cases when Qloo disagrees.

## Acceptance criteria / risk of falsification

- Identity integrity: **100%** of scored result IDs map to resolved Qloo entity IDs, otherwise fail closed.
- Completeness: record how often rank calls return the full candidate universe; missing results must stop the workflow.
- Policy: one and only one substitution when an act is unavailable; protected acts never removed; no substitute can be shown as contractually available unless organizer says so.
- Structural invariance: reversing the labels/order of audience groups must not change the replacement artist. If adding an irrelevant weak candidate reverses the recommendation, display a fragility warning.
- Outcome: report worst-group ordinal rank change and average trade-off, **not** attendance forecasts, conversion uplift, willingness to pay or "real fairness."
- Qloo value claim: compare candidate selection against no-Qloo baseline and identify which **specific cross-domain Qloo result** altered the decision. If none, explicitly say "No Qloo-added advantage demonstrated."
- Stability: if one leave-one-anchor-out perturbation flips the decision, flag it as fragile rather than celebrating a clean answer.

## Publication / safety constraints

No unauthorized actual venue, performer, availability, travel, price, copyright or ticketing claims. No personal profiles or protected attributes. A public hypothetical simulation may use names from openly published lineups as factual background with the original sources linked; no original imagery, poster or copyrighted music is copied.

Do not claim live Qloo validation or submit a synthetic-only Devpost demo. Deadline: October 30, 2026 at 11:45 PM EDT. Judge-accessible live URL must be hosted through November 16.
