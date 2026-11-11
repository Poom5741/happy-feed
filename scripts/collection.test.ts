import { expect, test } from "bun:test";
import { parseCollection } from "./collection";

const valid = {
  metadata: { name: "Faves", mute: ["politics"] },
  entries: [{ name: "Patt Vira", youtube: "https://www.youtube.com/@pattvira", tags: ["Creative Coding"] }],
};

test("parses a valid collection into typed entries", () => {
  expect(parseCollection(valid, "faves.json")).toEqual({
    name: "Faves",
    description: undefined,
    mute: ["politics"],
    entries: [
      {
        name: "Patt Vira",
        description: undefined,
        tags: ["Creative Coding"],
        sources: { youtube: "https://www.youtube.com/@pattvira" },
      },
    ],
  });
});

test("rejects an entry with an unknown key", () => {
  const bad = { ...valid, entries: [{ name: "X", youtube: "https://youtube.com/@x", tiktok: "https://tiktok.com/@x" }] };
  expect(() => parseCollection(bad, "faves.json")).toThrow(/entries\[0\].*unknown key.*tiktok/);
});

test("rejects an entry with a bad URL", () => {
  const bad = { ...valid, entries: [{ name: "X", rss: "not a url" }] };
  expect(() => parseCollection(bad, "faves.json")).toThrow(/entries\[0\] \(X\)\.rss is not a valid/);
});

test("rejects an entry with no source", () => {
  const bad = { ...valid, entries: [{ name: "X", tags: [] }] };
  expect(() => parseCollection(bad, "faves.json")).toThrow(/needs at least one/);
});

test("accepts the real collections", async () => {
  for (const file of new Bun.Glob("collection/*.json").scanSync(".")) {
    expect(parseCollection(await Bun.file(file).json(), file).entries.length).toBeGreaterThan(0);
  }
});
