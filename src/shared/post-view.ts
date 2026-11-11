// One shape for a full social post, whichever network it came from. Replies are never part of it.

export type Segment = { text: string; href?: string };

export type PostView = {
  author: { name: string; handle: string; avatar?: string };
  publishedAt: string;
  body: Segment[];
  images: { src: string; alt: string; ratio?: number }[];
  video?: { poster?: string };
  link?: { url: string; title: string; description?: string; image?: string };
  quote?: { author: string; text: string };
};

type Json = Record<string, unknown>;

const obj = (value: unknown): Json => (typeof value === "object" && value !== null ? (value as Json) : {});
const str = (value: unknown): string => (typeof value === "string" ? value : "");
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const web = (url: string): string | undefined => (/^https?:\/\//i.test(url) ? url : undefined);

export function blueskyApiUrl(itemId: string): string | undefined {
  const uri = itemId.replace(/^bluesky:/, "");
  if (!uri.startsWith("at://")) return undefined;
  return `https://public.api.bsky.app/xrpc/app.bsky.feed.getPosts?uris=${encodeURIComponent(uri)}`;
}

export function mastodonApiUrl(postUrl: string): string | undefined {
  try {
    const url = new URL(postUrl);
    const id = url.pathname.split("/").filter(Boolean).at(-1);
    return id && /^\d+$/.test(id) ? `${url.origin}/api/v1/statuses/${id}` : undefined;
  } catch {
    return undefined;
  }
}

export function fromBluesky(response: unknown): PostView {
  const post = obj(arr(obj(response).posts)[0]);
  const author = obj(post.author);
  const record = obj(post.record);
  const view: PostView = {
    author: { name: str(author.displayName) || str(author.handle), handle: `@${str(author.handle)}`, avatar: web(str(author.avatar)) },
    publishedAt: str(record.createdAt) || str(post.indexedAt),
    body: blueskyText(str(record.text), arr(record.facets)),
    images: [],
  };
  addBlueskyEmbed(view, obj(post.embed));
  return view;
}

function addBlueskyEmbed(view: PostView, embed: Json): void {
  const type = str(embed.$type);
  if (type === "app.bsky.embed.images#view") {
    view.images = arr(embed.images).map((raw) => {
      const image = obj(raw);
      const ratio = obj(image.aspectRatio);
      const width = Number(ratio.width);
      const height = Number(ratio.height);
      return { src: str(image.fullsize), alt: str(image.alt), ratio: width > 0 && height > 0 ? width / height : undefined };
    });
  } else if (type === "app.bsky.embed.external#view") {
    const external = obj(embed.external);
    const url = web(str(external.uri));
    if (url) {
      view.link = { url, title: str(external.title) || new URL(url).hostname, description: str(external.description) || undefined, image: web(str(external.thumb)) };
    }
  } else if (type === "app.bsky.embed.video#view") {
    view.video = { poster: web(str(embed.thumbnail)) };
  } else if (type === "app.bsky.embed.record#view") {
    const quoted = obj(embed.record);
    if (str(quoted.$type) === "app.bsky.embed.record#viewRecord") {
      const author = obj(quoted.author);
      view.quote = { author: str(author.displayName) || str(author.handle), text: str(obj(quoted.value).text) };
    }
  } else if (type === "app.bsky.embed.recordWithMedia#view") {
    addBlueskyEmbed(view, obj(embed.media));
    addBlueskyEmbed(view, { $type: "app.bsky.embed.record#view", record: obj(obj(embed.record).record) });
  }
}

// Facet offsets count UTF-8 bytes, not UTF-16 characters. Only links to the open web become links:
// mentions and hashtags stay plain text, so the viewer never leads back into the network.
function blueskyText(text: string, facets: unknown[]): Segment[] {
  const bytes = new TextEncoder().encode(text);
  const decode = (from: number, to: number) => new TextDecoder().decode(bytes.slice(from, to));
  const links = facets
    .map((raw) => {
      const facet = obj(raw);
      const index = obj(facet.index);
      const href = arr(facet.features)
        .map(obj)
        .find((feature) => str(feature.$type) === "app.bsky.richtext.facet#link");
      return { start: Number(index.byteStart), end: Number(index.byteEnd), href: href && web(str(href.uri)) };
    })
    .filter((link): link is { start: number; end: number; href: string } => !!link.href && link.end > link.start)
    .sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const link of links) {
    if (link.start < cursor) continue;
    if (link.start > cursor) segments.push({ text: decode(cursor, link.start) });
    segments.push({ text: decode(link.start, link.end), href: link.href });
    cursor = link.end;
  }
  if (cursor < bytes.length) segments.push({ text: decode(cursor, bytes.length) });
  return segments;
}

