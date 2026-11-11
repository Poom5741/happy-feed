import type { RawItem } from "../feed-xml";

// Archives page backwards until they run out. The cap only guards against an API that never ends.
const MAX_PAGES = 60;

export async function paged<Cursor>(
  first: Cursor | undefined,
  fetchPage: (cursor: Cursor | undefined) => Promise<{ items: RawItem[]; next: Cursor | undefined }>,
): Promise<RawItem[]> {
  const items: RawItem[] = [];
  let cursor = first;
  for (let page = 0; page < MAX_PAGES; page++) {
    const { items: batch, next } = await fetchPage(cursor);
    items.push(...batch);
    if (next === undefined || batch.length === 0) break;
    cursor = next;
  }
  return items;
}

// The full archive is the goal; the RSS feed is the safety net when an archive API is down.
export async function withFallback(archive: () => Promise<RawItem[]>, fallback: () => Promise<RawItem[]>): Promise<RawItem[]> {
  try {
    return await archive();
  } catch (error) {
    console.warn(`  archive failed, using RSS: ${error instanceof Error ? error.message : String(error)}`);
    return fallback();
  }
}
