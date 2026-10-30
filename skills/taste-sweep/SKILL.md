---
name: taste-sweep
description: Inspect a running product and its implementation to discover evidence-backed Conformance guidance. Use when the user asks to sweep, learn, or refresh a product's design taste; do not treat source-code inspection alone as a completed visual sweep.
---

# Sweep a product surface

The existing coding agent gathers and interprets evidence. Use the product's real browser or computer-use tools when available; Taste does not provide a browser or invent observations.

Inspect a focused flow in the running product: open the relevant pages, follow primary and important alternate paths, examine interaction states, and capture screenshots. Note URL/page, date, viewport, state/action, screenshot path/link, and what each capture demonstrates. Include responsive, empty, loading, validation, error, or success states when they are part of the selected flow. Then inspect corresponding source and available Git history, pull requests, reviews, design references, and corrections to distinguish current behavior from accepted rationale.

If product access, authentication, screenshot capture, or browser/computer tools are missing, ask the user/harness for the needed access or screenshots and mark the sweep incomplete until visual evidence is available. Never claim a page or state was inspected if it was not. Do not extract or store private production data without the user's authorization.

Draft only decisions supported by evidence. For each candidate, record:

- the decision and why it matters for the user;
- scope, triggering context, exceptions, and counterexamples;
- evidence links (screenshots/rendered states and code/review sources) with date/viewport where relevant;
- whether it is observed behavior, an inference, a known flaw, or an accepted product decision;
- confidence and evidence gaps.

Keep examples and known flaws beside the related product guidance. Ask the product owner to review inferred candidates before marking them accepted. Use `taste_pack_write` or the harness repository editor to update only the target `taste/` Pack, then validate it. Keep raw/private captures in the harness/plugin working store unless the user approves committing them.
