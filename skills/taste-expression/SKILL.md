---
name: taste-expression
description: Expression is Taste's learner. Use when the user wants new design taste, a greenfield interview, a requirement the Pack does not yet hold, a gap the artefacts cannot justify, or a correction to shipped or generated UI. Interview in the harness and persist each signal with taste_record_signal. Also use when taste_part_state derives Expression for the part being designed.
---

# Expression writes the Pack

Expression is the only learner. It interviews, walks requirements and corrections, and writes Decisions into the product repository's `taste/` Pack. Corrections on shipped or generated work are this same skill with trigger `gap` or `rejected_pass`. There is no separate Learner product and no mode field.

The harness conversation is the interview. Do not open a separate form, contact anyone else, or treat your assumptions as the user's answers.

## When this skill applies

Use Expression for a part when any of these are true:

- The product or the part is from scratch, or `taste_part_state` reports `no_decisions`.
- The user states new taste, a requirement, or a preference that is not already an accepted shipped Decision.
- `taste_part_state` derives Expression (`proposed`, `rejected`, `accepted_not_shipped`, `coverage_gap`, or `unparsed`).
- The user corrects shipped or generated UI, or rejects a pass.
- The loaded Decisions cannot justify the next UI step.

Other parts of the Pack stay as they are. Do not flip the whole Pack. Who should have started this interview is an open question; do not invent a nudge. If you are in this skill, write the signal.

## Walk the conversation

1. Call `taste_pack_inspect` and `taste_part_state` for the repository. Read Decisions that touch the part. If no Pack exists, run `taste-setup` first.
2. Ask one focused question at a time about the judgment that would change the UI: who it is for, the outcome, constraints, and what done looks like. Offer a few genuinely different options only when that helps the user choose.
3. Restate the signal in one sentence and ask the user to accept, revise, or reject it before marking it accepted.

## Persist before you leave the turn

Call `taste_record_signal` for every signal you discussed. Chat is not the Pack.

| Situation | `trigger` | `status` | Notes |
| --- | --- | --- | --- |
| Greenfield, new requirement, or interview answer | `interview` | `proposed` until the user accepts; `accepted` only after they confirm; `rejected` if they reject it | Reuse the same `id` when it is the same judgment. |
| Artefacts cannot justify the next step | `gap` | `proposed` unless the user already accepted a revised statement | Set `coverageGap` true and say what is missing in `coverageGapNote`. |
| User corrects shipped or generated UI | `rejected_pass` | `proposed` until they accept the revised statement | Update the same `id` for the same judgment. |

Leave `shippedEvidence` empty unless you actually inspected shipped UI for this Decision. Do not write a mode field. Do not copy the signal into a separate conformance or expression folder.

A proposed or gapped Decision is not Conformance. After writing, call `taste_part_state` again and tell the user which parts are Expression and which remain Conformance. Conformance is only an accepted Decision with shipped evidence and no coverage gap.

Whether UI for that part may be implemented before the Decision is accepted is an open question. Do not invent a ban, and do not treat implementation as acceptance. Record the status the user actually gave.

Keep rejected alternatives in the Decision's `alternatives` field when the user wants them remembered. Do not claim the Decision applies beyond its `scope`.
