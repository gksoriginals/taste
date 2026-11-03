import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import pluginSchema from "../schemas/agent-plugins/1.0.0/plugin.schema.json" with { type: "json" };
import mcpSchema from "../schemas/agent-plugins/1.0.0/mcp.schema.json" with { type: "json" };

const root = process.cwd();
const readJson = async <T>(relativePath: string): Promise<T> => JSON.parse(await readFile(path.join(root, relativePath), "utf8")) as T;
const issues: string[] = [];

const plugin = await readJson<Record<string, unknown>>("plugin.json");
const portableMcp = await readJson<{ mcpServers?: Record<string, { type?: string; command?: string; args?: string[]; cwd?: string }> }>("mcp.json");
const codexManifest = await readJson<{ name?: string; version?: string; skills?: string; mcpServers?: string }>(".codex-plugin/plugin.json");
const codexMcp = await readJson<{ mcpServers?: Record<string, { type?: string; command?: string; args?: string[]; cwd?: string }> }>(".mcp.json");
const claudeManifest = await readJson<{ name?: string; mcpServers?: string }>(".claude-plugin/plugin.json");
const claudeMcp = await readJson<{ mcpServers?: Record<string, { command?: string; args?: string[] }> }>(".claude.mcp.json");
const cursorManifest = await readJson<{ name?: string; skills?: string; commands?: string; mcpServers?: string }>(".cursor-plugin/plugin.json");
const cursorMcp = await readJson<{ mcpServers?: Record<string, { command?: string; args?: string[]; cwd?: string }> }>(".cursor.mcp.json");
const codexMarketplace = await readJson<{ name?: string; plugins?: Array<{ name?: string; source?: { source?: string; path?: string }; policy?: { installation?: string; authentication?: string }; category?: string }> }>(".agents/plugins/marketplace.json");

const ajv = new Ajv2020({ strict: false });
const validatePlugin = ajv.compile(pluginSchema);
const validateMcp = ajv.compile(mcpSchema);
if (!validatePlugin(plugin)) issues.push(`plugin.json: ${JSON.stringify(validatePlugin.errors)}`);
if (!validateMcp(portableMcp)) issues.push(`mcp.json: ${JSON.stringify(validateMcp.errors)}`);
if (claudeManifest.name !== plugin.name) issues.push("Claude Code and portable plugin names must match.");
if (claudeManifest.mcpServers !== "./.claude.mcp.json") issues.push("Claude Code manifest must point to its native MCP config.");
if (cursorManifest.name !== plugin.name || cursorManifest.skills !== "./skills/" || cursorManifest.commands !== "./commands/" || cursorManifest.mcpServers !== "./.cursor.mcp.json") {
  issues.push("Cursor manifest must point to shared Skills, explicit commands, and Cursor-specific MCP config.");
}
if (codexManifest.name !== plugin.name || codexManifest.version !== plugin.version) issues.push("Codex and portable plugin identity/version must match.");
if (codexManifest.skills !== "./skills/" || codexManifest.mcpServers !== "./.mcp.json") issues.push("Codex compatibility manifest must point to the root Skills and Codex MCP config.");
const codexEntry = codexMarketplace.plugins?.find((entry) => entry.name === plugin.name);
if (codexEntry?.source?.path !== "./" || codexEntry.source.source !== "local") issues.push("Codex marketplace must point at the root portable plugin using a local path.");
if (codexMarketplace.name !== "taste-local" || !codexEntry?.policy?.installation || !codexEntry.policy.authentication || !codexEntry.category) {
  issues.push("Codex marketplace entry must include its name, installation/authentication policy, and category.");
}

const portableServer = portableMcp.mcpServers?.taste;
if (
  portableServer?.type !== "stdio" ||
  portableServer.command !== "node" ||
  portableServer.args?.[0] !== "${PLUGIN_ROOT}/dist/server.js" ||
  portableServer.cwd !== "${PLUGIN_ROOT}"
) {
  issues.push("Portable MCP config must run the bundled server from PLUGIN_ROOT.");
}
const codexServer = codexMcp.mcpServers?.taste;
if (
  codexServer?.type !== "stdio" ||
  codexServer.command !== "node" ||
  codexServer.args?.[0] !== "./dist/server.js" ||
  codexServer.cwd !== "./"
) {
  issues.push("Codex MCP config must run the bundled server from PLUGIN_ROOT.");
}
const claudeServer = claudeMcp.mcpServers?.taste;
if (claudeServer?.command !== "node" || claudeServer.args?.[0] !== "${CLAUDE_PLUGIN_ROOT}/dist/server.js") {
  issues.push("Claude MCP config must resolve the bundled server from CLAUDE_PLUGIN_ROOT.");
}
const cursorServer = cursorMcp.mcpServers?.taste;
if (cursorServer?.command !== "node" || cursorServer.args?.[0] !== "${CURSOR_PLUGIN_ROOT}/dist/server.js" || cursorServer.cwd !== "${CURSOR_PLUGIN_ROOT}") {
  issues.push("Cursor MCP config must resolve the bundled server from CURSOR_PLUGIN_ROOT.");
}
if (!(await stat(path.join(root, "dist/server.js")).then((item) => item.isFile()).catch(() => false))) {
  issues.push("dist/server.js is missing; run npm run build before packaging the plugin.");
}

const setupCommand = await readFile(path.join(root, "commands/taste-setup.md"), "utf8").catch(() => null);
if (!setupCommand || !/^name:\s*taste-setup\s*$/m.test(setupCommand.match(/^---\s*\n([\s\S]*?)\n---/m)?.[1] ?? "")) {
  issues.push("commands/taste-setup.md must define the explicit Taste setup command.");
}

const skillDirectories = await readdir(path.join(root, "skills"), { withFileTypes: true });
let skillCount = 0;
for (const directory of skillDirectories.filter((entry) => entry.isDirectory())) {
  const relativePath = path.join("skills", directory.name, "SKILL.md");
  const contents = await readFile(path.join(root, relativePath), "utf8").catch(() => null);
  if (!contents) {
    issues.push(`${relativePath} is missing.`);
    continue;
  }
  const frontmatter = contents.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/)?.[1];
  if (!frontmatter) {
    issues.push(`${relativePath} must have YAML frontmatter.`);
    continue;
  }
  const name = frontmatter.match(/^name:\s*(\S+)\s*$/m)?.[1];
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (name !== directory.name) issues.push(`${relativePath} name must match its directory (${directory.name}).`);
  if (!description) issues.push(`${relativePath} must have a description.`);
  skillCount += 1;
}

if (issues.length > 0) {
  for (const issue of issues) console.error(`✗ ${issue}`);
  process.exitCode = 1;
} else {
  console.log(`Plugin package valid: ${skillCount} Skills, Agent Plugins 1.0, Codex marketplace, Cursor compatibility, and Claude Code compatibility.`);
}
