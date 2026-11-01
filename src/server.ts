import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { resolveTasteMode } from "./core/mode.js";
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
import { readPartState, recordSignal } from "./core/signals.js";

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
    "taste_mode_resolve",
    {
      title: "Resolve the selected Taste mode",
      description: "Deprecated task-local helper. Maps an already-interpreted signal to the words Conformance or Expression. Does not read the Pack, does not derive part activity, and does not decide who starts Expression. Prefer taste_part_state. Taste does not classify raw user language.",
      inputSchema: {
        currentMode: mode.optional().describe("Current task-local mode, if one has already been selected."),
        trigger: z.enum(["explicit_mode", "established_direction", "new_direction", "direction_accepted", "unclear"]),
        explicitMode: mode.optional().describe("Required when trigger is explicit_mode."),
        userConfirmed: z.boolean().optional().describe("Whether the user explicitly accepted the proposed direction as product guidance."),
        rationale: z.string().max(2000).describe("The coding agent's short rationale, based on the product Skill and conversation context."),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (input) => success(resolveTasteMode(input)),
  );

  server.registerTool(
    "taste_pack_initialize",
    {
      title: "Initialize a Taste Pack",
      description: "Create a non-overwriting starter Taste Pack under <repositoryPath>/taste. One shared Pack with a decisions/ home. Does not create separate Conformance and Expression trees, does not edit AGENTS.md, and does not configure the harness. Call only after the user requests or agrees to initialization.",
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
      description: "Summarize the target repository's Taste Pack: layout (shared decisions home or legacy split folders), decision count, references, evaluation fixtures, and structural validation. supportedModes is reported only as a deprecated field. Reads only taste/.",
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
      description: "Check Pack structure: manifest, entry Skill, shared facts, authority, rubric, and either a decisions/ home or the legacy conformance plus expression reference READMEs. Does not require supportedModes. Structural validation only, not a quality judgment.",
      inputSchema: { repositoryPath },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root }) => toolResult(async () => validatePack(root)),
  );

  server.registerTool(
    "taste_record_signal",
    {
      title: "Record a Taste Decision",
      description: "Expression and Sweep write path. Create or update one Decision under taste/skills/product-design/references/decisions/. Use trigger interview for greenfield or new requirements, sweep for shipped-UI extraction, gap when artefacts cannot justify the next step, and rejected_pass for a correction on shipped or generated work. status stays proposed until the user accepts or rejects the statement. There is no mode field. Same id updates that Decision in place. Omitted optional fields keep the stored rationale, scope, shipped evidence, coverage gap, known flaws, and alternatives.",
      inputSchema: {
        repositoryPath,
        id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,80}$/).describe("Stable decision slug. Reuse it to update the same signal."),
        title: z.string().min(1).max(200),
        statement: z.string().min(1).max(8000).describe("The judgment, in the user's terms."),
        rationale: z.string().max(8000).optional(),
        scope: z.string().min(1).max(200).optional().describe("Part this Decision belongs to, such as a surface or feature. Defaults to unscoped."),
        status: z.enum(["proposed", "accepted", "rejected"]),
        trigger: z.enum(["interview", "sweep", "gap", "rejected_pass"]),
        shippedEvidence: z.array(z.string().min(1).max(500)).max(20).optional().describe("References to shipped UI actually inspected. Empty means not shipped."),
        coverageGap: z.boolean().optional().describe("True when current artefacts cannot justify the next step. On create, defaults to true when trigger is gap. On update, omit to keep the stored value."),
        coverageGapNote: z.string().max(2000).optional(),
        knownFlaws: z.string().max(4000).optional(),
        alternatives: z.string().max(4000).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (input) => toolResult(async () => recordSignal(input.repositoryPath, input)),
  );

  server.registerTool(
    "taste_part_state",
    {
      title: "Derive Taste part activity",
      description: "Derive Conformance or Expression per Decision from status, shipped evidence, and coverage gap. Conformance means accepted, shipped evidence present, and coverage gap false. Everything else is Expression for that part. An empty Pack is Expression. Does not write a mode field, does not flip the Pack, and does not decide who initiates a change. User intent can still route into Expression.",
      inputSchema: {
        repositoryPath,
        scope: z.string().min(1).max(200).optional().describe("Optional part name or decision id to filter."),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root, scope }) => toolResult(async () => readPartState(root, scope)),
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
