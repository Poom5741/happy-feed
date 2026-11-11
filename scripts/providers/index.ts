import type { SourceKind } from "../../src/shared/types";
import type { RawItem } from "../feed-xml";
import { bridged } from "./bridge";
import { rss } from "./rss";
import { website } from "./website";
import { youtube } from "./youtube";

export type Provider = (url: string) => Promise<RawItem[]>;
export type ProviderRegistry = Record<SourceKind, Provider>;

export const providers: ProviderRegistry = {
  youtube,
  rss,
  website,
  twitter: bridged("RSS_BRIDGE"),
  facebook: bridged("RSS_BRIDGE_FACEBOOK"),
};
