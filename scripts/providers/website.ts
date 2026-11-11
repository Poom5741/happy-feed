import type { RawItem } from "../feed-xml";
import { fetchText } from "../http";
import { rss } from "./rss";

export async function website(url: string): Promise<RawItem[]> {
  const feedUrl = discoverFeed(await fetchText(url), url);
  if (!feedUrl) throw new Error(`no RSS or Atom <link rel="alternate"> found on ${url}`);
  return rss(feedUrl);
}

function discoverFeed(html: string, baseUrl: string): string | undefined {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attr = (name: string) => new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(tag)?.[1];
    const isFeed = /^application\/(rss|atom)\+xml$/i.test(attr("type") ?? "");
    const href = attr("href");
    if (isFeed && /\balternate\b/i.test(attr("rel") ?? "") && href) return new URL(href, baseUrl).toString();
  }
  return undefined;
}
