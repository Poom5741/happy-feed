# Happy Feed

A calm, endless feed of creators I chose, served at https://feed.poom.dev. YouTube videos, blog posts, and (with a bridge) tweets become one card type you can filter by tag and source.

## Run it

```sh
bun install
bun run fetch   # writes public/feed.json from collection/*.json
bun run dev     # http://localhost:5173
bun test
bun run build   # static site in dist/
```

## Collections

Every `collection/*.json` file is loaded. Unknown keys and bad URLs fail the build with the file and entry named.

```jsonc
{
  "metadata": {
    "name": "Poom's Faves",
    "description": "optional",
    "mute": ["politics", "AI psychosis"] // optional, case-insensitive; matching titles or summaries are dropped
  },
  "entries": [
    {
      "name": "Coding Train",           // shown as the card author
      "description": "optional",
      "tags": ["Creative Coding"],      // filter chips
      "youtube": "https://www.youtube.com/@TheCodingTrain",
      "twitter": "https://x.com/thecodingtrain"
      // also: "rss", "website", "facebook". An entry needs at least one.
    }
  ]
}
```

Each source keeps its newest 30 posts from the past 365 days.

## Providers

| Key | How it works | Limits |
| --- | --- | --- |
| `youtube` | Resolves a `@handle` to its channel id from the channel page (cached in `.cache/youtube-ids.json`), then reads the channel's Atom feed. `/channel/UC…` URLs skip the lookup. | YouTube's feed holds only the latest 15 videos, Shorts included. |
| `rss` | Reads RSS 2.0 or Atom. The image comes from `media:thumbnail`, an image enclosure, or the first `<img>` in the content. | |
| `website` | Finds `<link rel="alternate" type="application/rss+xml">` (or Atom) on the page and reads that feed. | Fails when the site advertises no feed. Use `rss` with the feed URL instead. |
| `twitter` | Reads `RSS_BRIDGE` with `{handle}` replaced, such as `https://rsshub.example.com/twitter/user/{handle}`. | No free public source exists, so without a bridge these entries are skipped. |
| `facebook` | Same, through `RSS_BRIDGE_FACEBOOK`. | Same. |

A source that fails (no bridge, timeout after 15s, bad feed) lands in `feed.json`'s `errors` and the rest of the feed still builds.

## Deploy

`.github/workflows/deploy.yml` fetches, builds, and publishes to GitHub Pages on every push to `main`, every 3 hours, and on demand. Set `RSS_BRIDGE` (and `RSS_BRIDGE_FACEBOOK`) as a repository secret or variable to turn on those sources.

One-time setup:

1. In the repository settings, set Pages to deploy from GitHub Actions.
2. Add a DNS record `CNAME feed → <user>.github.io`.
3. `public/CNAME` already holds `feed.poom.dev`. Turn on "Enforce HTTPS" once the certificate is issued.
