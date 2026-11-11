import { EXCLUDE_IDS, EXCLUDE_PRESETS, isExcluded, type ExcludeId } from "./shared/excludes";
import { assignHues, hueOf, type Hue } from "./shared/hues";
import { orderFeed } from "./shared/order";
import { FORMAT_OF, type Feed, type FeedItem, type Format, type SourceKind } from "./shared/types";

type Filters = { show: Format | ""; tags: Set<string>; kind: Set<string> };
type Row = { type: "card"; item: FeedItem } | { type: "caught-up" };

const PAGE_SIZE = 20;
const FORMATS: Record<Format, { label: string; icon: string }> = {
  watch: { label: "Watch", icon: "i-play" },
  read: { label: "Read", icon: "i-book" },
  post: { label: "Posts", icon: "i-chat" },
};
const KINDS: Record<SourceKind, { label: string; icon: string }> = {
  youtube: { label: "YouTube", icon: "i-tv" },
  rss: { label: "Blogs", icon: "i-book" },
  substack: { label: "Substack", icon: "i-mail" },
  website: { label: "Web", icon: "i-globe" },
  twitter: { label: "X", icon: "i-chat" },
  facebook: { label: "Facebook", icon: "i-chat" },
};

const root = document.documentElement;
const list = document.querySelector<HTMLElement>(".list")!;
const sentinel = document.querySelector<HTMLElement>(".sentinel")!;
const controls = document.querySelector<HTMLElement>(".controls")!;
const tabs = controls.querySelector<HTMLElement>(".tabs")!;
const chips = controls.querySelector<HTMLElement>(".chips")!;
const toggle = document.querySelector<HTMLButtonElement>(".theme-toggle")!;
const systemDark = matchMedia("(prefers-color-scheme: dark)");

let feed: Feed;
let hues = new Map<string, Hue>();
let hidden = loadHidden();
let hiddenCount = 0;
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

const cheer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("cheer");
      cheer.unobserve(entry.target);
    }
  },
  { threshold: 0.6 },
);

syncTheme();
systemDark.addEventListener("change", syncTheme);
toggle.addEventListener("click", () => {
  const next = root.dataset.resolved === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {}
  syncTheme();
});

void start();

function syncTheme(): void {
  const resolved = root.dataset.theme ?? (systemDark.matches ? "dark" : "light");
  root.dataset.resolved = resolved;
  toggle.setAttribute("aria-label", resolved === "dark" ? "Switch to light mode" : "Switch to dark mode");
  const ground = resolved === "dark" ? "#14122a" : "#f6f4fd";
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) meta.content = ground;
}

