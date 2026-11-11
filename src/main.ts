import { orderFeed } from "./shared/order";
import type { Feed, FeedItem, SourceKind } from "./shared/types";

type Filters = { tags: Set<string>; kind: Set<string> };
type Group = keyof Filters;
type Row = { type: "card"; item: FeedItem } | { type: "caught-up" };

const PAGE_SIZE = 20;
const KIND_LABEL: Record<SourceKind, string> = {
  youtube: "YouTube",
  rss: "Blog",
  website: "Web",
  twitter: "X",
  facebook: "Facebook",
};

const list = document.querySelector<HTMLElement>(".list")!;
const sentinel = document.querySelector<HTMLElement>(".sentinel")!;
const nav = document.querySelector<HTMLElement>(".filters")!;
const chipGroups = {
  tags: nav.querySelector<HTMLElement>('[data-group="tags"]')!,
  kind: nav.querySelector<HTMLElement>('[data-group="kind"]')!,
};

let feed: Feed;
let rows: Row[] = [];
let rendered = 0;

const observer = new IntersectionObserver(
  ([entry]) => {
    if (!entry?.isIntersecting || rendered >= rows.length) return;
    appendPage();
    // Re-observing forces a fresh callback, so a tall screen keeps filling until the sentinel leaves view.
    observer.unobserve(sentinel);
    observer.observe(sentinel);
  },
  { rootMargin: "800px 0px" },
);

void start();

async function start(): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}feed.json`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    feed = (await response.json()) as Feed;
  } catch {
    list.replaceChildren(
      h("div", { className: "notice" }, [
        h("p", { className: "notice-title" }, ["The feed is taking a nap."]),
        h("p", {}, ["We couldn't load it just now. That's a fine moment to look away from the screen."]),
        button("Try again", () => location.reload()),
      ]),
    );
    return;
  }
  addEventListener("popstate", render);
  render();
  observer.observe(sentinel);
}

function readFilters(): Filters {
  const params = new URLSearchParams(location.search);
  const read = (key: Group) => new Set((params.get(key) ?? "").split(",").filter(Boolean));
  return { tags: read("tags"), kind: read("kind") };
}

function writeFilters(filters: Filters): void {
  const params = new URLSearchParams();
  for (const group of ["tags", "kind"] as const) {
    if (filters[group].size > 0) params.set(group, [...filters[group]].join(","));
  }
  const query = params.toString().replaceAll("%2C", ",");
  history.pushState(null, "", query ? `?${query}` : location.pathname);
  render();
  scrollTo({ top: 0 });
}

function matches(item: FeedItem, filters: Filters): boolean {
  const tagOk = filters.tags.size === 0 || item.tags.some((tag) => filters.tags.has(tag));
  const kindOk = filters.kind.size === 0 || filters.kind.has(item.kind);
  return tagOk && kindOk;
}

function render(): void {
  const filters = readFilters();
  renderChips(filters);

  const { ordered, freshCount } = orderFeed(
    feed.items.filter((item) => matches(item, filters)),
    new Date(),
  );
  rows = ordered.map((item): Row => ({ type: "card", item }));
  if (freshCount > 0) rows.splice(freshCount, 0, { type: "caught-up" });
  rendered = 0;
  list.replaceChildren();

  if (rows.length === 0) {
    list.append(
      h("div", { className: "notice" }, [
        h("p", { className: "notice-title" }, ["Nothing here with these filters."]),
        button("Show everything", () => writeFilters({ tags: new Set(), kind: new Set() })),
      ]),
    );
    return;
  }
  appendPage();
}

function appendPage(): void {
  const page = rows.slice(rendered, rendered + PAGE_SIZE);
  list.append(...page.map((row) => (row.type === "card" ? renderCard(row.item) : renderCaughtUp())));
  rendered += page.length;
  if (rendered >= rows.length) list.append(renderEnd());
}

function renderChips(filters: Filters): void {
  nav.hidden = false;
  const options: Record<Group, { value: string; label: string }[]> = {
    tags: feed.tags.map((tag) => ({ value: tag, label: tag })),
    kind: feed.kinds.map((kind) => ({ value: kind, label: KIND_LABEL[kind] })),
  };
  for (const group of ["tags", "kind"] as const) {
    chipGroups[group].replaceChildren(
      ...options[group].map(({ value, label }) => {
        const active = filters[group].has(value);
        const chip = button(label, () => {
          const next = new Set(filters[group]);
          if (active) next.delete(value);
          else next.add(value);
          writeFilters({ ...filters, [group]: next });
        });
        chip.className = "chip";
        chip.setAttribute("aria-pressed", String(active));
        return chip;
      }),
    );
  }
}

function renderCard(item: FeedItem): HTMLElement {
  const playable = item.videoId !== undefined;
  const media = item.image
    ? h(playable ? "button" : "div", { className: "media", ...(playable ? { ariaLabel: `Play ${item.title}` } : {}) }, [
        h("img", { src: item.image, alt: "", loading: "lazy", decoding: "async", referrerPolicy: "no-referrer" }),
        ...(playable ? [h("span", { className: "play", ariaHidden: "true" }, ["▶"])] : []),
      ])
    : undefined;
  media?.querySelector("img")?.addEventListener("error", () => media.remove(), { once: true });

  const title = playable
    ? h("h2", { className: "title" }, [item.title])
    : h("h2", { className: "title" }, [h("a", { href: item.url, target: "_blank", rel: "noopener", className: "stretch" }, [item.title])]);

  const card = h("article", { className: `card${playable ? " playable" : ""}` }, [
    h("header", { className: "meta" }, [
      h("span", { className: "author" }, [item.author]),
      h("span", { className: "badge", dataset: { kind: item.kind } }, [KIND_LABEL[item.kind]]),
      h("time", { dateTime: item.publishedAt, title: new Date(item.publishedAt).toLocaleString() }, [ago(item.publishedAt)]),
    ]),
    ...(media ? [media] : []),
    title,
    ...(item.summary ? [h("p", { className: "summary" }, [item.summary])] : []),
    ...(item.tags.length > 0 ? [h("ul", { className: "tags" }, item.tags.map((tag) => h("li", {}, [tag])))] : []),
  ]);

  if (playable) card.addEventListener("click", () => play(card, item), { once: true });
  return card;
}

function play(card: HTMLElement, item: FeedItem): void {
  const frame = h("iframe", {
    className: "media",
    src: `https://www.youtube-nocookie.com/embed/${item.videoId}?autoplay=1&rel=0`,
    title: item.title,
    allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
    allowFullscreen: true,
  });
  const existing = card.querySelector(".media");
  if (existing) existing.replaceWith(frame);
  else card.querySelector(".meta")!.after(frame);
  card.classList.remove("playable");
}

