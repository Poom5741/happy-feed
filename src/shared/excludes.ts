type Excludable = { title: string; summary?: string };

export const EXCLUDE_PRESETS = {
  ai: { label: "AI", terms: ["AI", "Artificial Intelligence", "Superintelligence", "Super Intelligence"] },
} as const satisfies Record<string, { label: string; terms: readonly string[] }>;

export type ExcludeId = keyof typeof EXCLUDE_PRESETS;

export const EXCLUDE_IDS = Object.keys(EXCLUDE_PRESETS) as ExcludeId[];

const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");

// Whole-word, case-insensitive: "AI" catches "AI-generated" and "AI's" but not "Thai" or "said".
const PATTERNS = Object.fromEntries(
  EXCLUDE_IDS.map((id) => [id, new RegExp(`\\b(?:${EXCLUDE_PRESETS[id].terms.map(escape).join("|")})\\b`, "i")]),
) as Record<ExcludeId, RegExp>;

export function isExcluded(item: Excludable, active: ReadonlySet<ExcludeId>): boolean {
  const text = `${item.title}\n${item.summary ?? ""}`;
  for (const id of active) if (PATTERNS[id].test(text)) return true;
  return false;
}