async function start(): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}feed.json`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    feed = (await response.json()) as Feed;
  } catch {
    list.replaceChildren(
      moment({
        mood: "sleepy",
        title: "The feed is napping",
        body: "It couldn't load just now. A fine moment to look up from the screen.",
        action: ["Try again", () => location.reload()],
      }),
    );
    return;
  }
  hues = assignHues(feed.tags);
  addEventListener("popstate", render);
  render();
  observer.observe(sentinel);
}

function loadHidden(): Set<ExcludeId> {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem("hide") ?? "[]");
    return new Set(EXCLUDE_IDS.filter((id) => Array.isArray(saved) && saved.includes(id)));
  } catch {
    return new Set();
  }
}

function toggleHidden(id: ExcludeId): void {
  if (hidden.has(id)) hidden.delete(id);
  else hidden.add(id);
  try {
    localStorage.setItem("hide", JSON.stringify([...hidden]));
  } catch {}
  render();
}

function hueFor(item: FeedItem): Hue {
  const tag = item.tags[0];
  return (tag && hues.get(tag)) || hueOf(item.author);
}

function readFilters(): Filters {
  const params = new URLSearchParams(location.search);
  const set = (key: string) => new Set((params.get(key) ?? "").split(",").filter(Boolean));
  const show = params.get("show");
  return { show: show && show in FORMATS ? (show as Format) : "", tags: set("tags"), kind: set("kind") };
}

function writeFilters(filters: Filters): void {
  const params = new URLSearchParams();
  if (filters.show) params.set("show", filters.show);
  if (filters.tags.size > 0) params.set("tags", [...filters.tags].join(","));
  if (filters.kind.size > 0) params.set("kind", [...filters.kind].join(","));
  const query = params.toString().replaceAll("%2C", ",");
  history.pushState(null, "", query ? `?${query}` : location.pathname);
  render();
  scrollTo({ top: 0 });
}

function matchesChips(item: FeedItem, filters: Filters): boolean {
  const tagOk = filters.tags.size === 0 || item.tags.some((tag) => filters.tags.has(tag));
  const kindOk = filters.kind.size === 0 || filters.kind.has(item.kind);
  return tagOk && kindOk;
}

function render(): void {
  const filters = readFilters();
  const kept = feed.items.filter((item) => !isExcluded(item, hidden));
  hiddenCount = feed.items.length - kept.length;
  const chipMatches = kept.filter((item) => matchesChips(item, filters));
  renderControls(filters, chipMatches);

  const visible = chipMatches.filter((item) => !filters.show || FORMAT_OF[item.kind] === filters.show);
  const { ordered, freshCount } = orderFeed(visible, new Date());
  rows = ordered.map((item): Row => ({ type: "card", item }));
  if (freshCount > 0 && freshCount < ordered.length) rows.splice(freshCount, 0, { type: "caught-up" });
  rendered = 0;
  list.replaceChildren();

  if (rows.length === 0) {
    list.append(
      moment({
        mood: "sleepy",
        title: "Nothing here yet",
        body: "No posts match these filters.",
        action: ["Show everything", () => writeFilters({ show: "", tags: new Set(), kind: new Set() })],
      }),
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

function renderControls(filters: Filters, chipMatches: FeedItem[]): void {
  controls.hidden = false;
  const formats = [...new Set(feed.items.map((item) => FORMAT_OF[item.kind]))];
  const count = (format: Format | "") =>
    chipMatches.filter((item) => !format || FORMAT_OF[item.kind] === format).length;

  tabs.replaceChildren(
    ...(["", ...formats] as const).map((format) => {
      const { label, icon: id } = format ? FORMATS[format] : { label: "All", icon: "i-all" };
      const tab = h("button", { type: "button", className: "tab" }, [
        icon(id),
        label,
        h("span", { className: "count" }, [String(count(format))]),
      ]);
      tab.setAttribute("aria-pressed", String(filters.show === format));
      tab.disabled = filters.show !== format && count(format) === 0;
      tab.addEventListener("click", () => writeFilters({ ...filters, show: format }));
      return tab;
    }),
  );

  const chip = (group: "tags" | "kind", value: string, lead: Node, label: string, hue?: Hue) => {
    const active = filters[group].has(value);
    const el = h("button", { type: "button", className: "chip" }, [lead, label]);
    if (hue) el.dataset.hue = hue;
    el.setAttribute("aria-pressed", String(active));
    el.addEventListener("click", () => {
      const next = new Set(filters[group]);
      if (active) next.delete(value);
      else next.add(value);
      writeFilters({ ...filters, [group]: next });
    });
    return el;
  };

  chips.replaceChildren(
    ...EXCLUDE_IDS.map((id) => {
      const active = hidden.has(id);
      const el = h("button", { type: "button", className: "chip hide-chip", title: `Hide posts about ${EXCLUDE_PRESETS[id].label}` }, [
        icon("i-eye-off"),
        `No ${EXCLUDE_PRESETS[id].label}`,
      ]);
      el.setAttribute("aria-pressed", String(active));
      el.addEventListener("click", () => toggleHidden(id));
      return el;
    }),
    h("span", { className: "chip-rule", ariaHidden: "true" }),
    ...feed.tags.map((tag) => chip("tags", tag, h("span", { className: "dot" }), tag, hues.get(tag))),
    ...(feed.kinds.length > 1
      ? [
          h("span", { className: "chip-rule", ariaHidden: "true" }),
          ...feed.kinds.map((kind) => chip("kind", kind, icon(KINDS[kind].icon), KINDS[kind].label)),
        ]
      : []),
  );
}

function byline(item: FeedItem, lead: Node[] = []): HTMLElement {
  const format = FORMAT_OF[item.kind];
  return h("header", { className: "byline" }, [
    ...lead,
    h("span", { className: "author" }, [item.author]),
    h("span", { className: "format" }, [icon(FORMATS[format].icon, true), FORMATS[format].label]),
    h("time", { dateTime: item.publishedAt, title: new Date(item.publishedAt).toLocaleString() }, [ago(item.publishedAt)]),
  ]);
}

function tagList(item: FeedItem): HTMLElement[] {
  return item.tags.length > 0 ? [h("ul", { className: "tags" }, item.tags.map((tag) => h("li", {}, [tag])))] : [];
}

function renderCard(item: FeedItem): HTMLElement {
  const card = FORMAT_OF[item.kind] === "watch" && item.image ? renderWatch(item) : renderRead(item);
  card.dataset.hue = hueFor(item);
  return card;
}

function renderWatch(item: FeedItem): HTMLElement {
  const playable = item.videoId !== undefined;
  const img = h("img", {
    src: playable ? `https://i.ytimg.com/vi/${item.videoId}/hq720.jpg` : item.image!,
    alt: "",
    loading: "lazy",
    decoding: "async",
    referrerPolicy: "no-referrer",
  });
  if (playable) img.addEventListener("error", () => (img.src = item.image!), { once: true });
  const picture = [
    img,
    h("span", { className: "play", ariaHidden: "true" }, [icon("i-play", true)]),
  ];
  const thumb = playable
    ? h("button", { type: "button", className: "thumb", ariaLabel: `Play ${item.title}` }, picture)
    : h("a", { className: "thumb", href: item.url, target: "_blank", rel: "noopener", ariaLabel: item.title }, picture);
  if (playable) thumb.addEventListener("click", () => play(thumb, item), { once: true });

  return h("article", { className: "card watch" }, [
    thumb,
    h("div", { className: "body" }, [
      h("h2", { className: "title" }, [h("a", { href: item.url, target: "_blank", rel: "noopener", className: "plain" }, [item.title])]),
      byline(item),
      ...tagList(item),
    ]),
  ]);
}

