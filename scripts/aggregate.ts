import { SOURCE_KINDS, type Feed, type FeedError, type FeedItem, type SourceKind } from "../src/shared/types";
import type { Collection } from "./collection";
import type { ProviderRegistry } from "./providers";

const MAX_ITEMS_PER_SOURCE = 30;
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export async function buildFeed(collections: Collection[], providers: ProviderRegistry, now: Date): Promise<Feed> {
  const errors: FeedError[] = [];
  const jobs = collections.flatMap((collection) =>
    collection.entries.flatMap((entry) =>
      (Object.entries(entry.sources) as [SourceKind, string][]).map(async ([kind, url]): Promise<FeedItem[]> => {
        try {
          const raw = await providers[kind](url);
          return raw
            .filter((item) => now.getTime() - Date.parse(item.publishedAt) <= MAX_AGE_MS)
            .filter((item) => !isMuted(item, collection.mute))
            .sort(byNewest)
            .slice(0, MAX_ITEMS_PER_SOURCE)
            .map((item) => ({ ...item, id: `${kind}:${item.id}`, kind, author: entry.name, tags: entry.tags }));
        } catch (error) {
          errors.push({ entry: entry.name, kind, message: error instanceof Error ? error.message : String(error) });
          return [];
        }
      }),
    ),
  );

  const byId = new Map((await Promise.all(jobs)).flat().map((item) => [item.id, item]));
  const items = [...byId.values()].sort(byNewest);
  const present = new Set(items.map((item) => item.kind));
  return {
    generatedAt: now.toISOString(),
    items,
    tags: [...new Set(items.flatMap((item) => item.tags))].sort(),
    kinds: SOURCE_KINDS.filter((kind) => present.has(kind)),
    errors,
  };
}

function isMuted(item: { title: string; summary?: string }, mute: string[]): boolean {
  const haystack = `${item.title}\n${item.summary ?? ""}`.toLowerCase();
  return mute.some((word) => haystack.includes(word.toLowerCase()));
}

function byNewest(a: { publishedAt: string }, b: { publishedAt: string }): number {
  return b.publishedAt.localeCompare(a.publishedAt);
}
