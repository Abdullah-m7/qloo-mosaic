# MOSAIC — technical decisions, evidence and boundaries

**Updated:** 16 October 2026
**Owner:** Abdullah-m7/qloo-mosaic · Qloo Agentic Hackathon only

## Why this is more than a recommendation chatbot
MOSAIC is a deterministic, evidence-gated cultural negotiation agent: it
discovers grounded candidates; ranks the **same available candidate list**
against two distinct public taste profiles; compares a one-sided plan,
an average-first plan and a lower-audience-maximizing plan; then generates
an auditable Cultural Bridge Agreement. A person can veto selections and
re-plan without re-fetching fresh preferences when the evidence cache is valid.

The agent also performs three **single-option veto counterfactuals**:
remove each chosen element once, then identify the best feasible alternative
from the SAME evidence. These are decision-sensitivity checks, not
measurements of venue availability or predicted human satisfaction.

## Qloo integration: real, bounded and server-only
The earlier pre-key implementation explored Qloo's MCP harness, but the
current isolated branch uses a dependency-free REST transport over the
official event API at `https://hackathon.api.qloo.com`.

- `GET /search`: resolve public film and artist taste anchors by their
  Qloo entity identifiers. A user may specify `Artist: Radiohead` or
  `Movie: Barbie (2023)` to constrain category/release-year identity.
- `GET /v2/insights`: discover artist/place/movie candidate sets, rank
  exactly matched options against each audience, and optionally retrieve
  cross-category tags.
- Only **mutually ranked options** enter the optimizer. Missing identities
  or insufficient matching ranks fail closed. Separate Qloo request scores
  are not presented as comparable probabilities.
- A shared cultural thread is only described as verified when an identical
  Qloo tag ID occurs across two or more chosen categories.
- Requests have bounded quotas, pacing, safe error mapping and an in-flight
  coalescing gate. Credentials are never sent to browser JavaScript, CI
  logs, exported documents or repository files.

## Scientific constraints and evaluation evidence
Offline deterministic tests exercise the optimizer but do not establish
measured product value. Real Qloo-backed exploratory holdout studies have
also been conducted, with detailed results held in **encrypted private
artifacts**. These studies **did not establish consistent preference
improvement**, human satisfaction, attendance impact or causal uplift.
It would be misleading to claim that maximin's guaranteed advantage on its
own in-sample objective validates real-world recommendation quality.

Do not state venue inventory, ticket prices, artist performance schedules,
screening rights, user demographics or individual taste profiles as known
from this tool.

## Production release status
The feature branch passed its local and GitHub Actions checks, including
a protected-key Qloo API smoke and temporary localhost HTTP judge smoke.
Its public Render counterpart remains separate, intentionally in synthetic
sample mode until its protected secret and deployment are independently
validated. The public release gate `npm run judge:check` refuses a sample
site and never needs a local copy of the provider key.

See `docs/JUDGE_RELEASE_GATE.md` and `docs/DEVPOST_DRAFT.md` for the
remaining judge access checks and draft submission story.
