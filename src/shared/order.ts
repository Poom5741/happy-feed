type Orderable = { author: string; publishedAt: string };

const FRESH_MS = 7 * 24 * 60 * 60 * 1000;

export function diverseOrder<T extends Orderable>(items: readonly T[], maxRun = 2): T[] {
  const remaining = [...items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const ordered: T[] = [];
  let run = 0;
  while (remaining.length > 0) {
    const last = ordered.at(-1)?.author;
    const other = run >= maxRun ? remaining.findIndex((item) => item.author !== last) : 0;
    // When only the over-run author is left, keep their items rather than dropping them.
    const [next] = remaining.splice(Math.max(other, 0), 1) as [T];
    run = next.author === last ? run + 1 : 1;
    ordered.push(next);
  }
  return ordered;
}

// Older posts may be pulled up to break a run of fresh ones, so the "caught up" divider goes
// after the last fresh card rather than at a date boundary in the input.
export function orderFeed<T extends Orderable>(items: readonly T[], now: Date): { ordered: T[]; freshCount: number } {
  const cutoff = new Date(now.getTime() - FRESH_MS).toISOString();
  const ordered = diverseOrder(items);
  return { ordered, freshCount: ordered.findLastIndex((item) => item.publishedAt >= cutoff) + 1 };
}
