import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { Ajv2020 } from "ajv/dist/2020.js";
import pluginSchema from "../schemas/agent-plugins/1.0.0/plugin.schema.json" with { type: "json" };
import mcpSchema from "../schemas/agent-plugins/1.0.0/mcp.schema.json" with { type: "json" };

const root = process.cwd();

test("portable root manifests conform to the vendored Agent Plugins 1.0 schemas", async () => {
  const plugin = JSON.parse(await readFile(path.join(root, "plugin.json"), "utf8")) as unknown;
  const mcp = JSON.parse(await readFile(path.join(root, "mcp.json"), "utf8")) as {
    mcpServers?: Record<string, { type?: string; command?: string; args?: string[]; cwd?: string }>;
  };
  const ajv = new Ajv2020({ strict: false });
  const validatePlugin = ajv.compile(pluginSchema);
  const validateMcp = ajv.compile(mcpSchema);

  assert.equal(validatePlugin(plugin), true, JSON.stringify(validatePlugin.errors));
  assert.equal(validateMcp(mcp), true, JSON.stringify(validateMcp.errors));
  assert.deepEqual(mcp.mcpServers?.taste, {
    type: "stdio",
    command: "node",
    args: ["${PLUGIN_ROOT}/dist/server.js"],
    cwd: "${PLUGIN_ROOT}",
  });
});

test("Claude Code compatibility manifest points to the shared MCP package", async () => {
  const manifest = JSON.parse(await readFile(path.join(root, ".claude-plugin/plugin.json"), "utf8")) as { name?: string; mcpServers?: string };
  const mcp = JSON.parse(await readFile(path.join(root, ".claude.mcp.json"), "utf8")) as { mcpServers?: Record<string, { args?: string[] }> };
  assert.equal(manifest.name, "taste");
  assert.equal(manifest.mcpServers, "./.claude.mcp.json");
  assert.deepEqual(mcp.mcpServers?.taste?.args, ["${CLAUDE_PLUGIN_ROOT}/dist/server.js"]);
});

test("Cursor compatibility manifest uses Cursor-specific plugin root expansion", async () => {
  const manifest = JSON.parse(await readFile(path.join(root, ".cursor-plugin/plugin.json"), "utf8")) as { name?: string; skills?: string; commands?: string; mcpServers?: string };
  const mcp = JSON.parse(await readFile(path.join(root, ".cursor.mcp.json"), "utf8")) as { mcpServers?: Record<string, { command?: string; args?: string[]; cwd?: string }> };
  assert.equal(manifest.name, "taste");
  assert.equal(manifest.skills, "./skills/");
  assert.equal(manifest.commands, "./cursor/commands/");
  assert.equal(manifest.mcpServers, "./.cursor.mcp.json");
  assert.deepEqual(mcp.mcpServers?.taste, {
    command: "node",
    args: ["${CURSOR_PLUGIN_ROOT}/dist/server.js"],
    cwd: "${CURSOR_PLUGIN_ROOT}",
  });
});

test("Codex compatibility manifest routes to its plugin-root MCP config and Skills", async () => {
  const manifest = JSON.parse(await readFile(path.join(root, ".codex-plugin/plugin.json"), "utf8")) as {
    name?: string;
    version?: string;
    skills?: string;
    mcpServers?: string;
  };
  const mcp = JSON.parse(await readFile(path.join(root, ".mcp.json"), "utf8")) as {
    mcpServers?: Record<string, { type?: string; command?: string; args?: string[]; cwd?: string }>;
  };
  assert.equal(manifest.name, "taste");
  assert.equal(manifest.version, "0.2.0");
  assert.equal(manifest.skills, "./skills/");
  assert.equal(manifest.mcpServers, "./.mcp.json");
  assert.deepEqual(mcp.mcpServers?.taste, {
    type: "stdio",
    command: "node",
    args: ["./dist/server.js"],
    cwd: "./",
  });
});

