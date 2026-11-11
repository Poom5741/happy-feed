import { expect, test } from "bun:test";
import { blueskyApiUrl, fromBluesky, fromMastodon, mastodonApiUrl } from "./post-view";

test("builds API URLs from feed items", () => {
  expect(blueskyApiUrl("bluesky:at://did:plc:abc/app.bsky.feed.post/3mzx")).toBe(
    "https://public.api.bsky.app/xrpc/app.bsky.feed.getPosts?uris=at%3A%2F%2Fdid%3Aplc%3Aabc%2Fapp.bsky.feed.post%2F3mzx",
  );
  expect(mastodonApiUrl("https://hachyderm.io/@mitchellh/117572093648264631")).toBe(
    "https://hachyderm.io/api/v1/statuses/117572093648264631",
  );
  expect(mastodonApiUrl("https://hachyderm.io/@mitchellh")).toBeUndefined();
});

test("a Bluesky post keeps its images and links only web URLs, counting facet offsets in bytes", () => {
  const text = "🎉 Read mitchellh.com/writ… and say hi @someone";
  const bytes = (s: string) => new TextEncoder().encode(s).length;
  const linkStart = bytes("🎉 Read ");
  const mentionStart = bytes("🎉 Read mitchellh.com/writ… and say hi ");
  const view = fromBluesky({
    posts: [
      {
        author: { handle: "someone.bsky.social", displayName: "Someone", avatar: "https://cdn.bsky.app/a.jpg" },
        record: {
          text,
          createdAt: "2026-11-10T17:58:09.944Z",
          facets: [
            { index: { byteStart: linkStart, byteEnd: linkStart + bytes("mitchellh.com/writ…") }, features: [{ $type: "app.bsky.richtext.facet#link", uri: "https://mitchellh.com/writing/libghostty-1-0" }] },
            { index: { byteStart: mentionStart, byteEnd: bytes(text) }, features: [{ $type: "app.bsky.richtext.facet#mention", did: "did:plc:x" }] },
          ],
        },
        embed: { $type: "app.bsky.embed.images#view", images: [{ fullsize: "https://cdn.bsky.app/full.jpg", alt: "A chart", aspectRatio: { width: 1837, height: 1421 } }] },
      },
    ],
  });
  expect(view.author).toEqual({ name: "Someone", handle: "@someone.bsky.social", avatar: "https://cdn.bsky.app/a.jpg" });
  expect(view.body).toEqual([
    { text: "🎉 Read " },
    { text: "mitchellh.com/writ…", href: "https://mitchellh.com/writing/libghostty-1-0" },
    { text: " and say hi @someone" },
  ]);
  expect(view.images).toEqual([{ src: "https://cdn.bsky.app/full.jpg", alt: "A chart", ratio: 1837 / 1421 }]);
});

test("a Mastodon post becomes plain segments with paragraphs, hidden URL parts, and no mention links", () => {
  const view = fromMastodon({
    created_at: "2026-11-06T23:29:36.615Z",
    account: { display_name: "Mitchell Hashimoto", acct: "mitchellh", avatar: "https://media.hachyderm.io/a.png" },
    content:
      '<p>libghostty 1.0 is here! &amp; thanks <span class="h-card"><a href="https://hachyderm.io/@x" class="u-url mention">@<span>x</span></a></span></p>' +
      '<p>Read <a href="https://mitchellh.com/writing/libghostty-1-0"><span class="invisible">https://</span><span class="ellipsis">mitchellh.com/writin</span><span class="invisible">g/libghostty-1-0</span></a><br>Bye <a href="https://hachyderm.io/tags/zig" class="mention hashtag">#<span>zig</span></a></p>',
    media_attachments: [{ type: "image", url: "https://media.hachyderm.io/i.png", description: "Benchmark" }],
    card: { url: "https://mitchellh.com/writing/libghostty-1-0", title: "Libghostty 1.0", description: "", image: null },
  });
  expect(view.body).toEqual([
    { text: "libghostty 1.0 is here! & thanks @x\n\nRead " },
    { text: "mitchellh.com/writin…", href: "https://mitchellh.com/writing/libghostty-1-0" },
    { text: "\nBye #zig" },
  ]);
  expect(view.images).toEqual([{ src: "https://media.hachyderm.io/i.png", alt: "Benchmark" }]);
  expect(view.link).toEqual({ url: "https://mitchellh.com/writing/libghostty-1-0", title: "Libghostty 1.0", description: undefined, image: undefined });
});
