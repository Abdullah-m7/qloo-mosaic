# MOSAIC — Judge demo playbook

## First 15 seconds
Two audiences. One cultural night. Most recommendations prioritize a large group or optimize an overall average; MOSAIC explicitly negotiates a shared plan based on evidence, not generic popularity.

## Show live data, not only a pretty interface
Choose public music and film entities for Group A and B. For a film with multiple namesakes, show the optional release-year syntax (`Movie: Barbie (2023)`), or use `Artist: Radiohead` to specify a category without inventing an entity ID. Enter a real location. Explain that Qloo discovers a shared candidate set and independently ranks identical options for each group. Present actual Qloo entity identifiers, not generic LLM-generated suggestions.

## Demonstrate the nontrivial decision
Compare the same candidate sets under three objectives: Group A-first, total-average, and maximize the lower group-preference proxy. Show the trade-off in both group rankings. Avoid calling ordinal rank percentiles satisfaction probabilities.

## Demonstrate the negotiation frontier
Open **The Negotiation Frontier**, move the dial from a Group-B-leaning compromise to a Group-A-leaning alternative, and inspect the exact artist, place and film labels and Qloo evidence identifiers. Point out the highlighted maximin plan and the independent **rank-blind alphabetical choice on the same discovered entities**. Explain that this is a sensitivity visualization of ordinal ranks, not independent evidence of human satisfaction or superior held-out performance. Previewing requires zero additional Qloo calls.

## Trace Qloo's own explanation
On the live three-category plan, expand the per-item `QLOO SOURCE CONTRIBUTIONS` rows for both audiences. These show only public input anchors matched against the provider's `query.explainability` records. If an item has no provider-level explanation, point out the explicit unavailable state. Do not call normalized contribution scores predicted satisfaction, attendee probabilities, or causality.

## Demonstrate adaptation
Reject the first option; show another feasible plan or an explicit insufficient-evidence outcome. Undo the veto. Change the public cultural anchor or search location and show a different real Qloo-grounded result.

## Stress-test the cultural agreement
Show the three single-option removal stress cards: artist, place and film experience. Explain which alternative the deterministic optimizer chooses and how the lower group-relative rank proxy moves. Apply a veto from the card, then show the cached live re-plan. Explicitly state these are same-evidence counterfactuals, not real booking or attendance forecasts.

## Prove engineering rigor
Show source provenance, no untrusted raw personal data, clean API-key isolation, test suite, an intentionally failing no-credential mode, and the independent public GitHub repository.

## Final 15 seconds
Qloo is load-bearing: without its taste graph, MOSAIC cannot discover and evaluate genuine shared cultural choices. The offline synthetic demo only checks the optimization mechanism. Honest limitations: no ticket inventory, price quotes, causal preference prediction, or evidence of actual human attendance.

## Competition logistics
Submission deadline: October 30 2026, 11:45pm EDT (October 31, 06:45 in Riyadh).
Public app must stay accessible until November 16.
Video is optional per official current challenge page; a live public app and open-source repository are required.

## Agent behavior to demonstrate (after Render live-secret provisioning)
Show the Qloo tool trace: discover, a single alternate discovery step only if evidence is sparse, two rankings of the SAME candidate set, then maximin negotiation. Reject a recommendation and show a cache-backed replan with zero additional Qloo calls. If results are incomplete, show a clear abstention rather than a confident but invented suggestion. These are testable behaviors, not claims of actual audience satisfaction.
