import { expect, test } from "bun:test";
import { buildFeed } from "./aggregate";
import type { Collection } from "./collection";
import type { RawItem } from "./feed-xml";
import type { ProviderRegistry } from "./providers";

const now = new Date("2026-11-11T00:00:00Z");

const raw = (id: string, title: string, daysAgo: number, summary?: string): RawItem => ({
  id,
  title,
  summary,
  url: `https://example.com/${id}`,
  publishedAt: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(),
});

const noProvider = async (): Promise<RawItem[]> => {
  throw new Error("no bridge configured");
};

const registry = (rss: RawItem[]): ProviderRegistry => ({
  rss: async () => rss,
  youtube: noProvider,
  website: noProvider,
  twitter: noProvider,
  facebook: noProvider,
});

const collection: Collection = {
  name: "Faves",
  mute: ["politics", "AI psychosis"],
  entries: [{ name: "Ink", tags: ["HCI"], sources: { rss: "https://example.com/feed", twitter: "https://x.com/ink" } }],
};

test("drops muted items case-insensitively by title or summary", async () => {
  const feed = await buildFeed(
    [collection],
    registry([
      raw("a", "Local-first software", 1),
      raw("b", "Thoughts on POLITICS", 2),
      raw("c", "A calm essay", 3, "On the rise of ai psychosis"),
    ]),
    now,
  );
  expect(feed.items.map((item) => item.title)).toEqual(["Local-first software"]);
});

test("stamps author, kind and tags, drops old items, and collects provider errors", async () => {
  const feed = await buildFeed([collection], registry([raw("old", "Ancient", 400), raw("new", "Fresh", 0)]), now);
  expect(feed.items).toEqual([
    expect.objectContaining({ title: "Fresh", kind: "rss", author: "Ink", tags: ["HCI"] }),
  ]);
  expect(feed.tags).toEqual(["HCI"]);
  expect(feed.kinds).toEqual(["rss"]);
  expect(feed.errors).toEqual([{ entry: "Ink", kind: "twitter", message: "no bridge configured" }]);
});

test("keeps at most 30 items per source, newest first", async () => {
  const many = Array.from({ length: 40 }, (_, i) => raw(`i${i}`, `Post ${i}`, i));
  const feed = await buildFeed([collection], registry(many), now);
  expect(feed.items).toHaveLength(30);
  expect(feed.items[0]?.title).toBe("Post 0");
  expect(feed.items.at(-1)?.title).toBe("Post 29");
});
