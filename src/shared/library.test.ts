import { expect, test } from "bun:test";
import { emptyLibrary, isShelved, parseLibrary, shelfItems, toggleShelf } from "./library";
import type { FeedItem } from "./types";

const item = (id: string, title = id): FeedItem => ({
  id,
  kind: "rss",
  title,
  url: `https://example.com/${id}`,
  publishedAt: "2026-11-01T00:00:00.000Z",
  author: "Someone",
  tags: [],
});

test("toggling a shelf adds the post, and toggling again removes it", () => {
  const added = toggleShelf(emptyLibrary(), "archive", item("a"), new Date("2026-11-11T00:00:00Z"));
  expect(isShelved(added, "archive", "a")).toBe(true);
  expect(isShelved(added, "favourites", "a")).toBe(false);
  expect(isShelved(toggleShelf(added, "archive", item("a"), new Date()), "archive", "a")).toBe(false);
});

test("a shelf lists newest saves first and prefers the feed's fresh copy", () => {
  let library = toggleShelf(emptyLibrary(), "favourites", item("old"), new Date("2026-11-01T00:00:00Z"));
  library = toggleShelf(library, "favourites", item("new", "snapshot"), new Date("2026-11-10T00:00:00Z"));
  const fresh = new Map([["new", item("new", "fresh title")]]);
  expect(shelfItems(library, "favourites", fresh).map((i) => i.title)).toEqual(["fresh title", "old"]);
});

test("a post that aged out of the feed still shows from its snapshot", () => {
  const library = toggleShelf(emptyLibrary(), "favourites", item("gone", "Kept forever"), new Date());
  expect(shelfItems(library, "favourites", new Map()).map((i) => i.title)).toEqual(["Kept forever"]);
});

test("parsing stored data keeps valid entries and drops broken ones", () => {
  const saved = JSON.parse(JSON.stringify(toggleShelf(emptyLibrary(), "archive", item("a"), new Date())));
  saved.archive.broken = { at: "x", item: { id: "broken" } };
  expect(Object.keys(parseLibrary(saved).archive)).toEqual(["a"]);
  expect(parseLibrary("not json at all")).toEqual(emptyLibrary());
});
