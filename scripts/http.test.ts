import { expect, test } from "bun:test";
import { HttpError, withRetry } from "./http";

const flaky = (failures: unknown[]) => {
  let calls = 0;
  return {
    attempt: async () => {
      const failure = failures[calls++];
      if (failure) throw failure;
      return "ok";
    },
    calls: () => calls,
  };
};

test("a timeout is retried once and then succeeds", async () => {
  const source = flaky([new DOMException("The operation timed out.", "TimeoutError")]);
  expect(await withRetry(source.attempt, 0)).toBe("ok");
  expect(source.calls()).toBe(2);
});

test("a 503 or 429 is retried once", async () => {
  for (const status of [503, 429]) {
    const source = flaky([new HttpError(status, "https://example.com")]);
    expect(await withRetry(source.attempt, 0)).toBe("ok");
    expect(source.calls()).toBe(2);
  }
});

test("a 404 fails at once without retrying", async () => {
  const source = flaky([new HttpError(404, "https://example.com")]);
  await expect(withRetry(source.attempt, 0)).rejects.toThrow("HTTP 404");
  expect(source.calls()).toBe(1);
});

test("a second failure is reported", async () => {
  const source = flaky([new Error("reset"), new Error("reset again")]);
  await expect(withRetry(source.attempt, 0)).rejects.toThrow("reset again");
  expect(source.calls()).toBe(2);
});
