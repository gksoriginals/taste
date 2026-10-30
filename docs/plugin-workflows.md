# Taste workflow triggers

Taste's portable commands are named Skills in the Agent Plugins package. This keeps workflow definitions shared across harnesses; each harness can expose them through its own skill picker or invocation syntax. Agent Plugins packages provide Skills and MCP. Cursor's separate native plugin format also supports a distinct `commands/` directory, but Taste does not maintain a second copy of workflow instructions there. [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins), [Cursor plugin reference](https://cursor.com/docs/reference/plugins), [Claude Code Skills](https://code.claude.com/docs/en/skills).

| Workflow | Activation | User intent and result |
| --- | --- | --- |
| `taste-setup` | Explicit setup/install request; manual invocation | Prepare the target repository Pack, select a first surface, perform or arrange the visual sweep, and establish both mode routes. |
| `taste-sweep` | Explicit request to learn, sweep, or refresh product taste; manual invocation | Inspect the running product with browser/computer tools plus code and available history; draft evidence-backed candidates and mark gaps. |
| `taste-design` | Automatically for UI/UX work when Taste is installed; also manually invokable | If a Pack exists, read its entry Skill, resolve task mode, load focused guidance, implement/review, and report evidence. If no Pack exists, offer setup instead of inventing product guidance. |
| `taste-conformance` | Explicit Conformance request or product Skill resolves established-direction work | Apply accepted product decisions and inspect rendered behavior as the task requires. |
| `taste-expression` | Explicit request to explore/establish/change direction, or product Skill resolves new-direction intent | Interview the user through the harness, develop options, obtain confirmation, and record the accepted decision. |
| `taste-evaluate` | Explicit evaluation request or deliberate guidance-calibration work | Run paired with/without-Skill attempts and delegate independent judging to the harness's higher-capacity model. |

## Mode resolution

The product entry Skill owns product-specific triggers and examples. The coding agent interprets the user's request and current context, then passes a structured trigger to `taste_mode_resolve`. The resolver deterministically maps that signal to Conformance, Expression, or a focused question. It does not inspect raw language, use keyword rules, or infer product meaning. An explicit user mode request is honored. A direction moves from Expression to Conformance only after the user confirms it as product guidance. Mode is task-local; resolving a mode does not permanently change the product's global state.

The Pack should contain both mode routes before routine UI work begins. Setup asks whether to establish Expression intent through a harness interview now; it can leave that direction unestablished if the user defers or has not chosen one, but it must label that state rather than fabricate product taste. Once setup produces the product entry Skill and its routes, `taste-design` should load them automatically for later UI/UX work in that repository.

If user intent is mixed, the Pack lacks relevant evidence, or the user has not accepted a proposed direction, ask through the harness before committing to the affected choice. Do not silently fall back to whichever mode is easiest.
