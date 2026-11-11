export type SourceKind = "youtube" | "rss" | "website" | "twitter" | "facebook";

export const SOURCE_KINDS: readonly SourceKind[] = ["youtube", "rss", "website", "twitter", "facebook"];

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
