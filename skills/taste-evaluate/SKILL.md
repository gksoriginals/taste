---
name: taste-evaluate
description: Use when the user explicitly requests an evaluation or when deliberately calibrating product Skills; replay a learned decision in a fresh context or compare with/without-Skill outputs using a separate higher-capacity Judge.
---

# Evaluate Taste guidance

The harness owns task execution and model delegation. Taste supplies fixture access, evaluation instructions, and product Rubrics.

## Decision replay

Use this lightweight diagnostic when checking whether a lesson transfers across sessions. Capture one scoped, reusable decision from an actual correction or product evidence and label its provenance. In a fresh host context, give the agent the task and repository without supplying the answer or the guidance path. Use an applicable case and a nearby case where the guidance should lead to a different choice or should be skipped.

Keep a local trace outside the Pack with the task and input revision, files actually loaded, decision and rationale for each case, rendered or source checks, and any reviewer correction. Distinguish a routing miss, a misread or overgeneralized rule, and an implementation or verification failure. Label any manually activated skill, missing access, or other deviation. A replay checks transfer under those conditions. Use the paired protocol below to measure improvement over a baseline.

## Paired evaluation

1. Start with one high-leverage product surface where Git history, reviews, shipped UI, or user corrections show repeated design decisions. Ask the user/harness to obtain access to required Git history, design sources, or production data; do not assume access or invent evidence. Record the source and any access gaps.
2. Build a fixture from a shipped example: task, before-state files, expected-after files, relevant product guidance, and a Rubric. Record why the expected result is accepted and any known flaws. Mark whether the fixture is a development example or a holdout. Holdouts should be sampled from different examples or time periods where practical, and their expected edits must remain out of generator context.
3. Run two comparable generator attempts from clean copies of the same before state: one with the selected Taste Skill and its relevant references, one without the Taste Skill. Keep the coding harness, model, user task, tools, repository state, and effort similar where practical. Record the harness/model, task, input state identifier, skills and references actually loaded, tool/context differences, outputs, and any deviations. Do not have the baseline load Taste guidance indirectly.
4. After both outputs are fixed, create a fresh Judge context using the harness's higher-capacity subagent. For each output independently, provide the task, generated files, expected-after state (including holdout answers), and Rubric using `taste_eval_get_judge_packet`. The Judge must not be the generator's same-context self-review. If the harness cannot delegate to a higher-capacity model, stop and report the missing capability; do not claim a same-context score is equivalent.
5. Ask the Judge to score each output separately on user-facing quality, product-rule correctness, and similarity to accepted shipped work, with evidence for each score. Similarity does not reward reproducing a known flaw. Hide arm labels until individual scores and reasoning are recorded where practical, then compare paired results.
6. Preserve the fixture ID, mode, run date, with/without outputs, loaded-guidance trace, harness/model and conditions, Judge model, per-dimension scores and cited evidence, protocol deviations, and human adjudication in harness/plugin working memory outside the versioned Taste Pack. Share a summary with the product owner. A score is evidence for improving guidance, not automatic approval of a rule.

The separation between generator and Judge is a harness-managed context boundary, not a security boundary: a model that can read the fixture files could access the expected result. Keep the Judge's packet out of generator context by workflow, and record any leakage or protocol deviation. Keep evaluation artifacts derived from private production data in the approved local/plugin working store and do not commit them to the Pack unless the product owner approves sharing.
