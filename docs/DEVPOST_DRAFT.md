# Devpost draft — MOSAIC (NOT SUBMITTED)

**Project:** MOSAIC — Common Ground, by Design
**Tagline:** Two communities. One cultural night. An explainable agreement.
**Team:** Solo entry · Abdullah Almohammedi
**Source:** https://github.com/Abdullah-m7/qloo-mosaic
**Judge demo:** https://mosaic-agent-2026.onrender.com/ — DO NOT submit while it says sample mode.

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

## Why Qloo matters
Qloo is not a decorative API call. Its real entity discovery, audience-
relative rankings and optional tag evidence are inputs to the planner.
Without those inputs, MOSAIC cannot legitimately produce a live
evidence-backed agreement. Synthetic mode is labeled as an offline
illustration and must not be mistaken for the live judge experience.

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

**Submission status:** Draft only. Do not submit until the public Render
health endpoint reports `mode=live` and its planner returns verified
Qloo evidence with no secrets in logs or browser network responses.

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
