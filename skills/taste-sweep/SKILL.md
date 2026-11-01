---
name: taste-sweep
description: Sweep an existing product's shipped UI into the Taste Pack. Use when the user asks to learn, sweep, extract, or refresh design taste from a product that already has interface. Writes proposed Decisions with taste_record_signal trigger sweep. A code-only pass is not a finished visual sweep.
---

# Sweep shipped UI into Decisions

The harness coding agent gathers evidence. Taste does not ship a browser and does not invent observations.

1. If `taste/` is missing, follow `taste-setup` first. Then call `taste_pack_inspect` and `taste_part_state` so you update the part you are sweeping instead of flipping the Pack.
2. Inspect one focused flow in the running product with the harness's browser or computer-use tools. Open the pages, follow the primary path and important alternates, and capture screenshots. Note URL or page, date, viewport, state, and what each capture shows. Include empty, loading, error, and success states when they belong to the flow.
3. Correlate with source, Git history, reviews, and design references when the user has made them available. If access or screenshots are missing, ask and mark the sweep incomplete. Never claim a screen was seen if it was not. Do not store private production data without authorization.
4. For each candidate judgment, call `taste_record_signal`:
   - `trigger`: `sweep`
   - `status`: `proposed`
   - `shippedEvidence`: the screenshot path, URL, or source you actually inspected
   - `scope`: the part this judgment belongs to
   - `statement`, `rationale`, and `knownFlaws` when the shipped UI looks accidental or wrong
   - `coverageGap` true only for a step the artefacts cannot justify; say why in `coverageGapNote`
5. Do not set `status` to `accepted` during a sweep. Acceptance is a review by the product owner. Do not write a mode field. Do not create `references/conformance/` or `references/expression/` for a new Pack.
6. Call `taste_pack_validate` and `taste_part_state`. Report proposed Decisions, known flaws, and gaps. Parts stay Expression until a Decision is accepted, has shipped evidence, and has no coverage gap.

Who reviews a proposed Decision into acceptance is an open question. Record the proposal and stop there unless the user explicitly accepts the statement in this conversation. If they do, update the same `id` to `accepted` and keep the shipped evidence.
