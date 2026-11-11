import type { RawItem } from "../feed-xml";
import { rss } from "./rss";

// A profile URL like https://hachyderm.io/@<user> serves its public posts at <url>.rss.
export function mastodon(url: string): Promise<RawItem[]> {
  return rss(`${url.replace(/\/+$/, "")}.rss`);
}
