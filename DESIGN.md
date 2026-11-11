---
name: Happy Feed
description: A cheerful box of colorful index tiles for creators Poom chose by hand.
colors:
  accent: "#6a4cf5"
  accent-ink: "#ffffff"
  lilac-ground: "#f6f4fd"
  paper-surface: "#ffffff"
  midnight-ink: "#1e1b33"
  dusk-muted: "#5d5878"
  lilac-line: "#e4e0f3"
  night-accent: "#a08bff"
  night-accent-ink: "#14122a"
  night-ground: "#14122a"
  night-surface: "#1e1b3a"
  night-text: "#efecff"
  night-muted: "#aaa5cc"
  night-line: "#2d2950"
  night-focus: "#b9a8ff"
  ink-on-solid: "#1e1b33"
  sunny: "#ffc83d"
  sunny-ink: "#4a2f00"
  leaf: "#2fbf7f"
  leaf-deep: "#1f9e66"
  blush: "#ff9eb8"
  sun-wash: "#fff3c4"
  sun-solid: "#ffc21a"
  sun-ink: "#6b4500"
  tangerine-wash: "#ffe6d5"
  tangerine-solid: "#ff8a3d"
  tangerine-ink: "#7a2f00"
  mint-wash: "#d7f5e6"
  mint-solid: "#2fc489"
  mint-ink: "#0b5a3a"
  sky-wash: "#dbedff"
  sky-solid: "#4a9bff"
  sky-ink: "#0d4482"
  grape-wash: "#ebe4ff"
  grape-solid: "#8a6dff"
  grape-ink: "#3a2196"
  berry-wash: "#ffe0eb"
  berry-solid: "#ff5c93"
  berry-ink: "#84143f"
typography:
  display:
    fontFamily: "Bricolage Grotesque, ui-rounded, system-ui, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 800
    letterSpacing: "-0.03em"
    fontVariation: "\"opsz\" 48"
  headline-watch:
    fontFamily: "Bricolage Grotesque, ui-rounded, system-ui, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 700
    lineHeight: 1.22
    letterSpacing: "-0.015em"
    fontVariation: "\"opsz\" 28"
  headline-read:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "1.3rem"
    fontWeight: 650
    lineHeight: 1.28
    letterSpacing: "-0.01em"
  body-reading:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Bricolage Grotesque, ui-rounded, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  title-tab:
    fontFamily: "Bricolage Grotesque, ui-rounded, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 650
  label-chip:
    fontFamily: "Bricolage Grotesque, ui-rounded, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 600
  label-byline:
    fontFamily: "Bricolage Grotesque, ui-rounded, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  label-tag:
    fontFamily: "Bricolage Grotesque, ui-rounded, system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 650
  label-format:
    fontFamily: "Bricolage Grotesque, ui-rounded, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.01em"
rounded:
  pill: "999px"
  moment: "32px"
  tile: "24px"
  thumb-mini: "16px"
  focus: "12px"
  monogram: "10px"
spacing:
  hairline-gap: "4px"
  chip-gap: "8px"
  card-gap: "12px"
  gutter: "16px"
  gutter-wide: "24px"
  feed-gap: "28px"
  feed-row-gap-desktop: "36px"
  rail-gap: "40px"
  column: "620px"
  rail: "300px"
