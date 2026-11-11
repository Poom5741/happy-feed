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
      // also: "rss", "substack", "website", "bluesky", "mastodon", "facebook", plus "archive" (an index page that links every post, for blogs whose RSS only holds recent ones). An entry needs at least one.
    }
  ]
}
```

Each source keeps every post its feed publishes, with no age cutoff, and the page loads them 20 at a time as you scroll.

## Providers

| Key | How it works | Limits |
| --- | --- | --- |
| `youtube` | Resolves a `@handle` to its channel id from the channel page (cached in `.cache/youtube-ids.json`), then reads the channel's Atom feed. `/channel/UC…` URLs skip the lookup. | YouTube's feed holds only the latest 15 videos, Shorts included. |
| `rss` | Reads RSS 2.0 or Atom. The image comes from `media:thumbnail`, an image enclosure, or the first `<img>` in the content. | |
| `substack` | Pages through the publication's whole archive (`/api/v1/archive`), falling back to `/feed`. Works for `*.substack.com` and custom domains. | Paywalled posts only show their preview. |
| `website` | Finds `<link rel="alternate" type="application/rss+xml">` (or Atom) on the page and reads that feed. | Fails when the site advertises no feed. Use `rss` with the feed URL instead. |
| `bluesky` | Pages through every post with the public AppView (`getAuthorFeed`, no replies or reposts), falling back to the profile's RSS. | Posts have no titles; the card shows the post text. |
| `mastodon` | Pages through every public post with the server's API (no replies or boosts), falling back to `<profile>.rss`. | Long posts are cut at about 280 characters on the card; the in-app viewer shows them in full. |
| `twitter` | Reads `RSS_BRIDGE` with `{handle}` replaced, such as `https://rsshub.example.com/twitter/user/{handle}`. | No free public source exists, so without a bridge these entries are skipped. |
| `facebook` | Same, through `RSS_BRIDGE_FACEBOOK`. | Same. |

A source that fails (no bridge, timeout after 15s, bad feed) lands in `feed.json`'s `errors` and the rest of the feed still builds.

## Deploy

The site is an assets-only Cloudflare Worker named `happy-feed`, served at `feed.poom.dev`. `cloudflare.config.ts` sets the custom domain, and Cloudflare manages its DNS record.

Deploy from your machine with `bun run deploy`. It fetches the feed, builds, and runs `cf deploy dist`. The `cf` CLI needs Node.js 22.18 or later and a login (`npx cf auth login`).

`.github/workflows/deploy.yml` does the same on every push to `main`, every 3 hours, and on demand, so the feed stays fresh. Set `RSS_BRIDGE` (and `RSS_BRIDGE_FACEBOOK`) as a repository secret or variable to turn on those sources.

One-time setup for the workflow: add a `CLOUDFLARE_API_TOKEN` repository secret. Create the token with the "Edit Cloudflare Workers" template, scoped to this account and the `poom.dev` zone.

## Agent skills

This repo is built with [Claude Code](https://claude.com/claude-code) and a few agent skills. They are installed locally, not committed:

- Cloudflare skills, pinned in `skills-lock.json`: `npx skills experimental_install`
- [Impeccable](https://impeccable.style) design skill: `npx impeccable install`

## License

[MIT](LICENSE)

