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
| Greenfield flow | unverified | unverified | unverified |
| Correction flow | unverified | unverified | unverified |
| Pack files changed | | | |
| Notes | | | |

## How to fill a column

1. Record the host version and the path you installed from (local checkout, marketplace, or `claude --plugin-dir`).
2. **Skills visible:** `yes` only if Taste’s skills showed up in that host’s skill list. Otherwise `no` or `unverified`.
3. **MCP server up:** `yes` only if the Taste server started and answered a tool call. Otherwise `no` or `unverified`.
4. **Greenfield flow:** `pass` only if a repo with no `taste/` stayed without a Pack during exploration, then gained a Pack and Decision after you approved the exact tested artifact. `fail` if that did not happen. `unverified` if you did not run it.
5. **Correction flow:** `pass` only if a change to an existing conforming part used a task-local Expression route (`taskIntent: correction`) and left the old Decision unchanged until you approved the tested artifact. `fail` or `unverified` otherwise.
6. **Pack files changed:** list the paths you saw change (for example `taste/manifest.json`, a Decision file). Write `none observed` if you finished the run and the Pack did not change. Leave the cell blank if you did not look.

Automated `npm test` results do not fill this sheet. Package tests do not prove a GUI host loaded the plugin.