components:
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.dusk-muted}"
    typography: "{typography.title-tab}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "40px"
  tab-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
  tab-group:
    backgroundColor: "{colors.paper-surface}"
    rounded: "{rounded.pill}"
    padding: "4px"
  chip:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.midnight-ink}"
    typography: "{typography.label-chip}"
    rounded: "{rounded.pill}"
    padding: "0 14px 0 11px"
    height: "36px"
  chip-selected-sky:
    backgroundColor: "{colors.sky-wash}"
    textColor: "{colors.sky-ink}"
    rounded: "{rounded.pill}"
  format-pill-sky:
    backgroundColor: "{colors.sky-solid}"
    textColor: "{colors.ink-on-solid}"
    typography: "{typography.label-format}"
    rounded: "{rounded.pill}"
    padding: "3px 9px 3px 7px"
  tag-sky:
    textColor: "{colors.sky-ink}"
    typography: "{typography.label-tag}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  read-tile-sky:
    backgroundColor: "{colors.sky-wash}"
    textColor: "{colors.midnight-ink}"
    rounded: "{rounded.tile}"
    padding: "18px 18px 16px"
  watch-thumb:
    rounded: "{rounded.tile}"
  monogram-sky:
    backgroundColor: "{colors.sky-solid}"
    textColor: "{colors.ink-on-solid}"
    rounded: "{rounded.monogram}"
    size: "32px"
  play-button-sky:
    backgroundColor: "{colors.sky-solid}"
    textColor: "{colors.ink-on-solid}"
    size: "52px"
  button:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  theme-toggle:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.midnight-ink}"
    size: "44px"
  moment:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.midnight-ink}"
    rounded: "{rounded.moment}"
    padding: "36px 20px 32px"
---

# Design System: Happy Feed

## Overview

**Creative North Star: "The Tile Box"**

Happy Feed is a box of colorful index tiles. Every tag owns a hue, and every card says up front whether it is something to watch or something to read. The ground is quiet (a cool lilac-white by day, a deep violet night after dark), so the six tag hues carry the cheer. Everything is chunky and rounded and drawn with a soft hand. Nibble's category-colored tiles and Pi's warm mixed card shapes are the references.

Density is relaxed: one column on a phone, used one-handed in bed, with generous gaps between cards. On desktop a sticky rail holds the controls and the feed becomes a grid of tiles. The sprout mascot appears in the masthead and again at the stopping points ("caught up", "that's everything", empty and error states), so the moments where the feed ends feel friendly.

Light and dark are equal citizens. A header toggle switches between them and there is no settings screen. The voice is warm and never alarmed: no red warnings, no badges asking for attention.

**Key Characteristics:**
- Six tag hues (sun, tangerine, mint, sky, grape, berry), each with a wash, a solid and an ink.
- Watch and read cards have different anatomy, not only a different label.
- Two voices: Bricolage Grotesque for the UI and watch titles, Literata for reading.
- Pill and 24px-tile geometry everywhere, with drawn icons on a 2px round stroke.
- Soft, cool-tinted shadows, and a sprout mascot that marks the stopping points.

## Colors

A quiet lilac or violet ground under six bright tag hues, with one violet accent reserved for the active control.

### Primary
- **Electric Violet** (accent; night: night-accent): fills the active format tab and the one action button inside a moment. It also sets the focus ring. It is never used for content.

### Tag Hues
Each hue is a triple. The **wash** is the tile and chip-selected background. The **solid** is used for dots, format pills, play buttons, monograms and the ring around a thumbnail. The **ink** is for text on the wash. The dark theme swaps all three for night versions (see the sidecar): the washes become dark tinted grounds, the solids get brighter and the inks get lighter.
- **Sunflower** (sun-wash / sun-solid / sun-ink)
- **Tangerine** (tangerine-wash / tangerine-solid / tangerine-ink)
- **Mint** (mint-wash / mint-solid / mint-ink)
- **Sky** (sky-wash / sky-solid / sky-ink)
- **Grape** (grape-wash / grape-solid / grape-ink)
- **Berry** (berry-wash / berry-solid / berry-ink)

### Mascot
- **Sunny** with **Sunny Ink**: the sprout's face. Sunny is also the text-selection highlight.
- **Leaf** and **Leaf Deep**: the sprout's two leaves.
- **Blush**: the sprout's cheeks.

### Neutral
- **Lilac Ground** / **Night Ground**: the page background, also used behind the sticky controls on mobile.
- **Paper Surface** / **Night Surface**: holds the tab group, chips, theme toggle and moments.
- **Midnight Ink** / **Night Text**: primary text.
- **Dusk Muted** / **Night Muted**: idle tabs, bylines, timestamps and moment body copy.
- **Lilac Line** / **Night Line**: chip borders, the rule between chip groups, and the scrollbar.
- **Ink on Solid** (fixed in both themes): text and icons on any tag solid (format pill, play button, monogram). The solids are bright in both themes, so this dark ink does not flip.