function renderRead(item: FeedItem): HTMLElement {
  const mini = item.image
    ? h("img", { className: "mini", src: item.image, alt: "", loading: "lazy", decoding: "async", referrerPolicy: "no-referrer" })
    : undefined;
  mini?.addEventListener("error", () => mini.remove(), { once: true });

  return h("article", { className: `card read${mini ? "" : " jewel"}` }, [
    byline(item, [h("span", { className: "monogram", ariaHidden: "true" }, [initial(item.author)])]),
    h("div", { className: "text" }, [
      h("h2", { className: "title" }, [h("a", { href: item.url, target: "_blank", rel: "noopener", className: "stretch" }, [item.title])]),
      ...(mini ? [mini] : []),
      ...(item.summary ? [h("p", { className: "summary" }, [item.summary])] : []),
    ]),
    h("footer", { className: "foot" }, [
      h("div", {}, tagList(item)),
      h("span", { className: "go", ariaHidden: "true" }, [icon("i-arrow")]),
    ]),
  ]);
}

function play(thumb: HTMLElement, item: FeedItem): void {
  const frame = h("iframe", {
    src: `https://www.youtube-nocookie.com/embed/${item.videoId}?autoplay=1&rel=0`,
    title: item.title,
    allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
    allowFullscreen: true,
  });
  thumb.replaceWith(h("div", { className: "thumb" }, [frame]));
}

function renderCaughtUp(): HTMLElement {
  const el = moment({
    mood: "happy",
    title: "You're all caught up!",
    body: "Everything new from this week is above. Older favourites wait below, if you want them.",
  });
  el.setAttribute("role", "separator");
  cheer.observe(el);
  return el;
}

function renderEnd(): HTMLElement {
  const skipped = feed.errors.length;
  return moment({
    mood: "sleepy",
    title: "That's everything",
    body: "You've seen it all. Go stretch, sip some water, or make something lovely.",
    fine: [
      `Updated ${ago(feed.generatedAt)}.`,
      ...(hiddenCount > 0 ? [`${hiddenCount} post${hiddenCount === 1 ? "" : "s"} hidden by your filters.`] : []),
      ...(skipped > 0 ? [`${skipped} source${skipped === 1 ? "" : "s"} couldn't be reached.`] : []),
    ].join(" "),
  });
}

function moment(options: {
  mood: "happy" | "sleepy";
  title: string;
  body: string;
  fine?: string;
  action?: [string, () => void];
}): HTMLElement {
  const sprout = svg("sprout", "mascot");
  const children: Node[] = [
    sprout,
    h("p", { className: "moment-title" }, [options.title]),
    h("p", {}, [options.body]),
  ];
  if (options.action) {
    const [label, onClick] = options.action;
    const button = h("button", { type: "button", className: "button" }, [label]);
    button.addEventListener("click", onClick);
    children.push(button);
  }
  if (options.fine) children.push(h("p", { className: "fine" }, [options.fine]));
  return h("div", { className: `moment ${options.mood}` }, children);
}

function initial(name: string): string {
  return [...name.trim()][0]?.toUpperCase() ?? "?";
}

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "short" });
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

function svg(className: string, symbol: string): SVGSVGElement {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  el.setAttribute("class", className);
  el.setAttribute("viewBox", symbol === "mascot" ? "0 0 64 64" : "0 0 24 24");
  el.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#${symbol}`);
  el.append(use);
  return el;
}

function icon(id: string, filled = false): SVGSVGElement {
  return svg(filled ? "icon filled" : "icon", id);
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
