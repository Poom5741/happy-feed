import { expect, test } from "bun:test";
import { chooseBranding, thumbnailUrl } from "./dearrow";

const sub = <T extends object>(extra: T) => ({ original: false, votes: 0, locked: false, ...extra });

test("uses the top community title and thumbnail when they are trusted", () => {
  expect(
    chooseBranding({
      titles: [sub({ title: "Explaining Perlin Noise", votes: 2 }), sub({ title: "What is Perlin Noise?", original: true })],
      thumbnails: [sub({ timestamp: 42.5, locked: true })],
    }),
  ).toEqual({ title: "Explaining Perlin Noise", time: 42.5 });
});

test("drops the > auto-format markers", () => {
  expect(chooseBranding({ titles: [sub({ title: "Kirkaldy's >Testing >Works | >Tom >Scott", locked: true })] })).toEqual({
    title: "Kirkaldy's Testing Works | Tom Scott",
  });
});

test("ignores a downvoted top submission and an original-first answer", () => {
  expect(chooseBranding({ titles: [sub({ title: "Unconfirmed", votes: -1 })] })).toEqual({});
  expect(chooseBranding({ titles: [sub({ title: "Original", original: true })], thumbnails: [sub({ timestamp: null, original: true })] })).toEqual({});
});

test("thumbnail URLs fall back to YouTube's own image", () => {
  expect(thumbnailUrl("abc", 12)).toBe(
    "https://dearrow-thumb.ajay.app/api/v1/getThumbnail?videoID=abc&time=12&redirectUrl=https%3A%2F%2Fi.ytimg.com%2Fvi%2Fabc%2Fhq720.jpg",
  );
});
