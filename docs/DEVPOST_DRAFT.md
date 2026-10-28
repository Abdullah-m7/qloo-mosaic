# Devpost draft — MOSAIC (NOT SUBMITTED)

For the concise, submission-ready English narrative, see [DEVPOST_READY_COPY.md](DEVPOST_READY_COPY.md). This longer document preserves the technical and limitation details for review.

**Project:** MOSAIC — Common Ground, by Design
**Tagline:** Two communities. One cultural night. An explainable agreement.
**Team:** Solo entry · Abdullah Almohammedi
**Source:** https://github.com/Abdullah-m7/qloo-mosaic
**Judge demo:** https://mosaic-agent-2026.onrender.com/ — live Qloo-backed mode publicly verified on 28 October 2026.
**Verified live screenshots:** [Desktop](mosaic-live-judge-desktop.jpg) · [390px mobile](mosaic-live-judge-mobile.jpg). Captured from the production public Render URL after commit `8a7a297` was deployed and passed browser and Qloo release checks on 28 October 2026.

## How the judges can try it

Open the **live Render demo** above without signing in. The default public
artist/movie anchors and city are ready; the first full Qloo plan took ~21
seconds in one observed check and may vary or require a cold start. Inspect
the artist/place/film agreement, compare the two audience rank proxies,
inspect the exact shared Qloo tag evidence, reject a proposed option to see
a cached re-plan, and use **Copy decision brief**. The separately linked
GitHub Pages preview is a clearly labeled synthetic illustration, **not**
the live competition demo. Rank proxies are not measured audience satisfaction.

## The problem
An event organizer has two cultural communities to bring together. The
obvious play is to pick what the biggest group likes or what scores best
on average. Both can quietly sideline one audience. Generic taste
recommendations rarely explain whose interests were traded away, how
a compromise was reached, or whether a claimed cultural connection is real.

## Our solution
MOSAIC is a bounded, evidence-aware cultural negotiation agent. Give it
publicly known artists and films representing two audiences, plus a
location. It asks Qloo for a matched shortlist of artists, places and
film experiences; independently ranks the identical options against each
audience; then searches for a cross-category plan that maximizes the
lower of the two group-relative ordinal rank proxies.

The result is a **Cultural Bridge Agreement**. It identifies the chosen
experience and its Qloo entity evidence; contrasts that decision with an
Audience-A-first choice and an average-first choice; explains which
audience makes which trade-off; and exposes an auditable tool trace.
Organizers can reject an option and re-negotiate using cached Qloo
evidence instead of initiating unnecessary new calls. MOSAIC also
stress-tests the agreement: it hypothetically excludes each chosen item,
searches for the strongest feasible alternative, and shows the ordinal
rank-proxy impact. The calculation is deterministic and makes no
additional Qloo API calls. It is not a prediction of booking availability.

MOSAIC also reuses Qloo's **actual source tag IDs** attached to each discovered entity to test whether the selected artist, place and film share a genuine cultural motif, without any extra provider calls. If an exact cross-category ID match does not exist, the agent makes no cultural-link claim.

If Qloo does not uniquely resolve a public cultural anchor, or if both
audiences have too few mutually ranked options, MOSAIC refuses to invent
a recommendation. Claimed links across categories require the exact
same provider-verified tag in at least two selected categories; otherwise
the interface plainly says that no such thread was verified.

## The interactive negotiation frontier
Instead of presenting one opaque recommendation, MOSAIC enumerates the
**exact Pareto-efficient frontier** across the two audiences' relative
ordinal rank proxies, with an interactive dial to preview multiple
culturally grounded compromises. When one audience gains preference rank,
the organizer can see which other group's rank changes and which actual
Qloo-backed artist/place/film combination would be substituted.

A separate **rank-blind alphabetical comparator** chooses from the exact
same Qloo-discovered entities without using their taste ordering. We
explain this limitation explicitly: it is not a fully Qloo-free LLM
baseline, and outperforming it on the planner's own training objective
is a mathematical property, not proof of better future human choices.
No Qloo API calls are added by frontier exploration.

