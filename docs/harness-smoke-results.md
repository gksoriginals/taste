# Harness smoke results

**Status: unverified.** Every cell below is empty on purpose. This file is a template, not a test report. Fill a host only after you run [harness-smoke-test.md](harness-smoke-test.md) in that host. Leave `unverified` anywhere you did not observe the behavior yourself. Do not copy the expected steps in as results.

Procedure: [harness-smoke-test.md](harness-smoke-test.md).

| Field | Cursor | Claude Code | Codex |
| --- | --- | --- | --- |
| Host version | | | |
| Date (UTC) | | | |
| Tester | | | |
| Install path | | | |
| Skills visible | unverified | unverified | unverified |
| MCP server up | unverified | unverified | unverified |
| Whole-product bootstrap | unverified | unverified | unverified |
| Conversation learning | unverified | unverified | unverified |
| Pack files changed | | | |
| Notes | | | |

## How to fill a column

1. Record the host version and the path you installed from (local checkout, marketplace, or `claude --plugin-dir`).
2. **Skills visible:** `yes` only if Taste’s skills showed up in that host’s skill list. Otherwise `no` or `unverified`.
3. **MCP server up:** `yes` only if the Taste server started and answered a tool call. Otherwise `no` or `unverified`.
4. **Whole-product bootstrap:** `pass` only if the host mapped all user-facing surfaces, created a tailored task-and-surface router plus focused references/checklists/metadata, self-checked it, and initialized without asking for a separate human approval. `fail` or `unverified` otherwise.
5. **Conversation learning:** `pass` only if a user correction changed the UI and updated a relevant checklist after host self-check, without a separate review or promotion request. `fail` or `unverified` otherwise.
6. **Pack files changed:** list paths you saw change (for example `taste/manifest.json`, a surface reference, or a checklist). Write `none observed` if you finished the run and the Pack did not change. Leave blank if you did not look.

Automated `npm test` results do not fill this sheet. Package tests do not prove a GUI host loaded the plugin.