export function fromMastodon(response: unknown): PostView {
  const status = obj(response);
  const account = obj(status.account);
  const card = obj(status.card);
  const cardUrl = web(str(card.url));
  const quoted = obj(obj(status.quote).quoted_status);
  const view: PostView = {
    author: { name: str(account.display_name) || str(account.acct), handle: `@${str(account.acct)}`, avatar: web(str(account.avatar)) },
    publishedAt: str(status.created_at),
    body: mastodonText(str(status.content)),
    images: [],
    link: cardUrl ? { url: cardUrl, title: str(card.title) || new URL(cardUrl).hostname, description: str(card.description) || undefined, image: web(str(card.image)) } : undefined,
    quote: str(quoted.content) ? { author: str(obj(quoted.account).display_name) || str(obj(quoted.account).acct), text: plain(mastodonText(str(quoted.content))) } : undefined,
  };
  for (const raw of arr(status.media_attachments)) {
    const media = obj(raw);
    const type = str(media.type);
    if (type === "image") view.images.push({ src: str(media.url), alt: str(media.description) });
    else if ((type === "video" || type === "gifv") && !view.video) view.video = { poster: web(str(media.preview_url)) };
  }
  return view;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, code: string) => {
    if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? match;
    const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return Number.isNaN(n) ? match : String.fromCodePoint(n);
  });
}

// Mastodon content is a small, known HTML subset (<p>, <br>, <a>, <span class="invisible|ellipsis">).
// It is tokenized into text segments, never inserted as HTML.
function mastodonText(html: string): Segment[] {
  const segments: Segment[] = [];
  const push = (text: string, href?: string) => {
    if (!text) return;
    const last = segments.at(-1);
    if (last && last.href === href) last.text += text;
    else segments.push(href ? { text, href } : { text });
  };
  const spans: string[] = [];
  let href: string | undefined;
  let skipLink = false;
  for (const [, closing, tag, attrs = "", text] of html.matchAll(/<(\/?)(\w+)([^>]*)>|([^<]+)/g)) {
    if (text !== undefined) {
      if (!spans.includes("invisible")) push(decodeEntities(text), skipLink ? undefined : href);
      continue;
    }
    const name = tag!.toLowerCase();
    if (name === "p" && closing && segments.length > 0) push("\n\n");
    else if (name === "br") push("\n");
    else if (name === "a") {
      if (closing) {
        href = undefined;
        skipLink = false;
      } else {
        href = web(decodeEntities(/\bhref="([^"]*)"/i.exec(attrs)?.[1] ?? ""));
        skipLink = /\bclass="[^"]*\b(mention|hashtag)\b/i.test(attrs);
      }
    } else if (name === "span") {
      if (closing) {
        if (spans.pop() === "ellipsis") push("…", skipLink ? undefined : href);
      } else {
        spans.push(/\binvisible\b/.test(attrs) ? "invisible" : /\bellipsis\b/.test(attrs) ? "ellipsis" : "");
      }
    }
  }
  const last = segments.at(-1);
  if (last) last.text = last.text.replace(/\s+$/, "");
  return segments;
}

function plain(segments: Segment[]): string {
  return segments.map((segment) => segment.text).join("");
}
