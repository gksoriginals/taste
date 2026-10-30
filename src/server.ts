import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  getEvaluationGeneratorCase,
  getEvaluationJudgePacket,
  initializePack,
  inspectPack,
  listEvaluationFixtures,
  readPackFile,
  TasteError,
  validatePack,
  writePackFile,
  type TasteMode,
} from "./core/pack.js";

const repositoryPath = z.string().min(1).describe("Absolute path to the target product repository, obtained from the host harness.");
const mode = z.enum(["conformance", "expression"]);

function success(data: object) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data as Record<string, unknown>,
  };
}

function failure(error: unknown) {
  const message = error instanceof TasteError ? error.message : "Taste could not complete this operation. Check the repository path and Pack, then retry.";
  return { isError: true, content: [{ type: "text" as const, text: message }] };
}

async function toolResult<T extends object>(operation: () => Promise<T>) {
  try {
    return success(await operation());
  } catch (error) {
    return failure(error);
  }
}

export function createTasteServer(): McpServer {
  const server = new McpServer({ name: "taste", version: "0.1.0" });

  server.registerTool(
    "taste_pack_initialize",
    {
      title: "Initialize a Taste Pack",
      description: "Create a non-overwriting starter Taste Pack under <repositoryPath>/taste for a product. It creates shared, Conformance, Expression, metadata, and evaluation starter files; it does not edit AGENTS.md, inspect product data, or configure the harness. Call only after the user requests or agrees to initialization.",
      inputSchema: {
        repositoryPath,
        productName: z.string().min(2).max(120).describe("Product name for the starter Pack."),
        surfaces: z.array(z.string().min(1).max(100)).max(30).optional().describe("Known product surfaces to record in the Pack manifest."),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ repositoryPath: root, productName, surfaces }) => toolResult(async () => initializePack(root, productName, surfaces)),
  );

  server.registerTool(
    "taste_pack_inspect",
    {
      title: "Inspect a Taste Pack",
      description: "Summarize the target repository's Taste Pack, supported modes, references, evaluation fixtures, and structural validation status. This reads only the repository's taste/ directory.",
      inputSchema: { repositoryPath },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root }) => toolResult(async () => inspectPack(root)),
  );

  server.registerTool(
    "taste_pack_read",
    {
      title: "Read Taste Pack guidance",
      description: "Read one Markdown or JSON file by a path relative to the target repository's taste/ directory. Paths are confined to that Pack.",
      inputSchema: {
        repositoryPath,
        path: z.string().min(1).max(300).describe("Pack-relative path, such as skills/product-design/SKILL.md."),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root, path: relativePath }) => toolResult(async () => readPackFile(root, relativePath)),
  );

  server.registerTool(
    "taste_pack_write",
    {
      title: "Write Taste Pack guidance",
      description: "Create or replace one bounded text file inside the target repository's taste/ Pack. This cannot write harness instructions or files outside the Pack. Use for product knowledge and evaluation fixtures; product judgment and acceptance remain with the host agent and user.",
      inputSchema: {
        repositoryPath,
        path: z.string().min(1).max(300).describe("Pack-relative destination path."),
        content: z.string().max(256 * 1024).describe("UTF-8 file contents, up to 256 KiB."),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root, path: relativePath, content }) => toolResult(async () => writePackFile(root, relativePath, content)),
  );

  server.registerTool(
    "taste_pack_validate",
    {
      title: "Validate Taste Pack structure",
      description: "Check that a Taste Pack has its shared product facts, Conformance and Expression references, authority note, evaluation Rubric, valid manifest, and entry Skill frontmatter. This is structural validation, not a quality judgment.",
      inputSchema: { repositoryPath },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root }) => toolResult(async () => validatePack(root)),
  );

  server.registerTool(
    "taste_eval_list_fixtures",
    {
      title: "List Taste evaluation fixtures",
      description: "List fixture IDs for one mode without exposing before or expected-after states.",
      inputSchema: { repositoryPath, mode },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root, mode: selectedMode }) => toolResult(async () => ({ mode: selectedMode, fixtureIds: await listEvaluationFixtures(root, selectedMode as TasteMode) })),
  );

  server.registerTool(
    "taste_eval_get_generator_case",
    {
      title: "Get evaluation generator input",
      description: "Return the task and before/ state for one evaluation fixture. Never returns expected-after files or the Rubric. Use for the generator arm only.",
      inputSchema: {
        repositoryPath,
        mode,
        fixtureId: z.string().min(1).max(100),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root, mode: selectedMode, fixtureId }) => toolResult(async () => getEvaluationGeneratorCase(root, selectedMode as TasteMode, fixtureId)),
  );

  server.registerTool(
    "taste_eval_get_judge_packet",
    {
      title: "Get evaluation Judge packet",
      description: "Return the task, one completed generator output, expected-after state, and product Rubric for a Judge pass. Call only after the generator run is complete and from the harness's higher-capacity Eval Judge subagent in a fresh context. This is context separation by workflow, not an access-control boundary.",
      inputSchema: {
        repositoryPath,
        mode,
        fixtureId: z.string().min(1).max(100),
        generatedOutput: z.array(z.object({
          path: z.string().min(1).max(300),
          content: z.string(),
        })).max(100).describe("Generated files from the completed generator run; exclude fixture expected-after files."),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root, mode: selectedMode, fixtureId, generatedOutput }) => toolResult(async () => getEvaluationJudgePacket(root, selectedMode as TasteMode, fixtureId, generatedOutput)),
  );

  return server;
}

const server = createTasteServer();
await server.connect(new StdioServerTransport());
