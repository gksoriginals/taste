type DiagnosticLevel = "off" | "error" | "debug";

const configuredLevel = process.env.TASTE_LOG_LEVEL?.toLowerCase();
const logLevel: DiagnosticLevel = configuredLevel === "off" || configuredLevel === "debug"
  ? configuredLevel
  : "error";

/** Emit metadata-only diagnostics to stderr; never log tool inputs or results. */
export function logDiagnostic(
  level: Exclude<DiagnosticLevel, "off">,
  event: string,
  fields: Record<string, string | number | boolean> = {},
): void {
  if (logLevel === "off" || (level === "debug" && logLevel !== "debug")) return;
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    component: "taste-mcp",
    level,
    event,
    ...fields,
  });
  try {
    process.stderr.write(`${line}\n`);
  } catch {
    // Diagnostics must never interfere with tool execution or the MCP protocol.
  }
}
