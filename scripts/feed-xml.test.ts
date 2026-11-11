import { expect, test } from "bun:test";
import { parseFeedXml } from "./feed-xml";

test("parses RSS 2.0 with CDATA, pulling the first inline image and plain-text summary", () => {
  const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>Ink</title>
    <item><title>Local-first &amp; you</title><link>/essay/local-first/</link><guid>abc</guid>
      <pubDate>Fri, 31 Oct 2026 00:00:00 +0000</pubDate>
      <description><![CDATA[<p>Back in an <a href="/x">earlier note</a>, we drew <img src="/img/a.png"> diagrams.</p><p>Second&nbsp;para.</p>]]></description>
    </item></channel></rss>`;
  expect(parseFeedXml(xml, "https://www.inkandswitch.com/index.xml")).toEqual([
    {
      id: "abc",
      title: "Local-first & you",
      url: "https://www.inkandswitch.com/essay/local-first/",
      summary: "Back in an earlier note, we drew diagrams. Second para.",
      image: "https://www.inkandswitch.com/img/a.png",
      videoId: undefined,
      publishedAt: "2026-10-31T00:00:00.000Z",
    },
  ]);
});

test("parses a YouTube Atom feed with video id, thumbnail and description", () => {
  const xml = `<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
    <entry><id>yt:video:Rwv1KfcMTKo</id><yt:videoId>Rwv1KfcMTKo</yt:videoId><title>Creative coding</title>
      <link rel="alternate" href="https://www.youtube.com/watch?v=Rwv1KfcMTKo"/>
      <published>2026-11-08T03:05:03+00:00</published>
      <media:group><media:title>Creative coding</media:title>
        <media:thumbnail url="https://i3.ytimg.com/vi/Rwv1KfcMTKo/hqdefault.jpg" width="480" height="360"/>
        <media:description>A talk from Taipei.</media:description></media:group>
    </entry></feed>`;
  expect(parseFeedXml(xml, "https://www.youtube.com/feeds/videos.xml")).toEqual([
    {
      id: "yt:video:Rwv1KfcMTKo",
      title: "Creative coding",
      url: "https://www.youtube.com/watch?v=Rwv1KfcMTKo",
      summary: "A talk from Taipei.",
      image: "https://i3.ytimg.com/vi/Rwv1KfcMTKo/hqdefault.jpg",
      videoId: "Rwv1KfcMTKo",
      publishedAt: "2026-11-08T03:05:03.000Z",
    },
  ]);
});

test("rejects a document that is not a feed", () => {
  expect(() => parseFeedXml("<html><body>hi</body></html>", "https://example.com")).toThrow(/not an RSS or Atom/);
});

test("parses a title-less Bluesky post, keeping its text as the summary", () => {
  const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>@someone</title>
    <item><link>https://bsky.app/profile/someone.bsky.social/post/3mzx</link>
      <description>UX latency is the most frustrating lack of advancement. &#xA;&#xA;The Doherty Threshold was ~400 ms.</description>
      <pubDate>10 Nov 2026 17:58 +0000</pubDate><guid isPermaLink="false">at://did:plc:abc/app.bsky.feed.post/3mzx</guid></item>
  </channel></rss>`;
  const [item] = parseFeedXml(xml, "https://bsky.app/profile/someone.bsky.social/rss");
  expect(item).toMatchObject({
    title: "",
    url: "https://bsky.app/profile/someone.bsky.social/post/3mzx",
    summary: "UX latency is the most frustrating lack of advancement. The Doherty Threshold was ~400 ms.",
    publishedAt: "2026-11-10T17:58:00.000Z",
  });
});
