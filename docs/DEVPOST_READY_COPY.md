# MOSAIC — Devpost submission copy (READY FOR OWNER REVIEW, NOT SUBMITTED)

**Project name:** MOSAIC — Common Ground, by Design

**Tagline:** Two audiences. One cultural night. A compromise grounded in Qloo evidence.

**Live app:** https://mosaic-agent-2026.onrender.com/

**Open-source repository:** https://github.com/Abdullah-m7/qloo-mosaic (MIT)

**Built by:** Abdullah Almohammedi (solo)

---

## Inspiration

An event producer is bringing two communities into one room. A recommendation engine can pick the most popular option, but it rarely tells the organizer whose preferences were sidelined, what a compromise costs, or whether the suggested connection between activities is traceable to actual cultural data.

**MOSAIC treats the outcome as a negotiable decision, not an opaque top-ten list.**

## What it does

Enter two sets of publicly known cultural taste anchors (artists or movies) and a city. MOSAIC uses **Qloo's actual cultural knowledge graph** to discover and rank an artist, place and film-themed experience. It presents a **Cultural Bridge Agreement**: one proposed three-part event, with provider-backed entity IDs, the audience trade-offs and a decision trace.

An organizer can:

- Compare the balanced plan with one-audience-first and average-first alternatives, using the same Qloo-grounded candidate set.
- Explore the exact two-audience **Pareto frontier**, previewing trade-offs without making additional Qloo calls.
- Reject an option and obtain a replacement from previously cached Qloo evidence.
- Inspect a cross-category cultural thread **only** when the same Qloo-supplied tag ID appears on entities from different categories. An optional alternate agreement can use that source-supported link within a five-percentage-point rank-proxy trade-off.
- Copy an actionable decision brief, including public anchors, selected items, provenance, trade-offs and the real-world checks still required.

If Qloo cannot resolve an anchor or rank sufficient common options, MOSAIC **abstains instead of inventing a cultural recommendation**.

## How Qloo makes this possible

Qloo is not an added flavor of metadata. Its Search and Insights calls determine the candidate entities, separate audience rankings, explainability metadata and any source tag intersection. The planner cannot legitimately produce a live agreement without those grounded inputs. Its matching, ranking, evidence gating and bounded replanning are implemented in Node.js against the event-specific Qloo REST API; the key stays server-side.

The core selection criterion is a **maximin balance of relative ordinal rank proxies** over the mutually ranked shortlist. These numbers are *not* calibrated probabilities, measures of demographic fairness, customer satisfaction or predicted attendance.

## Engineering, challenges and accomplishments

MOSAIC is a hosted, working web application with responsive desktop/mobile UI; a dependency-light Node.js backend; a bounded Qloo request controller; request coalescing and visitor rate limits; short-lived evidence caching; source-provenance checks; and explicit failure handling. The public MIT-licensed repository includes executable tests and instructions.

The principal challenge was using separate Qloo ranking calls without falsely treating their scores as directly comparable. We compare ranks of the **same shortlisted options** instead. A second challenge was avoiding invented cultural explanations: shared labels are not enough; the tag ID must match exactly across different categories.

The anonymous production release check passed on **October 28, 2026**, verifying a live three-category, Qloo-backed plan, an actual provider-tag thread, cached veto replanning, and invalid-input refusal. A real mobile/desktop browser walk-through also returned three Qloo-backed cards and working veto interaction. These are product-function checks, **not evidence of measured real-world uplift**.

## Who it serves and what's next

Potential users include community-event organizers, festival programmers and cultural-marketing teams who must defend a choice to groups with different tastes. The tangible output is an inspectable decision brief, not a claim of automated booking or demonstrated audience acceptance.

Future validation should measure whether organizers make clearer and faster decisions, and seek authorized inventory/licensing integrations. The prototype does **not** reserve artists or venues, verify film rights, provide live prices or claim to know individual attendees.

---

**Judge quickstart:** Open the **live Render app** (not the separately labeled synthetic GitHub Pages preview). The default public taste anchors are preloaded. Allow the first Qloo plan to finish, then inspect the cards and decision trace, switch the comparison, explore the cultural thread, reject a card and observe the cached replan. The initial Qloo request may take 20–30 seconds or vary with cold starts. No login is required.

**Submission status:** Draft only, not entered on Devpost. The live Render release `8a7a297` was deployed and browser-verified on 28 October 2026. Review this copy against the exact public experience before submitting; **owner approval for Devpost submission is still required**.
