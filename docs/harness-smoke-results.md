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
| No implicit setup | unverified | unverified | unverified |
| Explicit bounded setup | unverified | unverified | unverified |
| Resume in-progress or partial setup | unverified | unverified | unverified |
| Existing-Pack learning | unverified | unverified | unverified |
| Pack files changed | | | |
| Notes | | | |

## How to fill a column

1. Record the host version and the path you installed from (local checkout, marketplace, or `claude --plugin-dir`).
2. **Skills visible:** `yes` only if Taste’s skills showed up in that host’s skill list. Otherwise `no` or `unverified`.
3. **MCP server up:** `yes` only if the Taste server started and answered a tool call. Otherwise `no` or `unverified`.
4. **No implicit setup:** `pass` only if a routine UI task with no Pack creates no repository setup and offers `/taste-setup` separately.
5. **Explicit setup:** `pass` only if explicit setup inspected the repository first, chose a bounded scope, wrote evidence-backed product guidance, validated, and reported gaps.
6. **Resume:** `pass` only if interrupted setup preserves its accurate in_progress or usable_partial status and `/taste-setup` resumes without overwriting completed files.
7. **Existing-Pack learning:** `pass` only if reusable feedback updates the relevant existing checklist after host self-check, without a separate approval.
8. **Pack files changed:** list paths you saw change. Note that a routine task with no Pack should report `none observed`; leave blank if you did not look.

Automated `npm test` results do not fill this sheet. Package tests do not prove a GUI host loaded the plugin.