function renderCaughtUp(): HTMLElement {
  return h("div", { className: "divider", role: "separator" }, [
    h("p", { className: "divider-title" }, ["You're caught up ✨"]),
    h("p", {}, ["Everything from the last week is above. Older posts continue below."]),
  ]);
}

function renderEnd(): HTMLElement {
  const skipped = feed.errors.length;
  return h("div", { className: "notice end" }, [
    h("p", { className: "notice-title" }, ["That's all of it 🌿"]),
    h("p", {}, ["You've reached the end. Maybe stretch, drink some water, or go make something."]),
    ...(skipped > 0
      ? [h("p", { className: "fine" }, [`${skipped} source${skipped === 1 ? "" : "s"} couldn't be fetched this time.`])]
      : []),
    h("p", { className: "fine" }, [`Updated ${ago(feed.generatedAt)}.`]),
  ]);
}

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86_400],
  ["month", 30 * 86_400],
  ["week", 7 * 86_400],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

function ago(iso: string): string {
  const seconds = (Date.parse(iso) - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const el = h("button", { type: "button", className: "button" }, [label]);
  el.addEventListener("click", onClick);
  return el;
}

type Props<K extends keyof HTMLElementTagNameMap> = Partial<Omit<HTMLElementTagNameMap[K], "dataset">> & {
  dataset?: Record<string, string>;
};

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props<K>,
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const { dataset, ...rest } = props;
  const el = Object.assign(document.createElement(tag), rest);
  if (dataset) Object.assign(el.dataset, dataset);
  el.append(...children);
  return el;
}
