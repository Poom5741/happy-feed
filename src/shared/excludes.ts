type Excludable = { title: string; summary?: string };

export const EXCLUDE_PRESETS = {
  ai: {
    label: "AI",
    terms: ["AI", "Artificial Intelligence", "Superintelligence", "Super Intelligence"],
    keep: ["No AI"],
  },
} as const satisfies Record<string, { label: string; terms: readonly string[]; keep?: readonly string[] }>;

export type ExcludeId = keyof typeof EXCLUDE_PRESETS;

export const EXCLUDE_IDS = Object.keys(EXCLUDE_PRESETS) as ExcludeId[];

const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");

// Whole-word, case-insensitive: "AI" catches "AI-generated" and "AI's" but not "Thai" or "said".
const wordPattern = (terms: readonly string[]) => new RegExp(`\\b(?:${terms.map(escape).join("|")})\\b`, "i");

const PATTERNS = Object.fromEntries(
  EXCLUDE_IDS.map((id) => {
    const { terms, keep = [] } = EXCLUDE_PRESETS[id] as { terms: readonly string[]; keep?: readonly string[] };
    return [id, { hide: wordPattern(terms), keep: keep.length > 0 ? wordPattern(keep) : undefined }];
  }),
) as Record<ExcludeId, { hide: RegExp; keep?: RegExp }>;

export function isExcluded(item: Excludable, active: ReadonlySet<ExcludeId>): boolean {
  const text = `${item.title}\n${item.summary ?? ""}`;
  for (const id of active) {
    const { hide, keep } = PATTERNS[id];
    // A keep phrase wins over the whole post: "No AI" content is exactly what the preset is for.
    if (hide.test(text) && !keep?.test(text)) return true;
  }
  return false;
}
