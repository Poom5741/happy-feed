import { expect, test } from "bun:test";
import { diverseOrder, orderFeed } from "./order";

const item = (author: string, day: number) => ({ author, publishedAt: `2026-11-${String(day).padStart(2, "0")}T00:00:00.000Z` });
const authors = (items: { author: string }[]) => items.map((i) => i.author).join("");

test("keeps newest first but never more than 2 consecutive cards from one author", () => {
  const items = [item("A", 10), item("A", 9), item("A", 8), item("A", 7), item("B", 6), item("C", 5)];
  expect(authors(diverseOrder(items))).toBe("AABAAC");
});

test("is plain newest-first when authors already alternate", () => {
  const items = [item("B", 3), item("A", 9), item("C", 1), item("A", 5)];
  expect(diverseOrder(items).map((i) => i.publishedAt.slice(8, 10))).toEqual(["09", "05", "03", "01"]);
});

test("keeps every item when one author is all that is left", () => {
  const items = [item("A", 10), item("B", 9), item("A", 8), item("A", 7), item("A", 6)];
  expect(authors(diverseOrder(items))).toBe("ABAAA");
});

test("places the caught-up point after the last fresh card, even when older cards break a run", () => {
  const now = new Date("2026-11-11T00:00:00Z");
  const items = [item("A", 10), item("A", 9), item("A", 8), item("B", 2), item("C", 1)];
  const { ordered, freshCount } = orderFeed(items, now);
  expect(authors(ordered)).toBe("AABAC");
  expect(freshCount).toBe(4);
  expect(orderFeed([item("A", 1)], now).freshCount).toBe(0);
});