test("Codex repo marketplace points to the root portable package", async () => {
  const marketplace = JSON.parse(await readFile(path.join(root, ".agents/plugins/marketplace.json"), "utf8")) as {
    name?: string;
    plugins?: Array<{ name?: string; source?: { source?: string; path?: string }; policy?: { installation?: string; authentication?: string }; category?: string }>;
  };
  const taste = marketplace.plugins?.find((entry) => entry.name === "taste");
  assert.equal(marketplace.name, "taste-local");
  assert.equal(taste?.source?.source, "local");
  assert.equal(taste?.source?.path, "./");
  assert.equal(taste?.policy?.installation, "AVAILABLE");
  assert.equal(taste?.policy?.authentication, "ON_INSTALL");
});

test("setup remains explicit while Expression saves clear feedback as scoped guidance", async () => {
  const setup = await readFile(path.join(root, "skills/taste-setup/SKILL.md"), "utf8");
  const sweep = await readFile(path.join(root, "skills/taste-sweep/SKILL.md"), "utf8");
  const design = await readFile(path.join(root, "skills/taste-design/SKILL.md"), "utf8");
  const command = await readFile(path.join(root, "cursor/commands/taste-setup.md"), "utf8");

  assert.match(setup, /If no product UI or UI source exists, do not create a generic Pack/i);
  assert.match(setup, /starter Pack.s listed surfaces are hints only/i);
  assert.match(setup, /source_reviewed.*rendered_flow/s);
  assert.match(setup, /usable_partial/);
  assert.match(setup, /continue with other in-scope apps and source review/i);
  assert.match(setup, /complete.*every ID in the confirmed `setupScope.requiredCoverage`/s);
  assert.match(setup, /Select representative, consequential journeys/);
  assert.match(setup, /preserve the most accurate status if interrupted/i);
  assert.match(setup, /continue with other in-scope apps and source review/i);
  assert.match(setup, /They are optional evidence of intended design/i);
  assert.match(setup, /Ask for design-source access only when it materially improves the agreed scope/i);
  assert.match(setup, /ask once for safe access when it materially improves coverage/i);
  assert.match(setup, /Never request production credentials or store credentials, tokens, or real personal data/i);
  assert.match(setup, /Inventory user-facing apps, routes, entry points, navigation, journeys/i);
  assert.match(setup, /without manually touring every URL/i);
  assert.match(setup, /Label evidence `rendered`, `source_reviewed`, `design_reference`, or `inference`/i);
  assert.match(setup, /Leave readily visible state, inventories, routine defects, and startup recipes/i);
  assert.match(setup, /durable product judgment/);
  assert.match(setup, /link to code, lint, docs, existing instructions, or rendered behavior/i);
  assert.match(setup, /If intent is unclear and consequential, ask the user/i);
  assert.match(setup, /do not require a guidance file or manifest row for every route/i);
  assert.match(setup, /guidance created\/updated, audit findings separately/i);
  assert.match(setup, /For a required journey left `not_inspected`, record attempts too/i);
  assert.match(setup, /Never store credentials, tokens, or real personal data/i);
  assert.match(setup, /New-product design can proceed as Expression/i);
  assert.match(sweep, /Figma is optional/i);
  assert.match(sweep, /Ask once for safe access/i);
  assert.match(sweep, /likely future value justifies their context cost/);
  assert.match(sweep, /Do not require every route to be toured/i);
  assert.match(design, /A new direction, correction, or greenfield surface is Expression work and can proceed without a prior Pack/);
  assert.match(design, /If no Pack exists, do not start a product-wide sweep/i);
  assert.match(design, /create a minimal, evidence-backed Pack for that surface/i);
  const expression = await readFile(path.join(root, "skills/taste-expression/SKILL.md"), "utf8");
  assert.match(expression, /preserving the existing setup status, policy, scope, required coverage, and other coverage entries/);
  assert.match(expression, /If no Pack exists, initialize a shell/);
  assert.match(expression, /include it in the matching manifest coverage/);
  assert.match(command, /Inventory repository apps, routes, journeys, design sources/i);
  assert.match(command, /If a journey is blocked, record its gap/i);
  assert.match(command, /Save a Pack item only when future work is likely to need it/i);
  assert.match(command, /required journeys marked `not_inspected`/i);
  assert.match(command, /source evidence can support useful partial guidance/i);
  assert.match(command, /Never request production credentials or store secrets or real user data/i);
});

