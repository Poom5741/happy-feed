import { parseFeedXml, type RawItem } from "../feed-xml";
import { fetchText } from "../http";

export async function rss(url: string): Promise<RawItem[]> {
  return parseFeedXml(await fetchText(url), url);
}
