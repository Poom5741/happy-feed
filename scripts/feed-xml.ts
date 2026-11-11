import { XMLParser } from "fast-xml-parser";

export type RawItem = {
  id: string;
  title: string;
  url: string;
  summary?: string;
  image?: string;
  videoId?: string;
  publishedAt: string;
};

const SUMMARY_LENGTH = 280;
const ARRAY_TAGS = new Set(["item", "entry", "link", "media:thumbnail", "media:content", "enclosure"]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  parseAttributeValue: false,
  htmlEntities: true,
  isArray: (tagName) => ARRAY_TAGS.has(tagName),
});

type Node = Record<string, unknown>;

export function parseFeedXml(xml: string, baseUrl: string): RawItem[] {
  const doc = parser.parse(xml) as Node;
  const rssItems = ((doc.rss as Node | undefined)?.channel as Node | undefined)?.item;
  const atomEntries = (doc.feed as Node | undefined)?.entry;
  if (!doc.rss && !doc.feed) throw new Error("not an RSS or Atom feed");
  const nodes = (rssItems ?? atomEntries ?? []) as Node[];
  return nodes.flatMap((node) => {
    const item = toRawItem(node, baseUrl);
    return item ? [item] : [];
  });
}

function toRawItem(node: Node, baseUrl: string): RawItem | undefined {
  const url = itemLink(node, baseUrl);
  const date = new Date(text(node.published ?? node.pubDate ?? node.updated ?? node["dc:date"]));
  if (!url || Number.isNaN(date.getTime())) return undefined;

  const media = (node["media:group"] as Node | undefined) ?? node;
  const html = text(node["content:encoded"] ?? node.content ?? node.description ?? node.summary);
  const summary = truncate(htmlToText(text(media["media:description"]) || html));

  return {
    id: text(node.guid ?? node.id) || url,
    title: htmlToText(text(node.title ?? media["media:title"])),
    url,
    summary: summary || undefined,
    image: absolute(itemImage(node, media, html), url),
    videoId: text(node["yt:videoId"]) || undefined,
    publishedAt: date.toISOString(),
  };
}

function itemLink(node: Node, baseUrl: string): string | undefined {
  const links = node.link as unknown[] | undefined;
  const atom = links?.find((l) => isNode(l) && (l["@_rel"] ?? "alternate") === "alternate");
  const href = atom ? text((atom as Node)["@_href"]) : text(links?.[0]);
  return absolute(href || text(node.guid), baseUrl);
}

function itemImage(node: Node, media: Node, html: string): string | undefined {
  const thumbnail = (media["media:thumbnail"] as Node[] | undefined)?.[0]?.["@_url"];
  const content = (media["media:content"] as Node[] | undefined)?.find(
    (c) => c["@_medium"] === "image" || text(c["@_type"]).startsWith("image/"),
  )?.["@_url"];
  const enclosure = (node.enclosure as Node[] | undefined)?.find((e) => text(e["@_type"]).startsWith("image/"))?.["@_url"];
  const inline = /<img[^>]+src=["']([^"']+)["']/i.exec(html)?.[1];
  return text(thumbnail ?? content ?? enclosure ?? inline) || undefined;
}

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (isNode(value)) return text(value["#text"]);
  return "";
}

function isNode(value: unknown): value is Node {
  return typeof value === "object" && value !== null;
}

function absolute(href: string | undefined, base: string): string | undefined {
  if (!href) return undefined;
  try {
    return new URL(href, base).toString();
  } catch {
    return undefined;
  }
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ldquo: "\u201C",
  rdquo: "\u201D",
  lsquo: "\u2018",
  rsquo: "\u2019",
  mdash: "\u2014",
  ndash: "\u2013",
  hellip: "\u2026",
  copy: "\u00A9",
};

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/?(p|div|br|li|ul|ol|h\d|blockquote|tr|td|pre|figure|figcaption)\b[^>]*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, code: string) => {
      if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? match;
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isNaN(n) ? match : String.fromCodePoint(n);
    })
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(value: string): string {
  if (value.length <= SUMMARY_LENGTH) return value;
  const cut = value.slice(0, SUMMARY_LENGTH);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 200 ? cut.lastIndexOf(" ") : SUMMARY_LENGTH).trimEnd()}…`;
}
