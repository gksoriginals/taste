import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("bundled stdio MCP server exposes Pack and evaluation tools", async () => {
  const repositoryPath = await mkdtemp(path.join(os.tmpdir(), "taste-mcp-test-"));
  const traceDirectory = path.join(repositoryPath, "local-traces");
  const runId = randomUUID();
  const serverPath = path.resolve("dist/server.js");
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    cwd: path.dirname(serverPath),
    env: { TASTE_LOG_LEVEL: "debug", TASTE_TRACE_DIR: traceDirectory },
    stderr: "pipe",
  });
  const client = new Client({ name: "taste-plugin-test", version: "1.0.0" });
  let diagnosticOutput = "";
  transport.stderr?.on("data", (chunk: Buffer) => { diagnosticOutput += chunk.toString(); });

  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((tool) => tool.name).sort(), [
      "taste_eval_get_generator_case",
      "taste_eval_get_judge_packet",
      "taste_eval_list_fixtures",
      "taste_pack_initialize",
      "taste_pack_inspect",
      "taste_pack_read",
      "taste_pack_validate",
      "taste_pack_write",
      "taste_session_record",
    ].sort());
    assert.equal(tools.find((tool) => tool.name === "taste_pack_write")?.annotations?.destructiveHint, true);

    const initialized = await client.callTool({
      name: "taste_pack_initialize",
      arguments: { repositoryPath, productName: "MCP Test Product" },
    });
    assert.equal(initialized.isError, undefined);
    const inspection = await client.callTool({ name: "taste_pack_inspect", arguments: { repositoryPath, runId } });
    assert.equal(inspection.isError, undefined);
    assert.match(JSON.stringify(inspection.structuredContent), /MCP Test Product/);

    const skill = await readFile(path.join(repositoryPath, "taste/skills/product-design/SKILL.md"), "utf8");
    assert.match(skill, /starter is not product guidance/);
    const incompleteValidation = await client.callTool({ name: "taste_pack_validate", arguments: { repositoryPath } });
    assert.equal(incompleteValidation.isError, undefined);
    assert.match(JSON.stringify(incompleteValidation.structuredContent), /setup is in progress/i);

    const written = await client.callTool({
      name: "taste_pack_write",
      arguments: { repositoryPath, path: "skills/product-design/references/checklists/lesson.md", content: "# Reusable lesson\n" },
    });
    assert.equal(written.isError, undefined);
    assert.match(await readFile(path.join(repositoryPath, "taste/skills/product-design/references/checklists/lesson.md"), "utf8"), /Reusable lesson/);

    for (const [fixturePath, content] of [
      ["evals/rubric.md", "# Evaluation rubric\n\nUser-facing quality matters."],
      ["evals/conformance/fixtures/smoke/task.md", "Add visible progress and allow users to return to earlier answers."],
      ["evals/conformance/fixtures/smoke/before/index.html", "<main><h1>Preferences</h1></main>"],
      ["evals/conformance/fixtures/smoke/after/index.html", "<main><nav>Step 2 of 3 <a href=\"identity.html\">Edit identity</a></nav><h1>Preferences</h1></main>"],
    ]) {
      const result = await client.callTool({ name: "taste_pack_write", arguments: { repositoryPath, path: fixturePath, content } });
      assert.equal(result.isError, undefined);
    }

    const generatorInput = await client.callTool({
      name: "taste_eval_get_generator_case",
      arguments: { repositoryPath, taskApproach: "conformance", fixtureId: "smoke" },
    });
    assert.equal(generatorInput.isError, undefined);
    assert.doesNotMatch(JSON.stringify(generatorInput.structuredContent), /expectedAfter/);

    const judgePacket = await client.callTool({
      name: "taste_eval_get_judge_packet",
      arguments: {
        repositoryPath,
        taskApproach: "conformance",
        fixtureId: "smoke",
        generatedOutput: [{ path: "index.html", content: "<main><progress value=2 max=3></progress></main>" }],
      },
    });
    assert.equal(judgePacket.isError, undefined);
    assert.match(JSON.stringify(judgePacket.structuredContent), /Edit identity/);

    const trace = {
      runId,
      inputRevision: "fixture-revision",
      task: "Review progress feedback",
      surface: "Account setup",
      guidanceRead: ["product-design/SKILL.md"],
      guidanceApplied: [],
      decision: "Keep progress tied to the actual flow",
      verification: [{ kind: "source", result: "Checked the fixture", artifacts: ["index.html"] }],
      artifacts: ["index.html"],
      feedback: { status: "pending" },
    };
    const recorded = await client.callTool({ name: "taste_session_record", arguments: trace });
    assert.equal(recorded.isError, undefined);
    const file = (recorded.structuredContent as { file: string }).file;
    assert.equal(path.dirname(file), traceDirectory);
    const saved = JSON.parse(await readFile(file, "utf8"));
    assert.equal(saved.schemaVersion, 1);
    assert.equal(saved.runId, runId);
    assert.equal(saved.decision, trace.decision);
    if (process.platform !== "win32") assert.equal((await stat(file)).mode & 0o777, 0o600);

    const followUp = await client.callTool({
      name: "taste_session_record",
      arguments: { ...trace, feedback: { status: "accepted" } },
    });
    assert.equal(followUp.isError, undefined);
    assert.notEqual((followUp.structuredContent as { file: string }).file, file);
    assert.equal(JSON.parse(await readFile(file, "utf8")).feedback.status, "pending");
    assert.ok(diagnosticOutput.split("\n").some((line) =>
      line.includes('"tool":"taste_pack_inspect"') && line.includes(`"runId":"${runId}"`)));
    assert.doesNotMatch(diagnosticOutput, /Keep progress tied to the actual flow/);

    assert.match(diagnosticOutput, /"event":"server_starting"/);
    assert.match(diagnosticOutput, /"event":"tool_completed","tool":"taste_pack_inspect","durationMs":\d+/);
    assert.doesNotMatch(diagnosticOutput, new RegExp(repositoryPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.doesNotMatch(diagnosticOutput, /MCP Test Product|Add visible progress|generatedOutput/);
  } finally {
    await client.close().catch(() => undefined);
    await rm(repositoryPath, { recursive: true, force: true });
  }
});
