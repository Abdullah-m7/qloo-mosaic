# MOSAIC — 90-second judge walkthrough (candidate, 28 Oct 2026)

**Opening idea:** Most recommendations pick a winner. MOSAIC makes the cultural trade-off visible and auditable.

**Before showing the demo:** Use the [live Render Qloo experience](https://mosaic-agent-2026.onrender.com/), not the synthetic GitHub Pages preview. The existing public deployment has passed an actual anonymous Qloo release check. Open the page before the presentation and let the first Qloo evidence request finish; observed first plans took ~21–26 seconds, but responsiveness varies. Do not claim that a preloaded page is cold-start performance.

| Elapsed | Action on screen | What to say (English) |
| --- | --- | --- |
| 0–12s | Show first/second public taste communities | “An event organizer needs one cultural night for two different audiences. An average score can leave one audience out. We want to explain what each group gives up.” |
| 12–28s | Show the returned Qloo artist, place and film | “Qloo supplies real cultural entities and ranks the same options against each audience. These are evidence-backed planning candidates, **not bookings or predictions of satisfaction**.” |
| 28–43s | Change the one-sided/average-first comparator | “MOSAIC chooses a compromise that balances the lower ordinal rank proxy. This is relative ranking within a shortlist — **not a fairness guarantee or a calibrated probability**.” |
| 43–60s | Open the provider-tag-grounded thread and optional alternative | “When the exact same Qloo tag ID connects different categories, we can show a traceable link. If no matching evidence exists, MOSAIC says so instead of inventing cultural meaning.” |
| 60–74s | Reject a selected option, reveal the new choice and source trace | “A producer can veto this option. The agent renegotiates from cached Qloo evidence without spending extra Qloo calls.” |
| 74–84s | Click Copy decision brief | “The organizer can take away the selected options, public taste anchors, trade-offs, source evidence and implementation checks.” |
| 84–90s | Point to limitations and error/abstention state | “If evidence is insufficient, there is no fake recommendation. MOSAIC makes the boundaries of the decision explicit.” |

## Why this is an agentic use of Qloo

- Qloo discovery and independently ranked matched shortlists **materially determine** every live proposal. Without adequate Qloo evidence, the application abstains.
- A bounded controller chooses a plan and supports veto/replanning, contrasting alternatives and explaining provenance.
- Its source tags are returned by the actual Qloo provider. A shared ID indicates overlapping metadata, not cultural causation.
- Deterministic algorithms (maximin and Pareto filtering) are not novel by themselves; the differentiator is a transparent, negotiable **Cultural Bridge Agreement**.

## Three tough questions judges may ask

**“Where is the demonstrated real-world impact?”** The prototype produces a repeatable, inspectable decision brief and makes excluded options and ranking trade-offs visible. We have not measured organizer adoption, event attendance or improvements in human preference satisfaction. Those are future validation milestones.

**“Is this fairness?”** Not demographic or normative fairness. It is a specified optimization over each group's **ordinal rank proxies on the same shortlist**, with equal-weighted categories and coverage limitations. Retrieval can omit relevant options.

**“Does a common Qloo tag prove these activities belong together?”** No. It proves the same source tag ID is attached across the relevant Qloo entities. The organizer still has to determine creative appropriateness, booking availability, prices and rights.

## Release note

This walkthrough is prepared on the **isolated candidate branch**, not necessarily the version currently served by Render. Before a final Devpost submission, the owner must approve the deployment and recheck that the live URL and screenshot match that exact deployed code. There is no requirement to record a submission video under the verified contest rules, so this is a useful optional presentation script, not proof of a required artifact.
