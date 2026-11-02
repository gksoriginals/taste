# Harness smoke test

Use this procedure after installing Taste in a host. Run it in a disposable product repository if you do not want to touch a real project. These steps verify tool/Skill routing and Pack writes; they do not certify visual quality.

## Greenfield flow

1. Start with a product repository that has no `taste/` directory. Ask for a UI task in natural language, such as: “Help me design a settings screen and interview me about the direction. Keep the Pack unchanged while we explore.”
2. Give feedback and iterate. An early “I like this direction” response should prompt the host to continue implementation and checks; it should not initialize or update the Pack.
3. Ask the host to finish the UI and run the product repository’s existing checks. Review the tested version.
4. Approve the exact tested artifact. That approval authorizes the host to initialize the Pack if needed and record the reusable Decision automatically, without a second Pack-write confirmation.
5. Inspect `taste/manifest.json`, the product entry Skill, and the new Decision. Confirm the Decision references the same artifact the host validated and that its validation and user-approval evidence match.

## Existing-Pack correction

1. Create or use a product Pack with a Decision that has validation, user-approval, and inspected shipped evidence, so the part currently derives to Conformance.
2. Ask the host to change that part of the UI, for example: “Make this screen simpler and remove repeated explanations.”
3. Confirm the host calls `taste_part_state` with the affected scope and `taskIntent: correction`. The result should keep the durable Pack state visible while adding a task-local Expression route.
4. Iterate and run the product’s existing checks. Confirm the old Decision remains unchanged while the design is in progress.
5. Approve the exact tested artifact. Confirm the host updates the related Decision automatically. If the artifact reference changed, verify its prior shipped evidence was cleared. Conformance should return only after the updated work is shipped and inspected.

## Diagnostics

To enable detailed server diagnostics, set `TASTE_LOG_LEVEL=debug` in the Taste MCP server environment for the host under test. Check the host’s MCP/server logs for startup, tool names, duration, and stable error codes. Diagnostic output uses stderr and excludes tool arguments, Pack contents, conversation text, and repository paths.

## Record the result

For each host, record its version, install path, whether the Taste Skills appeared, whether the MCP server started, whether both flows routed correctly, and whether the expected Pack files changed. Write that in [harness-smoke-results.md](harness-smoke-results.md). Leave every cell `unverified` until you have run the steps directly in that host. Do not copy the expected behavior into the sheet as if it were a result.
