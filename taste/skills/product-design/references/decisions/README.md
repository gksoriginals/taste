# Decisions

One Pack. Each other file in this directory is one Decision written by `taste_record_signal`. Do not author a mode field.

A Decision can be recorded only after the host reports a final artifact, its relevant validation evidence, and the user's approval of that same artifact and Decision. Taste stores the host's report; it does not run or judge checks or user review.

Derived activity for a Decision:

- **Conformance** when `status` is `accepted`, shipped evidence is present, there is no coverage gap, and promotion evidence is complete.
- **Expression** otherwise, including accepted but unshipped or Decisions missing promotion evidence.

During Expression, interviews, alternatives, corrections, and design feedback remain in the host's active task context. The host follows its own workflow, then records the finalized Decision at the optional `decisionPromotionCheckpoint` in `manifest.json`, if configured. The Pack does not flip as a whole.
