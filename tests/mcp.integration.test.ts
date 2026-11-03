import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("bundled stdio MCP server initializes and serves Pack tools", async () => {
  const repositoryPath = await mkdtemp(path.join(os.tmpdir(), "taste-mcp-test-"));
  const serverPath = path.resolve("dist/server.js");
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    cwd: path.dirname(serverPath),
    env: { TASTE_LOG_LEVEL: "debug" },
    stderr: "pipe",
  });
  const client = new Client({ name: "taste-plugin-test", version: "1.0.0" });
  let diagnosticOutput = "";
  transport.stderr?.on("data", (chunk: Buffer) => {
    diagnosticOutput += chunk.toString();
  });

  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.deepEqual(
      tools.map((tool) => tool.name).sort(),
      [
        "taste_eval_get_generator_case",
        "taste_eval_get_judge_packet",
        "taste_eval_list_fixtures",
        "taste_pack_initialize",
        "taste_pack_inspect",
        "taste_pack_read",
        "taste_pack_validate",
        "taste_pack_write",
        "taste_mode_resolve",
        "taste_part_state",
        "taste_record_signal",
      ].sort(),
    );
    assert.equal(tools.find((tool) => tool.name === "taste_pack_write")?.annotations?.destructiveHint, true);
    assert.equal(tools.find((tool) => tool.name === "taste_record_signal")?.annotations?.destructiveHint, true);
    assert.match(tools.find((tool) => tool.name === "taste_pack_initialize")?.description ?? "", /rendered inspection of product UI/i);
    assert.match(tools.find((tool) => tool.name === "taste_pack_initialize")?.description ?? "", /Do not initialize if no product UI exists/i);
    assert.match(tools.find((tool) => tool.name === "taste_pack_initialize")?.description ?? "", /important auth coverage is blocked.*leave setupStatus=incomplete/i);

    const initialized = await client.callTool({
      name: "taste_pack_initialize",
      arguments: {
        repositoryPath,
        productName: "MCP Test Product",
        decisionPromotionCheckpoint: "After host checks and user approval, before push.",
      },
    });
    assert.equal(initialized.isError, undefined);

    const inspection = await client.callTool({
      name: "taste_pack_inspect",
      arguments: { repositoryPath },
    });
    assert.equal(inspection.isError, undefined);
    assert.match(JSON.stringify(inspection.structuredContent), /MCP Test Product/);
    assert.match(JSON.stringify(inspection.structuredContent), /After host checks and user approval, before push/);

    const skill = await readFile(path.join(repositoryPath, "taste/skills/product-design/SKILL.md"), "utf8");
    assert.match(skill, /starter is incomplete/);
    assert.match(skill, /Normal UI tasks must not create or refresh this Pack/);
    const incompleteValidation = await client.callTool({
      name: "taste_pack_validate",
      arguments: { repositoryPath },
    });
    assert.equal(incompleteValidation.isError, undefined);
    assert.match(JSON.stringify(incompleteValidation.structuredContent), /setup is incomplete/i);

    const early = await client.callTool({
      name: "taste_record_signal",
      arguments: {
        repositoryPath,
        id: "primary-button",
        title: "One filled primary button",
        statement: "Each screen has one filled primary button.",
        status: "proposed",
        trigger: "interview",
        scope: "settings",
      },
    });
    assert.equal(early.isError, true);
    let inspected = await client.callTool({ name: "taste_pack_inspect", arguments: { repositoryPath } });
    assert.match(JSON.stringify(inspected.structuredContent), /"decisionCount":0/);

    const ready = await client.callTool({
      name: "taste_record_signal",
      arguments: {
        repositoryPath,
        id: "primary-button",
        title: "One filled primary button",
        statement: "Each screen has one filled primary button.",
        status: "accepted",
        trigger: "interview",
        scope: "settings",
        validatedArtifact: "commit:abc123",
        validationEvidence: ["Host reports: settings tests and lint passed at commit abc123."],
        userApprovedArtifact: "commit:abc123",
        userApprovalEvidence: "Host reports: user approved commit abc123 and this Decision.",
      },
    });
    assert.equal(ready.isError, undefined);
    assert.match(JSON.stringify(ready.structuredContent), /accepted_not_shipped/);
    assert.match(await readFile(path.join(repositoryPath, "taste/skills/product-design/references/decisions/primary-button.md"), "utf8"), /Host reports: settings tests and lint passed/);

    const secondScope = await client.callTool({
      name: "taste_record_signal",
      arguments: {
        repositoryPath,
        id: "profile-heading",
        title: "Clear profile heading",
        statement: "Profile settings have a clear page title.",
        status: "accepted",
        trigger: "interview",
        scope: "profile",
        validatedArtifact: "commit:profile1",
        validationEvidence: ["Host reports: profile checks passed at commit profile1."],
        userApprovedArtifact: "commit:profile1",
        userApprovalEvidence: "Host reports: user approved commit profile1 and this Decision.",
      },
    });
    assert.equal(secondScope.isError, undefined);

    const shipped = await client.callTool({
      name: "taste_record_signal",
      arguments: {
        repositoryPath,
        id: "primary-button",
        title: "One filled primary button",
        statement: "Each screen has one filled primary button.",
        status: "accepted",
        trigger: "interview",
        scope: "settings",
        validatedArtifact: "commit:abc123",
        validationEvidence: ["Host reports: settings tests and lint passed at commit abc123."],
        userApprovedArtifact: "commit:abc123",
        userApprovalEvidence: "Host reports: user approved commit abc123 and this Decision.",
        shippedEvidence: ["https://example.test/settings — inspected deployed Settings flow"],
      },
    });
    assert.equal(shipped.isError, undefined);
    assert.match(JSON.stringify(shipped.structuredContent), /accepted_shipped/);

    const corrected = await client.callTool({
      name: "taste_record_signal",
      arguments: {
        repositoryPath,
        id: "primary-button",
        title: "One filled primary button",
        statement: "Each screen has one filled primary button. Two primaries failed review.",
        status: "proposed",
        trigger: "rejected_pass",
        scope: "settings",
      },
    });
    assert.equal(corrected.isError, true);

    const correctedFinal = await client.callTool({
      name: "taste_record_signal",
      arguments: {
        repositoryPath,
        id: "primary-button",
        title: "One filled primary button",
        statement: "Each screen has one filled primary button, with a clear success state.",
        status: "accepted",
        trigger: "rejected_pass",
        scope: "settings",
        validatedArtifact: "commit:abc456",
        validationEvidence: ["Host reports: corrected settings tests passed at commit abc456."],
        userApprovedArtifact: "commit:abc456",
        userApprovalEvidence: "Host reports: user approved the tested correction and Decision at commit abc456.",
      },
    });
    assert.equal(correctedFinal.isError, undefined);
    assert.match(JSON.stringify(correctedFinal.structuredContent), /accepted_not_shipped/);
    assert.doesNotMatch(await readFile(path.join(repositoryPath, "taste/skills/product-design/references/decisions/primary-button.md"), "utf8"), /https:\/\/example\.test\/settings/);

    const parts = await client.callTool({
      name: "taste_part_state",
      arguments: { repositoryPath, scope: "settings", taskIntent: "inspect_only" },
    });
    assert.equal(parts.isError, undefined);
    assert.match(JSON.stringify(parts.structuredContent), /accepted_not_shipped/);
    assert.match(JSON.stringify(parts.structuredContent), /settings/);

    const shippedCorrection = await client.callTool({
      name: "taste_record_signal",
      arguments: {
        repositoryPath,
        id: "primary-button",
        title: "One filled primary button",
        statement: "Each screen has one filled primary button, with a clear success state.",
        status: "accepted",
        trigger: "rejected_pass",
        scope: "settings",
        validatedArtifact: "commit:abc456",
        validationEvidence: ["Host reports: corrected settings tests passed at commit abc456."],
        userApprovedArtifact: "commit:abc456",
        userApprovalEvidence: "Host reports: user approved the tested settings update at commit abc456.",
        shippedEvidence: ["https://example.test/settings — host inspected the shipped settings update at commit abc456."],
      },
    });
    assert.equal(shippedCorrection.isError, undefined);

    const correctionRoute = await client.callTool({
      name: "taste_part_state",
      arguments: { repositoryPath, scope: "settings", taskIntent: "correction" },
    });
    assert.equal(correctionRoute.isError, undefined);
    const correctionState = correctionRoute.structuredContent as { scopes: Array<{ activity: string }>; taskRouting: { activity: string; intent: string } };
    assert.equal(correctionState.scopes[0]?.activity, "conformance");
    assert.deepEqual(correctionState.taskRouting, {
      scope: "settings",
      activity: "expression",
      intent: "correction",
      note: "The current task corrects existing UI or product guidance, so use Expression for this task even if the Pack contains Conformance Decisions.",
    });

    const directDecisionWrite = await client.callTool({
      name: "taste_pack_write",
      arguments: { repositoryPath, path: "skills/product-design/references/decisions/early.md", content: "# Early draft\n" },
    });
    assert.equal(directDecisionWrite.isError, true);

    const mode = await client.callTool({
      name: "taste_mode_resolve",
      arguments: { currentMode: "expression", trigger: "direction_accepted", userConfirmed: true, rationale: "The user accepted this direction for the product." },
    });
    assert.equal(mode.isError, undefined);
    assert.match(JSON.stringify(mode.structuredContent), /conformance/);

    const written = await client.callTool({
      name: "taste_pack_write",
      arguments: { repositoryPath, path: "skills/product-design/references/conformance/test.md", content: "# Tool write\n" },
    });
    assert.equal(written.isError, undefined);
    assert.match(await readFile(path.join(repositoryPath, "taste/skills/product-design/references/conformance/test.md"), "utf8"), /Tool write/);

    for (const [fixturePath, content] of [
      ["evals/rubric.md", "# Evaluation rubric\n\nUser-facing quality matters."],
      ["evals/conformance/fixtures/smoke/task.md", "Add visible progress and allow users to return to earlier answers."],
      ["evals/conformance/fixtures/smoke/before/index.html", "<main><h1>Preferences</h1></main>"],
      ["evals/conformance/fixtures/smoke/after/index.html", "<main><nav>Step 2 of 3 <a href=\"identity.html\">Edit identity</a></nav><h1>Preferences</h1></main>"],
    ]) {
      const fixtureWrite = await client.callTool({
        name: "taste_pack_write",
        arguments: { repositoryPath, path: fixturePath, content },
      });
      assert.equal(fixtureWrite.isError, undefined);
    }

    const generatorInput = await client.callTool({
      name: "taste_eval_get_generator_case",
      arguments: { repositoryPath, mode: "conformance", fixtureId: "smoke" },
    });
    assert.equal(generatorInput.isError, undefined);
    assert.doesNotMatch(JSON.stringify(generatorInput.structuredContent), /expectedAfter/);

    const judgePacket = await client.callTool({
      name: "taste_eval_get_judge_packet",
      arguments: {
        repositoryPath,
        mode: "conformance",
        fixtureId: "smoke",
        generatedOutput: [{ path: "index.html", content: "<main><progress value=2 max=3></progress></main>" }],
      },
    });
    assert.equal(judgePacket.isError, undefined);
    assert.match(JSON.stringify(judgePacket.structuredContent), /Edit identity/);
    assert.match(JSON.stringify(judgePacket.structuredContent), /generatedOutput/);

    assert.match(diagnosticOutput, /"event":"server_starting"/);
    assert.match(diagnosticOutput, /"event":"tool_started","tool":"taste_pack_inspect"/);
    assert.match(diagnosticOutput, /"event":"tool_completed","tool":"taste_pack_inspect","durationMs":\d+/);
    assert.match(diagnosticOutput, /"event":"tool_failed","tool":"taste_pack_write"[^\n]*"errorCode":"decision_write_requires_promotion"/);
    assert.doesNotMatch(diagnosticOutput, new RegExp(repositoryPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.doesNotMatch(diagnosticOutput, /MCP Test Product|After host checks|Add visible progress|generatedOutput/);
  } finally {
    await client.close().catch(() => undefined);
    await rm(repositoryPath, { recursive: true, force: true });
  }
});