### Named Rules
**The Hue Owns the Card Rule.** A card takes the hue of its first tag, falling back to a hash of the author. Tags are assigned hues in sorted order through the sequence sky, sun, berry, mint, grape, tangerine, so neighbors contrast and a small tag set never lands on three warm hues in a row. Never pick a hue by hand for a single card.

**The Accent Is a Control Rule.** Electric Violet marks only the selected tab, the moment action and focus. Content gets its color from the tag hues and never from the accent.

**The Jewel Contrast Rule.** A read tile with no image becomes a jewel tile: the solid mixed into the wash (50% in light), with on-jewel text. On-jewel text must clear 4.5:1 for every hue in both themes. Dark mode mixes 80% solid with ink-on-solid text; the lowest hue, grape, measures 4.62:1.

## Typography

**Display Font:** Bricolage Grotesque (with ui-rounded, system-ui)
**Reading Font:** Literata (with Georgia)

**Character:** Bricolage is the playful, chunky voice for the UI, the wordmark and watch titles. It uses optical sizing (opsz 48 at display size, 28 at titles). Literata is the calm reading voice. It handles anything that is meant to be read: read-card titles, summaries and moment body copy.

### Hierarchy
- **Display** (800, 1.6rem, -0.03em): the wordmark and moment titles ("You're all caught up!").
- **Headline, watch** (Bricolage 700, 1.3rem, 1.22, balanced wrap): video titles.
- **Headline, read** (Literata 650, 1.3rem, 1.28, pretty wrap): article titles.
- **Body, reading** (Literata 400, 1rem, 1.55, max 62ch, clamped to 4 lines): summaries. Moment copy also uses Literata, at 34ch.
- **Body** (Bricolage 400, 16px, 1.5): the base UI text.
- **Labels** (Bricolage): tabs 650 at 0.95rem (1rem in the rail), chips 600 at 0.9rem, bylines 0.875rem with the author in 700, tags 650 at 0.78rem, format pills 700 at 0.75rem. Counts and timestamps use tabular numbers.

### Named Rules
**The Two Voices Rule.** The title face signals the format. A watch title is set in Bricolage and a read title in Literata. Never set a read title in the display face, and never set UI chrome in Literata.

## Layout

The phone layout is one centered column, 620px max, with a 16px gutter (24px at 720px and up). The masthead respects the top safe area. The controls (format tabs, then a horizontally scrolling chip row with no visible scrollbar) stick to the top on the ground color. Cards stack 28px apart.

From 1024px the body becomes a two-column grid: a 300px sticky rail and the feed, 40px apart, 1560px max with 32px side padding. The rail holds the masthead and the controls. The tabs stack vertically, the chips wrap, and the rule between tag chips and source chips turns horizontal. The feed becomes a 2-column grid (36px row gap, 28px column gap), and 3 columns from 1440px. A moment shown alone spans every column, centered at 560px max.

Breakpoints: 720px, 1024px, 1440px.

## Elevation & Depth

Depth is soft and ambient. One two-layer shadow, tinted cool violet in light and pure black in dark, lifts the white or violet surfaces off the ground: the tab group, the theme toggle, moments, watch thumbnails, and read tiles on hover. Read tiles rest flat because their color already separates them. Watch thumbnails get a 4px ring in the hue's wash, in addition to the shadow. The round play button has its own deeper drop shadow.

### Named Rules
**The Flat Tile Rule.** Read tiles are flat at rest and lift (2px up, plus the shadow) only on hover. Separate tiles from the ground with color, not with a border or a resting shadow.

## Shapes

The form language is chunky and rounded. Every control is a full pill: tabs, chips, format pills, tags and buttons. Cards and thumbnails are 24px tiles. Moments are rounder still at 32px. Inline thumbnails on read cards use 16px corners, and monograms use 10px. The theme toggle, play button and "go" arrow are circles. Borders are rare: only idle chips have one (1.5px, in the line color). Icons are drawn SVG symbols at 2px stroke with round caps and joins, 20px by default and 13 to 22px in context. Play and format glyphs are filled.

