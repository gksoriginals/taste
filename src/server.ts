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
  const server = new McpServer(
    { name: "taste", version: "0.1.0" },
    {
      instructions: "For UI tasks, interpret the current user request before calling taste_part_state and always pass taskIntent plus the affected scope. A requested change or correction uses Expression routing even if the Pack says Conformance; do not infer task mode from Pack state alone. This task-local route does not modify the Pack.",
    },
  );

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
        decisionPromotionCheckpoint: z.string().trim().min(1).max(500).optional().describe("Optional plain-language checkpoint for when the host should ask Taste to record a finalized Decision. Guidance only: the host owns checks, user approval, and push workflow."),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ repositoryPath: root, productName, surfaces, decisionPromotionCheckpoint }) => toolResult(async () => initializePack(root, productName, surfaces, decisionPromotionCheckpoint)),
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
      description: "Create or replace one bounded text file inside the target repository's taste/ Pack. This cannot write harness instructions, files outside the Pack, or Decision files under skills/product-design/references/decisions/. Use for product facts and evaluation fixtures; finalized Decisions must use taste_record_signal after the host reports validation and user approval.",
      inputSchema: {
        repositoryPath,
        path: z.string().min(1).max(300).describe("Pack-relative destination path."),
        content: z.string().max(256 * 1024).describe("UTF-8 file contents, up to 256 KiB."),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
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
      description: "Finalized Decision write path. Call only after the host reports that its own relevant checks passed and the user approved the exact tested artifact. That artifact approval authorizes the host to derive and record the reusable Decision automatically; do not ask for separate Pack-write or Decision-text confirmation. Taste records these host reports; it does not run or judge checks, decide readiness, conduct user review, or push. Keep early direction reactions, drafts, corrections, gaps, and rejected iterations in the host's active task context. Then create or update one accepted Decision under taste/skills/product-design/references/decisions/. At least one host-reported validation result is required. validatedArtifact and userApprovedArtifact must identify the same artifact. shippedEvidence is separate and should be included only when the host actually inspected a shipped version. Same id updates the Decision in place; a new artifact clears prior shipped evidence unless new shipped evidence is supplied.",
      inputSchema: {
        repositoryPath,
        id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,80}$/).describe("Stable decision slug. Reuse it to update the same signal."),
        title: z.string().min(1).max(200),
        statement: z.string().min(1).max(8000).describe("The judgment, in the user's terms."),
        rationale: z.string().max(8000).optional(),
        scope: z.string().min(1).max(200).optional().describe("Part this Decision belongs to, such as a surface or feature. Defaults to unscoped."),
        status: z.literal("accepted").describe("Record only after the user approves the tested artifact; that approval authorizes recording the derived reusable Decision."),
        trigger: z.enum(["interview", "sweep", "gap", "rejected_pass"]),
        validatedArtifact: z.string().trim().min(1).max(1000).describe("Stable reference to the exact final artifact the host's workflow validated, such as a commit, release candidate, or inspected deployed version."),
        validationEvidence: z.array(z.string().trim().min(1).max(1000)).min(1).max(30).describe("Host-reported results and evidence for relevant product-specific checks. The host chooses these; Taste does not run or judge them."),
        userApprovedArtifact: z.string().trim().min(1).max(1000).describe("Must identify the same final artifact as validatedArtifact."),
        userApprovalEvidence: z.string().trim().min(1).max(1000).describe("Brief host-reported evidence that the user approved this exact tested artifact."),
        shippedEvidence: z.array(z.string().min(1).max(500)).max(20).optional().describe("References to shipped UI actually inspected. Empty means not shipped."),
        coverageGap: z.literal(false).default(false).describe("An unresolved coverage gap cannot be promoted to the Pack."),
        knownFlaws: z.string().max(4000).optional(),
        alternatives: z.string().max(4000).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async (input) => toolResult(async () => recordSignal(input.repositoryPath, input)),
  );

  server.registerTool(
    "taste_part_state",
    {
      title: "Derive Taste part activity",
      description: "Derive durable Conformance or Expression per Decision from Pack evidence and require a host-interpreted taskIntent. Use apply_existing when following established guidance, inspect_only for setup or Pack maintenance, and new_direction, correction, gap, greenfield, or unclear for Expression work. Expression intents add a task-local routing override while preserving durable Pack-derived state. The host supplies this structured interpretation because the tool cannot read conversation text. This tool does not run or judge checks, write a mode field, or flip the Pack.",
      inputSchema: {
        repositoryPath,
        scope: z.string().min(1).max(200).optional().describe("Optional part name or decision id to filter."),
        taskIntent: z.enum(["apply_existing", "new_direction", "correction", "gap", "greenfield", "unclear", "inspect_only"]).describe("Required host-interpreted current task intent. Use apply_existing when following established guidance; inspect_only for setup or Pack maintenance; use new_direction, correction, gap, greenfield, or unclear to force a task-local Expression route regardless of durable Pack state."),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ repositoryPath: root, scope, taskIntent }) => toolResult(async () => readPartState(root, scope, taskIntent)),
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
