# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One user: Poom. They are prone to doomscrolling and keep landing on feeds that leave them sad (AI psychosis, politics). They open Happy Feed when the urge to scroll hits. That happens on the phone in bed late at night, on the phone in short bursts on the go, and in a desktop tab between work. Other people are not an audience. Other collection files are Poom's own themed lists.

## Product Purpose

Happy Feed lets Poom keep the scrolling habit and replaces what fills it. Everything in the feed comes from creators Poom chose by hand in `collection/*.json`. YouTube, blogs and RSS, and X (through a bridge) all become one kind of card. Success means a session that feels worth having and ends with a gentle cue to stop once Poom is caught up. A session that went on forever does not count as success.

## Positioning

There is no ranking for engagement. Only hand-picked sources are shown, plus a mute list that drops topics that cause harm. The feed is varied (no more than two cards in a row from one creator) and honest about freshness ("You're caught up").

## Operating Context

- Posts are fetched every 3 hours by a GitHub Action into a static `feed.json`. The site is hosted at https://feed.poom.dev.
- Collections are edited by hand as JSON. Each entry has a name, tags, and provider URLs (`youtube`, `rss`, `website`, `twitter`, `facebook`).
- Filters by tag and source live in the URL, so they can be bookmarked.

## Capabilities and Constraints

- YouTube, RSS and website (feed autodiscovery) work without credentials.
- X and Facebook need a self-hosted RSS bridge (`RSS_BRIDGE`, `RSS_BRIDGE_FACEBOOK`). No free route exists. That was measured 2026-11-11: nitter 410, xcancel 451, X syndication 429.
- YouTube channel feeds only expose the latest 15 videos. Items older than 365 days are dropped.
- Stack: Bun, TypeScript, Vite, vanilla TS client, static hosting on GitHub Pages.
- Undecided: where stopping cues go beyond the "caught up" divider. For example, whether older posts should feel different or need a deliberate tap to continue.

## Brand Commitments

The working name is "Happy Feed". The tone is calm and warm, never guilt-inducing.

## Evidence on Hand

The real content is Poom's collection in `collection/phoomparin.json`, which covers creative coding, coding, HCI and computer science creators. There are no testimonials or users beyond Poom, and none should be invented.

## Product Principles

1. **Curated over clever.** The feed only shows what Poom chose, and nothing is recommended by an algorithm.
2. **Nudge, don't nag.** Stopping cues are gentle and honest about freshness. They never shame or block.
3. **Variety is calming.** No single creator or topic dominates a stretch of the scroll.
4. **Sad stays out.** The mute list and the choice of sources protect mood before novelty.
5. **Works one-handed in the dark.** Phone at night is the hardest case to get right.

## Accessibility & Inclusion

Night-time reading on a phone needs comfortable dark mode and readable type at arm's length. Respect `prefers-reduced-motion`.
