import { mkdir } from "node:fs/promises";
import { parseFeedXml, type RawItem } from "../feed-xml";
import { fetchText } from "../http";

const CACHE_PATH = ".cache/youtube-ids.json";
const CHANNEL_ID = /^UC[\w-]{22}$/;

let cache: Promise<Record<string, string>> | undefined;

export async function youtube(url: string): Promise<RawItem[]> {
  const channelId = await resolveChannelId(url);
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  return parseFeedXml(await fetchText(feedUrl), feedUrl);
}

async function resolveChannelId(url: string): Promise<string> {
  const direct = /\/channel\/(UC[\w-]{22})/.exec(url)?.[1];
  if (direct) return direct;

  cache ??= Bun.file(CACHE_PATH)
    .json()
    .catch(() => ({}));
  const ids = await cache;
  const cached = ids[url];
  if (cached) return cached;

  const html = await fetchText(url);
  const id = /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/.exec(html)?.[1];
  if (!id || !CHANNEL_ID.test(id)) throw new Error(`could not find a channel id on ${url}`);

  ids[url] = id;
  await mkdir(".cache", { recursive: true });
  await Bun.write(CACHE_PATH, JSON.stringify(ids, null, 2));
  return id;
}
