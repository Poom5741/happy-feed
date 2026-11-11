export type SourceKind = "youtube" | "rss" | "substack" | "website" | "bluesky" | "mastodon" | "twitter" | "facebook";

export const SOURCE_KINDS: readonly SourceKind[] = [
  "youtube",
  "rss",
  "substack",
  "website",
  "bluesky",
  "mastodon",
  "twitter",
  "facebook",
];

export type Format = "watch" | "read" | "post";

export const FORMAT_OF: Record<SourceKind, Format> = {
  youtube: "watch",
  rss: "read",
  substack: "read",
  website: "read",
  bluesky: "post",
  mastodon: "post",
  twitter: "post",
  facebook: "post",
};

export type FeedItem = {
  id: string;
  kind: SourceKind;
  title: string;
  url: string;
  summary?: string;
  image?: string;
  videoId?: string;
  publishedAt: string;
  author: string;
  tags: string[];
};

export type FeedError = { entry: string; kind: SourceKind; message: string };

export type Feed = {
  generatedAt: string;
  items: FeedItem[];
  tags: string[];
  kinds: SourceKind[];
  errors: FeedError[];
};
