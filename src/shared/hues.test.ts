import { expect, test } from "bun:test";
import { assignHues, HUES } from "./hues";

test("up to six tags each get a different hue", () => {
  const tags = ["Coding", "Creative Coding", "HCI", "Computer Science", "Music", "Art"];
  expect(new Set(assignHues(tags).values()).size).toBe(HUES.length);
});

test("a tag keeps its hue regardless of input order", () => {
  const tags = ["HCI", "Coding", "Creative Coding"];
  expect(assignHues(tags)).toEqual(assignHues([...tags].reverse()));
});
