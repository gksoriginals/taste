# v1 validation results

**Run date:** 2026-10-30

**Purpose:** Verify the Taste evaluation workflow with a synthetic fixture. This is tooling validation, not evidence that Taste improves a real product.

## Paired smoke run

- Task: make an account setup preferences step show progress and allow users to revise earlier answers.
- Starting state and expected state: the synthetic `account-setup-progress` Conformance fixture in `examples/product-pack/taste/evals/`.
- Generator arms: two independent contexts started from the same before state. One received the fixture's progress/revision/stable-action guidance; the baseline received no Taste guidance.
- Judge: a fresh higher-capacity GPT-6.1 Astra context received both outputs, expected state, and Rubric, scored outputs independently before comparing them, and was not given arm identity.

## Finding

The Judge scored the Taste-guided output vs baseline as: user-facing quality 3/3, task completion 2/3, product-rule application 2/3, and expected-work alignment 2/3. It preferred the baseline because its progress indicator matched the expected second-of-three step. Both outputs showed progress and offered a Back control, but neither made revision functional. The Taste-guided output invented a four-step count, which contradicted the fixture. Neither result demonstrated stable action placement across multiple flow screens.

This result confirms that the paired packet and separate Judge workflow can expose an implementation gap and over-inference. It does not support a product-level conclusion: the fixture is synthetic, the guidance is synthetic, and only one task/run was scored. The expected state itself does not implement navigation or test rendered behavior. Use shipped examples, accepted reviews, realistic holdouts, and human-calibrated Rubrics before drawing product conclusions.
