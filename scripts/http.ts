const TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 2_000;
// YouTube serves a stripped page without the canonical channel link to non-browser user agents.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    url: string,
  ) {
    super(`HTTP ${status} from ${url}`);
  }
}

// One retry covers a slow or flaky server (a timeout, a dropped connection, 429 or 5xx).
// A 4xx other than 429 is a real answer, so it fails straight away.
export async function withRetry<T>(attempt: () => Promise<T>, delayMs = RETRY_DELAY_MS): Promise<T> {
  try {
    return await attempt();
  } catch (error) {
    const permanent = error instanceof HttpError && error.status < 500 && error.status !== 429;
    if (permanent) throw error;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return attempt();
  }
}

async function request(url: string, accept: string): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, "accept-language": "en", accept },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new HttpError(response.status, url);
    return response;
  });
}

export async function fetchText(url: string): Promise<string> {
  return (await request(url, "*/*")).text();
}

export async function fetchJson<T = unknown>(url: string): Promise<T> {
  return (await (await request(url, "application/json")).json()) as T;
}
