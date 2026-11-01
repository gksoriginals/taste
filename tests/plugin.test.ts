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
  const manifest = JSON.parse(await readFile(path.join(root, ".cursor-plugin/plugin.json"), "utf8")) as { name?: string; skills?: string; mcpServers?: string };
  const mcp = JSON.parse(await readFile(path.join(root, ".cursor.mcp.json"), "utf8")) as { mcpServers?: Record<string, { command?: string; args?: string[]; cwd?: string }> };
  assert.equal(manifest.name, "taste");
  assert.equal(manifest.skills, "./skills/");
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
  assert.equal(manifest.version, "0.1.0");
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
