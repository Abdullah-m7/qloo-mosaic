# Design decisions and falsification plan

## Why this is not another recommendation chatbot
The core interaction is a negotiation across two different sets of public, user-selected taste anchors. Users can veto an option, inspect candidate evidence IDs, and compare the resulting worst-off group against a majority-first heuristic.

## Qloo's role
The intended live chain uses the event-approved Qloo MCP tools:
- qloo_recommend: explore cross-domain candidate sets grounded in both audiences' chosen anchor entities.
- qloo_rank: rank **the same** candidate set separately for each audience.
- qloo_capabilities: verify live access before any call.

Scores from separate Qloo calls cannot be compared directly; our planner turns full, identical lists into **relative ordinal rank percentiles**. These proxies are not absolute affinity and should not be interpreted as probabilities.

## Synthetic evidence
The default fixtures intentionally create a conflict, making trade-offs easy to inspect. Synthetic benchmarks are *unit tests and demonstrations*, never evidence of actual audience behavior.

## Falsification checklist (once the API key arrives)
1. Verify Qloo's returned entity identifiers and rank response schemas.
2. Run live tool calls with a few public, unambiguous entity anchors only.
3. Require complete matching result sets from both group rankings.
4. Record bounded query budgets and rate limit; never scrape or export bulk Qloo data.
5. Compare maximin vs. majority-first on held-out **Qloo-derived candidate sets**, not the synthetic fixtures.
6. Stress-test conflicting public anchors, empty results, geographic filters, ambiguity, missing/partial tool results, and vetoes.
7. Verify results are not presented as personal inference, stereotyping, real prices, performer availability, or attendance forecasts.
8. Run the public hosted demo through a clean browser and test Qloo calls without leaking credentials.
