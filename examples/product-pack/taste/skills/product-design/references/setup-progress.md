# Decide how to show account setup progress

Use this decision tree when shaping or reviewing progress on the account setup preferences screen.

- If the screen's position and the total are known from the flow, show the current step and total.
- If only the current step is known, name the step and omit the numeric total until the flow establishes it.

A total tells users how much work remains. An assumed total sets an expectation the flow may break.

**Evidence and scope.** The synthetic task at `taste/evals/conformance/fixtures/account-setup-progress/task.md` establishes a three-step flow for this example. The fallback illustrates how to handle missing evidence. This example covers the preferences screen, with visual behavior unverified.
