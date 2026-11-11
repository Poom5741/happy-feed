import type { RawItem } from "../feed-xml";
import { rss } from "./rss";

// A profile URL like https://bsky.app/profile/<handle> serves its public posts at /rss.
export function bluesky(url: string): Promise<RawItem[]> {
  return rss(`${url.replace(/\/+$/, "")}/rss`);
}
