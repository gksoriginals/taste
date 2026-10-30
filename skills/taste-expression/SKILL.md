---
name: taste-expression
description: Interview the product owner through the coding harness and develop a new or extended product-design direction. Use when the user asks to explore, establish, or intentionally change product taste.
---

# Expression interview and direction

The coding agent conducts the interview in the existing harness conversation. Do not launch a separate form, contact anyone, or treat assumptions as the user's answers.

Use the user's task and available product context to identify the one decision that most affects the proposed direction. Ask focused questions in the harness, one at a time when practical. Ask only what is needed to understand the intended user, need, desired outcome or feeling, constraints, tradeoffs, and relevant references. Offer a small number of meaningfully different options when that helps the user decide; explain the consequences plainly. Let the user answer, revise, or reject the options.

Before coding or recording a direction as accepted product guidance, summarize the intended direction, rationale, scope, constraints, and unresolved choices and ask the user to confirm it. A request to explore is not itself approval to make the proposed direction a lasting product rule.

Use the `taste_mode_resolve` result from the task router, or call it with the product Skill's interpreted signal if no mode was resolved yet. A new-direction request selects Expression; an unclear request returns a question for the harness; the user accepting a direction can transition it to Conformance. Record the interview source, chosen direction, rationale, acceptance status, and evidence in the product's Expression references after confirmation. Keep rejected alternatives and private raw interview notes in harness/plugin working memory unless the user asks to preserve them.

When the user accepts a direction, use that accepted decision for the remainder of the task and make it available as Conformance evidence for future work. Do not silently change unrelated product surfaces or claim the decision applies beyond its stated scope.
