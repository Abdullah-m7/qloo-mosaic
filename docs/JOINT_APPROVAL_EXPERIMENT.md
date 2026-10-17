# MOSAIC · Two representatives, one accountable concept

**Isolated prototype, 17 October 2026**
**Branch:** `experiment/joint-approval-20261017`
**Status:** NOT deployed, NOT submitted to Devpost, NOT evidence of real-world approval.

## Specific job
Two representatives programming one cultural activation from different
public taste contexts jointly approve a concept **before** any venue
booking or commercial commitment. MOSAIC uses Qloo entity discovery,
two independently evaluated group rank lists, the same Qloo-traceable
candidate identities and transparent ordinal trade-offs. No organizer
identity, personal attendance data, account or signature is collected.

## Interaction contract
- Each group may protect one already-grounded candidate observed in the
  plan or its Pareto-frontier alternatives. The protected candidate
  MUST appear in subsequent plans.
- If two protected IDs are incompatible because they occupy one
  category, or a protected ID is simultaneously vetoed, the solver
  returns `no_feasible_plan` without overriding either representative.
- The optimizer recomputes the best feasible agreement under the
  constraints using the original same-context Qloo evidence cache.
- A **same-evidence protection-impact certificate** shows the exact loss
  in the lower group-relative ordinal rank proxy caused by constraints,
  compared with the unconstrained solution. It is not satisfaction.
- A and B click independent approval buttons, each explicitly scoped
  to the displayed plan and constraints on one device.
- **Every new plan request, veto, protected-choice change, changed
  public input or budget adjustment invalidates both approvals.**
- Only a jointly reviewed proposal may be copied using the new approval
  action. A separate generic proposal brief is never labeled as approved.
- Approvals live only inside this browser session: they do not
  identify people, represent legally binding signatures, confirm ticket
  availability or claim actual audience acceptance.

## Qloo event API invariant
The isolated server and standard live Qloo REST resolver remain bounded
and fail closed. Cache-backed replan accepts a `required` list of at most
two canonical candidate IDs. Missing/rejected/ambiguous evidence blocks
the plan. The optional matched-provider-tag Cultural Thread alternative
must also obey the same protections, without new Qloo calls.

## What will make this worth releasing
1. Real event-key-backed localhost HTTP smoke passes baseline plan,
   protected-choice cached replan and protected-veto contradiction with
   zero extra provider calls.
2. Automated and Chrome visual tests pass for desktop and mobile,
   including approval invalidation, conflict recovery and no horizontal
   overflow.
3. Product story can be demonstrated in 45–60 seconds **without**
   claiming authentic two-party participation from a solo developer.
4. Future independent approval study versus a competent no-Qloo
   control remains necessary before claiming positive human outcomes.

## Current separation rules
Do not merge this experiment to `main`, deploy via Render, alter the
other connected service NeatRescue, leak the event key, or send Devpost
submission before the user explicitly approves. Keep the live
`mosaic-agent-2026` release untouched.
