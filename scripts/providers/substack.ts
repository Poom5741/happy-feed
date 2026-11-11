import type { RawItem } from "../feed-xml";
import { rss } from "./rss";

export function substack(url: string): Promise<RawItem[]> {
  return rss(new URL("/feed", url).toString());
}