## Evidence-backed Cultural Thread Finder
MOSAIC identifies an **optional second agreement** for organizers who
want a verifiable cultural reason to bring different activities together.
It inspects the provider tag IDs actually attached to Qloo-discovered
artists, places and film entities and searches for an artist/place/film
combination with the SAME Qloo tag recorded in two distinct categories.

This search is deliberately constrained: the lower of the two audience
ordinal rank proxies cannot fall more than five percentage points below
the standard balanced plan. The interface shows the exact provider
tag, involved categories, proposed alternative and proxy tradeoff.
It never asserts that shared metadata proves real audience satisfaction
or that artists, locations or screenings can be booked. If there is no
supported link under the constraint, the tool says so rather than
inventing one. No new API calls are required after candidate discovery.

## Why Qloo matters
Qloo is not a decorative API call. Its real entity discovery, audience-
relative rankings and optional tag evidence are inputs to the planner.
Without those inputs, MOSAIC cannot legitimately produce a live
evidence-backed agreement. Synthetic mode is labeled as an offline
illustration and must not be mistaken for the live judge experience.

## Qloo-backed, per-audience explanations
For each shortlisted option, the server asks Qloo for documented
`feature.explainability=true` metadata as part of the existing Insights
ranking calls. When Qloo supplies per-entity contributions, MOSAIC
maps them back only to the organizer's **public taste anchors** and
labels the two audience contributions separately. If the provider
cannot explain an item, the UI says so instead of attributing an
unverified cultural connection. Normalized provider scores are
explanation metadata, not satisfaction percentages or causal influence.
No additional calls are needed for this feature.

## Engineering and responsible deployment
Node.js 24, minimal client-side JavaScript, server-side Qloo event REST
integration, immutable event hostname, bounded tool requests, short-lived
evidence caching, explicit request limits, deterministic negotiation,
fail-closed error handling and GitHub Actions verification.

The API credential is held in protected server environments; there is
no browser-exposed key, individual profile collection, or human-subject
data requirement. The open-source repository carries an MIT license.

## Limitations
Ordinal rank percentiles are not calibrated satisfaction probabilities,
causal evidence, attendance predictions or measures of demographic
fairness. Qloo does not verify booking inventory, venue prices, artist
availability or film licensing. Preliminary exploratory holdout tests
do not establish consistent decision uplift, so the application does
not claim a measured real-world outcome.

## Live demonstration sequence (once final deployment passes its gate)
1. Enter two public cultural profiles and a city. Observe real Qloo
   discovery, mutually ranked options and a three-part plan.
2. Compare the agreement with one-sided and average-first baselines.
3. Inspect evidence identifiers and decision trace.
4. Reject an option and show the cached evidence-backed re-plan.
5. Use an ambiguous name or insufficient evidence and show honest
   abstention with no synthetic fallback.

**Submission status:** DRAFT ONLY — not confirmed submitted on Devpost.
The anonymous public technical release check and desktop/mobile Chrome walkthrough passed on 28 October 2026 against deployed commit `8a7a297`. Before submitting, confirm all mandatory Devpost fields and the final account submission state; no real-world human impact has been measured.
Owner approval is required for final submission.

## Intended users and business potential (hypotheses, not customer validation)
MOSAIC is designed for community event organizers, arts-program producers,
mixed-audience festivals and local cultural-marketing teams who need to
justify decisions to more than one constituency. Organizers now have a
three-option cultural activation plan, Qloo trace, scenario trade-offs,
single-veto stress tests and a visual negotiation frontier in one
transparent workflow instead of generic, unaccountable top-ten suggestions.

A future organizer-facing service could charge for planning seats or event
decision packages and integrate real venue availability, screening
licensing, budgets and outcome feedback via authorized partner services.
**This pricing/business model is an unvalidated product hypothesis.** No
customer adoption, event attendance, revenue uplift, legal licensing
or sponsor investment is asserted in this hackathon submission.
