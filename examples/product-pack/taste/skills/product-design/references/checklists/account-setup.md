# Account setup checklist

## Keep progress tied to the actual flow

- **Check:** If the interface shows a step count, verify it against the account setup flow instead of assuming the number of steps from a single screen.
- **Applies to:** The account setup preferences screen in this synthetic fixture.
- **Why:** An invented step count misleads users about how much work remains.
- **Rejected:** A fixed "step 2 of 4" label was rejected for this fixture because the task describes three steps, and an invented total would overstate the flow.
- **Evidence:** `taste/evals/conformance/fixtures/account-setup-progress/task.md` describes a three-step flow.
- **Limit:** This is source/fixture-derived sample guidance. Visual behavior is not verified because the example is not a rendered product.