## Components

### Format Tabs
- **Character:** a single pill track that answers "watch or read?".
- **Shape:** a pill group on the surface with 4px inner padding. Each tab is a 40px pill with an icon, a label and a tabular count.
- **States:** idle tabs are muted, turn to text color on hover, and fill with Electric Violet when selected (aria-pressed). A tab with no matches is disabled at 45% opacity.
- **Rail:** stacks vertically inside a 24px-radius card. Tabs are 46px tall, left-aligned, with the count pushed to the end.

### Chips
- **Style:** a surface pill with a 1.5px line border. Tag chips lead with a 10px dot in the hue's solid. Source chips lead with a muted 16px drawn icon.
- **State:** on hover the border takes the hue's solid. When selected, the chip fills with the hue's wash, with a solid border and ink text. Source chips have no hue and invert to the text color on the ground.

### Watch Card
- **Character:** the picture leads and there is no frame.
- A 16:9 thumbnail with 24px corners, a 4px wash ring and the soft shadow. A circular 52px play button in the hue's solid sits in the lower-left. On hover the image scales to 1.03 and the play button to 1.08. Pressing play swaps in the embed in place.
- Below the thumbnail: the Bricolage title (with an underline in the hue's solid on hover), the byline, then tags.

### Read Card
- **Character:** a tinted tile that works with no image at all.
- A wash tile with 24px corners and 18px padding (22px/24px at 720px and up). The byline leads with a 32px monogram (the author's initial on the hue's solid). The Literata title sits beside an optional 76px (96px) inline thumbnail. The summary below is clamped to four lines. The footer has the tags and a 32px circular "go" arrow, which rotates 45 degrees on hover. The whole tile is the link, and focus outlines the whole tile.
- **Jewel variant:** with no image, the tile deepens to the jewel mix. The monogram and format pill invert to on-jewel, and tags and the go arrow sit on a 14% on-jewel tint.

### Byline, Format Pill and Tags
- The byline shows the author in bold, then a format pill (the hue's solid with Ink on Solid text and a filled play or book glyph), then the relative time pushed to the end.
- Tags are pills with a 22% solid tint and hue-ink text.

### Moment (Signature)
- **Character:** the sprout's stopping point.
- A surface card with 32px corners and the soft shadow, holding a centered 96px sprout, a display title, Literata body copy, an optional pill button, and optional fine print. The "happy" mood hops and waves its leaves once when it scrolls into view. The "sleepy" mood closes its eyes and is used for the end, empty and error states.

### Masthead
- The 40px sprout and the wordmark on the left, the 44px circular theme toggle on the right. On hover the toggle rotates -20 degrees, and the sun and moon icons cross-fade with a rotation.

### Loading Skeleton
- Wash tiles with pulsing bars in a 30% solid tint, in rotating hues.

## Do's and Don'ts

### Do:
- **Do** give every card and tag chip one of the six hues through the shared hue assignment, and use that hue's wash, solid and ink together.
- **Do** keep watch and read visibly distinct in anatomy (a frameless picture versus a tinted tile) and in title voice (Bricolage versus Literata), not only in the format pill.
- **Do** make every read card work with no image. The jewel tile is the image-less form.
- **Do** ship every color change in both themes and through the header toggle. Check text on washes, solids and jewels at 4.5:1 in each theme.
- **Do** use the shared out-expo ease (cubic-bezier(0.16, 1, 0.3, 1)), and let `prefers-reduced-motion` switch off every animation and transition.
- **Do** mark stopping points with the sprout mascot, happy when caught up and sleepy at the end.

### Don't:
- **Don't** build the gray news column of identical photo cards. A card without its hue is off-system.
- **Don't** use Electric Violet as a content or tag color.
- **Don't** add a settings screen for theming. The header toggle is the only theme control.
- **Don't** draw icons as emoji or font glyphs. Add them as SVG symbols on the 2px round stroke.
- **Don't** give read tiles a hard border or a resting shadow. Color separates them, and the shadow is only for hover.
