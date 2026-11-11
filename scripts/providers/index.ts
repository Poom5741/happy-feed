import type { SourceKind } from "../../src/shared/types";
import type { RawItem } from "../feed-xml";
import { bluesky } from "./bluesky";
import { bridged } from "./bridge";
import { mastodon } from "./mastodon";
import { rss } from "./rss";
import { substack } from "./substack";
import { website } from "./website";
import { youtube } from "./youtube";

export type Provider = (url: string) => Promise<RawItem[]>;
export type ProviderRegistry = Record<SourceKind, Provider>;

export const providers: ProviderRegistry = {
  youtube,
  rss,
  substack,
  website,
  bluesky,
  mastodon,
  twitter: bridged("RSS_BRIDGE"),
  facebook: bridged("RSS_BRIDGE_FACEBOOK"),
};