test("guidance preserves useful rationale, and UI work briefs before check-and-repair", async () => {
  const readSkill = (name: string) => readFile(path.join(root, "skills", name, "SKILL.md"), "utf8");
  const [expression, design, conformance, setup, sweep, pack] = await Promise.all([
    readSkill("taste-expression"),
    readSkill("taste-design"),
    readSkill("taste-conformance"),
    readSkill("taste-setup"),
    readSkill("taste-sweep"),
    readSkill("taste-pack"),
  ]);

  for (const skill of [setup, pack]) {
    assert.match(skill, /unresolved alternatives/i);
  }
  assert.match(setup, /include rationale or rejected options when they add durable knowledge/i);
  assert.match(pack, /Include rationale or rejected options when they preserve knowledge/);
  assert.match(expression, /cite evidence and distinguish observed behavior, inference, and settled intent/i);
  assert.match(sweep, /Do not add route descriptions, coverage rows, word quotas/i);
  assert.match(sweep, /Do not apply a “failures only” rule/i);
  for (const skill of [design, conformance]) {
    assert.match(skill, /task-local brief before editing product files/);
    assert.match(skill, /Keep the change only if the checker shows improvement or no regression/);
    assert.match(skill, /checkSummaries\.before/);
  }
  assert.match(expression, /Keep the change only if the checker shows improvement or no regression/);
  assert.match(expression, /checkSummaries\.before/);
  assert.match(design, /checkSummaries\.before` and `checkSummaries\.after`/);
});

test("Claude Code marketplace installs the root plugin, and the Cursor-only command stays out of the auto-loaded commands/ directory", async () => {
  const marketplace = JSON.parse(await readFile(path.join(root, ".claude-plugin/marketplace.json"), "utf8")) as {
    name?: string;
    owner?: { name?: string };
    plugins?: Array<{ name?: string; source?: string; version?: string }>;
  };
  const plugin = JSON.parse(await readFile(path.join(root, ".claude-plugin/plugin.json"), "utf8")) as { version?: string };
  const taste = marketplace.plugins?.find((entry) => entry.name === "taste");
  assert.equal(marketplace.name, "taste");
  assert.ok(marketplace.owner?.name);
  assert.equal(taste?.source, "./");
  assert.equal(taste?.version, plugin.version);
  await assert.rejects(() => readFile(path.join(root, "commands/taste-setup.md"), "utf8"), /ENOENT/);
});

test("setup starts the product before recording a block and records what it actually saw", async () => {
  const setup = await readFile(path.join(root, "skills/taste-setup/SKILL.md"), "utf8");
  const sweep = await readFile(path.join(root, "skills/taste-sweep/SKILL.md"), "utf8");
  const command = await readFile(path.join(root, "cursor/commands/taste-setup.md"), "utf8");
  for (const text of [setup, sweep, command]) {
    assert.match(text, /memory or notes for this repository/);
    assert.match(text, /statesObserved/);
    assert.match(text, /accessAttempts/);
    assert.match(text, /test accounts/);
  }
  assert.match(setup, /A stopped local dependency is a step to take, not a gap to record/);
  assert.match(setup, /requiredStates/);
  assert.match(setup, /migrationNeeded/);
  assert.match(setup, /simulator, emulator/);
  assert.match(setup, /which source wins on conflict/);
  assert.match(setup, /Evaluation fixtures and rubrics are optional/);
  assert.match(setup, /Say plainly whether any populated state was rendered/);
});
