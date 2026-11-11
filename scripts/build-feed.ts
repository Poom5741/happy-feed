import { Glob } from "bun";
import { buildFeed } from "./aggregate";
import { parseCollection } from "./collection";
import { providers } from "./providers";

const collections = await Promise.all(
  Array.from(new Glob("collection/*.json").scanSync("."))
    .sort()
    .map(async (file) => parseCollection(await Bun.file(file).json(), file)),
);

const feed = await buildFeed(collections, providers, new Date());
await Bun.write("public/feed.json", JSON.stringify(feed));

const counts = Map.groupBy(feed.items, (item) => `${item.author} (${item.kind})`);
for (const [source, items] of counts) console.log(`${String(items.length).padStart(4)}  ${source}`);
for (const error of feed.errors) console.warn(`  skip  ${error.entry} (${error.kind}): ${error.message}`);
console.log(`wrote public/feed.json with ${feed.items.length} items, ${feed.errors.length} errors`);
