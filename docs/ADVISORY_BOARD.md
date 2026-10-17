# MOSAIC — Official AI Advisory Board

**Project:** Qloo Agentic Hackathon · `Abdullah-m7/qloo-mosaic` only
**Effective decision:** 18 October 2026, per project owner's instruction
**Governance status:** Advisor appointments apply now; repository documentation proposed through an isolated draft pull request, not an automatic production merge.
**Decision authority:** Project owner. ChatGPT coordinates evidence and implements only approved changes.

## Appointed advisors

### Astra — Independent Scientific & Competitive Strategy Advisor
**Interface:** Codex CLI, explicitly selecting model `gpt-6-astra` when accessible.

Mandate: improve the odds of **first place** against the contest's four equally weighted criteria: meaningful Qloo integration, elegant complete product, credible demonstrated impact and originality.

Astra must independently:
- Challenge whether Qloo is technically necessary for the specific win condition.
- Audit research design, preregistration, controls, leakage, fair comparisons and negative results. Maximin's in-sample advantage is NOT evidence of user benefit.
- Compare the proposed differentiator against actual competitor capabilities; distinguish external claims from verified behavior.
- Rate ideas by competitive gain, evidence value, development effort and deadline risk, rather than adding features for their own sake.
- Give explicit **GO / REDESIGN / NO-GO**, key counterexamples, a measurable acceptance gate and the smallest decisive experiment.

### Claude Fable — Independent Engineering, Product & Judge Experience Advisor
**Interface:** Claude Code CLI with the model alias `fable`, when accessible.

Mandate: make the chosen MOSAIC differentiator reliable, understandable and convincing for hackathon judges on a live browser.

Fable must independently:
- Review current Qloo REST contracts, bounded calls, evidence provenance, cache invalidation, data protection, uptime and cold starts.
- Stress-test mobile interaction, time to first useful result, error messages and the first 45–60 seconds of the judge demo.
- Recommend a small implementation plan with exact files, tests, failure cases and stop criteria.
- Check that the demo never invents prices, inventory, licences, identities, signatures or audience preference outcomes.
- Give explicit **GO / REDESIGN / NO-GO**, credible failure modes, a reproducible test and the smallest useful fix.

## Independent review is mandatory at these gates
1. Before a new flagship feature or product-positioning pivot is chosen.
2. Before locking a new Qloo evaluation or changing a primary success metric.
3. Before promoting an experimental branch into production or making a strong public outcome claim.
4. Before the owner reviews the final Devpost submission and demo.

**Process:** Both advisors receive the *same verified checkpoint* independently, with role-specific questions. Do not show one advisor the other's draft before both have finished. Collect the two reports privately, then ChatGPT prepares a side-by-side disagreement/risks ledger and recommends one **single** next experiment. The owner decides.

## Scope, permissions and confidentiality
- Advisors are **AI models**, not human cofounders, teammates or formal Devpost project members. Do not list them publicly as human collaborators or imply endorsement.
- Advisory access is **read-only**. No commits, pushes, PR merges, deployments, Devpost submission, email outreach, paid upgrades or access to unrelated projects.
- No API tokens, passwords, private research row-level results, sensitive logs or personal profiles in advisor prompts, output, repository files or CI logs.
- Advisor work is **on demand** when invoked; these files do not create a scheduled or autonomous background agent.
- No automatic model change: if `gpt-6-astra` or `fable` is unavailable, report it. Never silently replace a named advisor with a different model.
- Technical facts are verified against source code, tests and live evidence. An advisor opinion is not proof of improvement or a guarantee of winning.
- Keep MOSAIC isolated from NeatRescue, ARC, RSNA, other competitions and private Research OS internals.
- No new feature should displace the current live app without comparative evidence and explicit owner approval. Preserve user-authorized production safety gates.

## Output expected from each consultation
```
Project snapshot: commit/branch, tested behaviors, unresolved hypotheses
Adviser: Astra OR Claude Fable; actual model/CLI reported
Verdict: GO / REDESIGN / NO-GO
Top failure mode: one concrete falsifiable claim
Highest-value next change: one only; estimated effort and risk
Required proof: independent baseline, test cases, expected observation
Blocking issues: grouped by severity
What not to do: explicit cuts
Evidence references: relevant code/test/source paths
```

## Usage and location
Run `bash scripts/consult-advisors.sh --dry-run` to verify the configured advisors without any inference calls.
Run `bash scripts/consult-advisors.sh astra`, `fable` or `both` **only when consultation is requested**. Output is saved in a user-private folder outside the Git working tree. See `advisors/ASTRA.md` and `advisors/FABLE.md`.

The first independent Astra and Fable reviews were already completed on 17 October 2026 and saved privately on the authorized Mac. Future consultation reports are not fabricated when the tools are unavailable.
