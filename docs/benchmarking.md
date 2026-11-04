# Benchmark Taste

Use the [evaluation skill](../skills/taste-evaluate/SKILL.md) to run the tasks in the host. Keep local outputs and run records under `.taste-eval-runs/` or an approved host store. The report command validates records and computes paired differences. The host runs the agents, captures rendered evidence, and obtains independent scores.

| Question | Baseline | Candidate |
| --- | --- | --- |
| Does Taste improve a product task? | Host with ordinary repo context | Same host with Taste and the relevant Pack |
| Does one skill improve the result? | Same Pack and tools without the candidate skill | Same conditions with the candidate skill |
| Does one tool improve the workflow? | Same guidance with the current tool configuration | Change only the tool under test |
| Does a lesson transfer? | Use a decision replay for diagnosis, or an arm without the captured lesson for attribution | Fresh host with the saved lesson, including an applicable case and a nearby exception |

Start with one development fixture, then use independently selected holdouts before drawing product-level conclusions. Pin the starting state and keep the task, model, effort, and other capabilities comparable. Record actual skill loads and tool calls. Keep judge-only references out of generator workspaces. Give the independent reviewer unlabeled outputs and the same rubric before revealing the arms. Existing rendered UI and accepted work are evidence. Use observable acceptance criteria when several designs can succeed.

For product tasks, score task completion, product judgment, and rendered quality separately. For skill and tool comparisons, also collect task-specific evidence such as successful tool calls, recovery from errors, or duration. Use the same criteria for both arms. Score each dimension from 0 to 3, where 0 is a failed criterion, 1 is a material gap, 2 meets the criterion with a minor gap, and 3 fully meets it. If a criterion cannot be verified, record the deviation and omit it from both arms. Review paired differences alongside evidence. Keep exploratory runs distinct from holdouts.

## Record and report

Save one JSON file per completed pair. This fabricated example illustrates the format.

```json
{
  "fixture": "admin-login-feedback",
  "inputRevision": "fixture-revision",
  "split": "development",
  "harness": "host and version",
  "generator": "model and settings",
  "judge": "independent reviewer or judge model",
  "comparison": "Taste and Pack versus ordinary repo context",
  "baseline": {
    "artifact": "baseline/output",
    "loadedGuidance": [],
    "toolsUsed": [],
    "scores": {
      "feedbackPlacement": {"score": 1, "evidence": "A toast was used for malformed email."}
    }
  },
  "candidate": {
    "artifact": "candidate/output",
    "loadedGuidance": ["taste/skills/product-design/SKILL.md"],
    "toolsUsed": ["taste_pack_inspect"],
    "scores": {
      "feedbackPlacement": {"score": 3, "evidence": "Browser check confirmed an inline field error."}
    }
  },
  "deviations": [],
  "followUp": ["Replay a request-level failure to check the exception."]
}
```

```sh
npm run eval:report -- .taste-eval-runs/admin-login-feedback.json
```

Run `npm test` to check the bundled MCP tools and example fixtures before a benchmark. The committed account setup fixture is suitable for a smoke run. For the first real-product benchmark, choose a bounded product surface with an applicable rule and a nearby exception. Keep private product records local.
