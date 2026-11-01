# Evaluation rubric

The higher-capacity Eval Judge runs through the coding harness in a fresh context from the generator. Assess each generated output independently before comparing paired arms. Cite concrete evidence from the generated files and expected result.

Score each dimension from 1 to 5 (1 = fails the task or conflicts with supported direction; 3 = partly meets it with material gaps; 5 = meets it strongly without material gaps):

- **User-facing quality:** Does the experience serve the task and user need?
- **Task completion:** Does the implementation actually deliver the requested behavior, not just its appearance?
- **Product-rule correctness:** Does it apply the relevant Decisions and shared facts?
- **Accepted-work alignment:** Where expected shipped work is available, does the result reflect the useful accepted decisions? Similarity must not reward known flaws or omissions.

Call out unverified behavior, missing evidence, and protocol deviations separately. Human review calibrates this Rubric and adjudicates uncertain judgments. Scores are evidence for Pack improvement, not automatic approval of a guidance change.

Fixture lanes under `evals/conformance/` and `evals/expression/` are historical directories for the eval tools. They are not Pack modes.
