import { EXCLUDE_IDS, EXCLUDE_PRESETS, isExcluded, type ExcludeId } from "./shared/excludes";
import { assignHues, hueOf, type Hue } from "./shared/hues";
import { emptyLibrary, isShelved, parseLibrary, shelfItems, SHELVES, toggleShelf, type Library, type Shelf } from "./shared/library";
import { orderFeed } from "./shared/order";
import { blueskyApiUrl, fromBluesky, fromMastodon, mastodonApiUrl, type PostView } from "./shared/post-view";
import { FORMAT_OF, type Feed, type FeedItem, type Format, type SourceKind } from "./shared/types";

type View = "feed" | Shelf;
type Filters = { view: View; show: Format | ""; tags: Set<string>; kind: Set<string>; people: Set<string> };
type ChipGroup = "tags" | "kind" | "people";
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
  bluesky: { label: "Bluesky", icon: "i-chat" },
  mastodon: { label: "Mastodon", icon: "i-chat" },
  twitter: { label: "X", icon: "i-chat" },
  facebook: { label: "Facebook", icon: "i-chat" },
};

const root = document.documentElement;
const list = document.querySelector<HTMLElement>(".list")!;
const sentinel = document.querySelector<HTMLElement>(".sentinel")!;
const controls = document.querySelector<HTMLElement>(".controls")!;
const tabs = controls.querySelector<HTMLElement>(".tabs")!;
const chips = controls.querySelector<HTMLElement>(".chips")!;
const people = controls.querySelector<HTMLElement>(".people")!;
const toggle = document.querySelector<HTMLButtonElement>(".theme-toggle")!;
const viewer = document.querySelector<HTMLDialogElement>(".viewer")!;
const NETWORK: Partial<Record<SourceKind, { name: string; load: (item: FeedItem) => Promise<PostView> }>> = {
  bluesky: { name: "Bluesky", load: (item) => loadPost(blueskyApiUrl(item.id), fromBluesky) },
  mastodon: { name: "Mastodon", load: (item) => loadPost(mastodonApiUrl(item.url), fromMastodon) },
};
const shelfLinks = [...document.querySelectorAll<HTMLButtonElement>(".shelf-link")];
const SHELF_COPY: Record<Shelf, { title: string; empty: string }> = {
  favourites: { title: "Favourites", empty: "Tap the heart on anything you love and it will wait for you here." },
  archive: { title: "Archive", empty: "Mark posts as read or watched and they rest here, out of your feed." },
};
const DONE_LABEL: Record<Format, string> = { watch: "watched", read: "read", post: "read" };
const systemDark = matchMedia("(prefers-color-scheme: dark)");

let feed: Feed;
let hues = new Map<string, Hue>();
let hidden = loadHidden();
let hiddenCount = 0;
let library = loadLibrary();
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

for (const link of shelfLinks) {
  link.addEventListener("click", () => {
    const shelf = link.dataset.shelf as Shelf;
    const filters = readFilters();
    writeFilters({ ...filters, view: filters.view === shelf ? "feed" : shelf });
  });
}

// Esc and a tap on the backdrop close the viewer through history, so Back never needs an extra press.
viewer.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeViewer();
});
viewer.addEventListener("click", (event) => {
  if (event.target === viewer) closeViewer();
});
window.addEventListener("keydown", (event: KeyboardEvent) => {
  if (event.key !== "Escape" || viewer.open || !feed) return;
  const filters = readFilters();
  if (activeFilterCount(filters) > 0) clearFilters(filters);
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
  addEventListener("popstate", () => {
    if (viewer.open) viewer.close();
    else render();
  });
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

function loadLibrary(): Library {
  try {
    return parseLibrary(JSON.parse(localStorage.getItem("library:v1") ?? "null"));
  } catch {
    return emptyLibrary();
  }
}

function saveLibrary(next: Library): void {
  library = next;
  try {
    localStorage.setItem("library:v1", JSON.stringify(next));
  } catch {}
  renderShelfLinks(readFilters().view);
}

function hueFor(item: FeedItem): Hue {
  const tag = item.tags[0];
  return (tag && hues.get(tag)) || hueOf(item.author);
}

function readFilters(): Filters {
  const params = new URLSearchParams(location.search);
  const set = (key: string) => new Set((params.get(key) ?? "").split(",").filter(Boolean));
  const show = params.get("show");
  const view = params.get("view");
  return {
    view: SHELVES.includes(view as Shelf) ? (view as Shelf) : "feed",
    show: show && show in FORMATS ? (show as Format) : "", tags: set("tags"), kind: set("kind"), people: set("people") };
}

function writeFilters(filters: Filters): void {
  const params = new URLSearchParams();
  if (filters.view !== "feed") params.set("view", filters.view);
  if (filters.show) params.set("show", filters.show);
  if (filters.tags.size > 0) params.set("tags", [...filters.tags].join(","));
  if (filters.kind.size > 0) params.set("kind", [...filters.kind].join(","));
  if (filters.people.size > 0) params.set("people", [...filters.people].join(","));
  const query = params.toString().replaceAll("%2C", ",");
  history.pushState(null, "", query ? `?${query}` : location.pathname);
  render();
  scrollTo({ top: 0 });
}

function activeFilterCount(filters: Filters): number {
  return filters.tags.size + filters.kind.size + filters.people.size + (filters.show ? 1 : 0);
}

// Clears what narrows the list; the current list (feed, favourites, archive) and No AI stay as they are.
function clearFilters(filters: Filters): void {
  writeFilters({ view: filters.view, show: "", tags: new Set(), kind: new Set(), people: new Set() });
}

function matchesChips(item: FeedItem, filters: Filters): boolean {
  const tagOk = filters.tags.size === 0 || item.tags.some((tag) => filters.tags.has(tag));
  const kindOk = filters.kind.size === 0 || filters.kind.has(item.kind);
  const personOk = filters.people.size === 0 || filters.people.has(item.author);
  return tagOk && kindOk && personOk;
}

function render(): void {
  const filters = readFilters();
  const { view } = filters;
  renderShelfLinks(view);

  const chipMatches = viewItems(filters);
  renderControls(filters, chipMatches);

  const visible = chipMatches.filter((item) => !filters.show || FORMAT_OF[item.kind] === filters.show);
  if (view === "feed") {
    const { ordered, freshCount } = orderFeed(visible, new Date());
    rows = ordered.map((item): Row => ({ type: "card", item }));
    if (freshCount > 0 && freshCount < ordered.length) rows.splice(freshCount, 0, { type: "caught-up" });
  } else {
    rows = visible.map((item): Row => ({ type: "card", item }));
  }
  rendered = 0;
  list.replaceChildren(...(view === "feed" ? [] : [shelfHead(view, Object.keys(library[view]).length)]));

  if (rows.length === 0) {
    const shelfEmpty = view !== "feed" && Object.keys(library[view]).length === 0;
    list.append(
      moment({
        mood: "sleepy",
        title: shelfEmpty ? `Your ${SHELF_COPY[view].title.toLowerCase()} is empty` : "Nothing here yet",
        body: shelfEmpty ? SHELF_COPY[view].empty : "No posts match these filters.",
        action: shelfEmpty
          ? ["Back to the feed", () => writeFilters({ ...filters, view: "feed" })]
          : ["Show everything", () => writeFilters({ view, show: "", tags: new Set(), kind: new Set(), people: new Set() })],
      }),
    );
    return;
  }
  appendPage();
}

// The feed hides archived posts and excluded topics; a shelf shows exactly what you saved.
function viewItems(filters: Filters): FeedItem[] {
  const { view } = filters;
  const source =
    view === "feed"
      ? feed.items.filter((item) => !isShelved(library, "archive", item.id))
      : shelfItems(library, view, new Map(feed.items.map((item) => [item.id, item])));
  const kept = view === "feed" ? source.filter((item) => !isExcluded(item, hidden)) : source;
  hiddenCount = source.length - kept.length;
  return kept.filter((item) => matchesChips(item, filters));
}

function refreshControls(): void {
  const filters = readFilters();
  renderShelfLinks(filters.view);
  renderControls(filters, viewItems(filters));
}

function renderShelfLinks(view: View): void {
  for (const link of shelfLinks) {
    const shelf = link.dataset.shelf as Shelf;
    const count = Object.keys(library[shelf]).length;
    const badge = link.querySelector<HTMLElement>(".badge")!;
    badge.textContent = String(count);
    badge.hidden = count === 0;
    link.setAttribute("aria-pressed", String(view === shelf));
    link.setAttribute("aria-label", `${SHELF_COPY[shelf].title}, ${count} saved`);
  }
}

function shelfHead(shelf: Shelf, count: number): HTMLElement {
  const back = h("button", { type: "button", className: "button quiet" }, ["Back to the feed"]);
  back.addEventListener("click", () => writeFilters({ ...readFilters(), view: "feed" }));
  return h("header", { className: "shelf-head" }, [
    h("h2", {}, [SHELF_COPY[shelf].title, h("span", { className: "count" }, [String(count)])]),
    back,
  ]);
}

function appendPage(): void {
  const page = rows.slice(rendered, rendered + PAGE_SIZE);
  list.append(...page.map((row) => (row.type === "card" ? renderCard(row.item) : renderCaughtUp())));
  rendered += page.length;
  if (rendered >= rows.length && readFilters().view === "feed") list.append(renderEnd());
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

  const chip = (group: ChipGroup, value: string, lead: Node, label: string, hue?: Hue) => {
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

  const active = activeFilterCount(filters);
  const clear = h("button", { type: "button", className: "chip clear-chip", title: "Clear filters (Esc)", ariaLabel: `Clear ${active} filter${active === 1 ? "" : "s"}` }, [
    icon("i-x"),
    "Clear",
    h("span", { className: "count" }, [String(active)]),
  ]);
  clear.addEventListener("click", () => clearFilters(filters));

  chips.replaceChildren(
    ...(active > 0 ? [clear] : []),
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

  const authors = new Map<string, Hue>();
  for (const item of feed.items) if (!authors.has(item.author)) authors.set(item.author, hueFor(item));
  people.replaceChildren(
    ...[...authors]
      .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base" }))
      .map(([author, hue]) =>
        chip("people", author, h("span", { className: "monogram", ariaHidden: "true" }, [initial(author)]), author, hue),
      ),
  );
}

function byline(item: FeedItem, lead: Node[] = []): HTMLElement {
  const format = FORMAT_OF[item.kind];
  return h("header", { className: "byline" }, [
    ...lead,
    h("span", { className: "author" }, [item.author]),
    // The thumbnail and play button already say "video", so watch cards skip the pill.
    ...(format === "watch" ? [] : [h("span", { className: "format" }, [icon(FORMATS[format].icon, true), FORMATS[format].label])]),
    h("time", { dateTime: item.publishedAt, title: new Date(item.publishedAt).toLocaleString() }, [ago(item.publishedAt)]),
  ]);
}

function tagList(item: FeedItem): HTMLElement[] {
  return item.tags.length > 0 ? [h("ul", { className: "tags" }, item.tags.map((tag) => h("li", {}, [tag])))] : [];
}

function renderCard(item: FeedItem): HTMLElement {
  const format = FORMAT_OF[item.kind];
  const card =
    format === "watch" && item.image ? renderWatch(item) : format === "post" ? renderPost(item) : renderRead(item);
  card.dataset.hue = hueFor(item);
  card.dataset.id = item.id;
  return card;
}

function actions(item: FeedItem, after?: (shelf: Shelf) => void): HTMLElement {
  const done = DONE_LABEL[FORMAT_OF[item.kind]];
  const button = (shelf: Shelf, iconId: string, on: string, off: string) => {
    const active = isShelved(library, shelf, item.id);
    const el = h("button", { type: "button", className: `act act-${shelf}`, title: active ? on : off, ariaLabel: active ? on : off }, [
      icon(iconId, shelf === "favourites" && active),
    ]);
    el.setAttribute("aria-pressed", String(active));
    el.addEventListener("click", () => {
      shelve(item, shelf);
      after?.(shelf);
    });
    return el;
  };
  return h("div", { className: "actions" }, [
    button("favourites", "i-heart", "Remove from favourites", "Add to favourites"),
    button("archive", "i-check", `Mark as not ${done}`, `Mark as ${done}`),
  ]);
}

function shelve(item: FeedItem, shelf: Shelf): void {
  const wasOn = isShelved(library, shelf, item.id);
  saveLibrary(toggleShelf(library, shelf, item, new Date()));
  const view = readFilters().view;
  const card = list.querySelector<HTMLElement>(`.card[data-id="${CSS.escape(item.id)}"]`);
  const leaves = (view === "feed" && shelf === "archive") || (view === shelf && wasOn);
  if (card && leaves) collapseOut(card);
  else card?.replaceWith(renderCard(item));
  refreshControls();
}

// The card fades out, then the cards after it glide into the gap (a FLIP from their old positions).
function collapseOut(card: HTMLElement): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    card.remove();
    return;
  }
  card.style.pointerEvents = "none";
  const exit = card.animate(
    [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(0.94)" },
    ],
    { duration: 220, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
  );
  exit.addEventListener("finish", () => {
    const followers: HTMLElement[] = [];
    for (let el = card.nextElementSibling; el && followers.length < 24; el = el.nextElementSibling) {
      if (el instanceof HTMLElement) followers.push(el);
    }
    const before = followers.map((el) => el.getBoundingClientRect());
    card.remove();
    followers.forEach((el, i) => {
      const after = el.getBoundingClientRect();
      const dx = before[i]!.left - after.left;
      const dy = before[i]!.top - after.top;
      if (dx === 0 && dy === 0) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], {
        duration: 450,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      });
    });
  });
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
      h("footer", { className: "foot" }, [h("div", {}, tagList(item)), actions(item)]),
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
      h("h2", { className: "title" }, [
        h("a", { href: item.url, target: "_blank", rel: "noopener", className: "stretch" }, [item.title || "Untitled"]),
      ]),
      ...(mini ? [mini] : []),
      ...(item.summary ? [h("p", { className: "summary" }, [item.summary])] : []),
    ]),
    h("footer", { className: "foot" }, [
      h("div", {}, tagList(item)),
      actions(item),
      h("span", { className: "go", ariaHidden: "true" }, [icon("i-arrow")]),
    ]),
  ]);
}

function renderPost(item: FeedItem): HTMLElement {
  const text = item.summary || item.title;
  const picture = item.image
    ? h("img", { className: "post-image", src: item.image, alt: "", loading: "lazy", decoding: "async", referrerPolicy: "no-referrer" })
    : undefined;
  picture?.addEventListener("error", () => picture.remove(), { once: true });

  const link = h("a", { href: item.url, target: "_blank", rel: "noopener", className: "stretch", ariaLabel: `${item.author}: ${text}` }, [text]);
  if (NETWORK[item.kind]) {
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      openViewer(item);
    });
  }

  return h("article", { className: "card post" }, [
    byline(item, [h("span", { className: "monogram", ariaHidden: "true" }, [initial(item.author)])]),
    h("p", { className: "post-text" }, [link]),
    ...(picture ? [picture] : []),
    h("footer", { className: "foot" }, [
      h("div", {}, tagList(item)),
      actions(item),
      h("span", { className: "go", ariaHidden: "true" }, [icon("i-arrow")]),
    ]),
  ]);
}

async function loadPost(api: string | undefined, normalize: (json: unknown) => PostView): Promise<PostView> {
  if (!api) throw new Error("no API URL for this post");
  const response = await fetch(api, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return normalize(await response.json());
}

// The viewer shows one post in full and nothing else: no replies, no profile, no "more like this".
function openViewer(item: FeedItem): void {
  const network = NETWORK[item.kind]!;
  const body = h("div", { className: "viewer-body" }, [h("p", { className: "viewer-text" }, [item.summary || item.title])]);
  const media = h("div", { className: "viewer-media loading", ariaBusy: "true" });
  const close = h("button", { type: "button", className: "viewer-close", ariaLabel: "Close" }, [icon("i-x")]);
  close.addEventListener("click", closeViewer);
  const head = h("header", { className: "viewer-head" }, [
    h("span", { className: "monogram", ariaHidden: "true" }, [initial(item.author)]),
    h("div", { className: "who" }, [h("strong", {}, [item.author]), h("span", {}, [network.name])]),
    close,
  ]);
  const foot = h("footer", { className: "viewer-foot" });
  const renderFoot = () =>
    foot.replaceChildren(
      actions(item, (shelf) => {
        if (shelf === "archive" && isShelved(library, "archive", item.id)) closeViewer();
        else renderFoot();
      }),
      h("a", { className: "viewer-out", href: item.url, target: "_blank", rel: "noopener" }, [`Open on ${network.name}`, icon("i-arrow")]),
    );
  renderFoot();

  const sheet = h("article", { className: "viewer-sheet" }, [
    head,
    h("time", { className: "viewer-time", dateTime: item.publishedAt }, [new Date(item.publishedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })]),
    body,
    media,
    foot,
  ]);
  sheet.dataset.hue = hueFor(item);
  viewer.replaceChildren(sheet);
  history.pushState({ viewer: true }, "", location.href);
  viewer.showModal();
  close.focus({ focusVisible: false } as FocusOptions);

  network
    .load(item)
    .then((post) => {
      if (!sheet.isConnected) return;
      if (post.author.avatar) {
        const avatar = h("img", { className: "avatar", src: post.author.avatar, alt: "", referrerPolicy: "no-referrer" });
        avatar.addEventListener("error", () => avatar.remove(), { once: true });
        head.querySelector(".monogram")!.replaceWith(avatar);
      }
      head.querySelector(".who span")!.textContent = `${post.author.handle} on ${network.name}`;
      body.replaceChildren(
        h(
          "p",
          { className: "viewer-text" },
          post.body.map((segment) =>
            segment.href ? h("a", { href: segment.href, target: "_blank", rel: "noopener" }, [segment.text]) : document.createTextNode(segment.text),
          ),
        ),
      );
      media.replaceChildren(...postMedia(post, item.url, network.name));
      media.classList.remove("loading");
      media.removeAttribute("aria-busy");
    })
    .catch(() => {
      if (!sheet.isConnected) return;
      media.classList.remove("loading");
      media.removeAttribute("aria-busy");
      media.replaceChildren(h("p", { className: "viewer-note" }, [`Couldn't load the full post from ${network.name}. Here's what the feed had.`]));
    });
}

function postMedia(post: PostView, postUrl: string, network: string): HTMLElement[] {
  const parts: HTMLElement[] = [];
  if (post.images.length > 0) {
    parts.push(
      h(
        "div",
        { className: `viewer-images count-${Math.min(post.images.length, 4)}` },
        post.images.map((image) => {
          const img = h("img", { src: image.src, alt: image.alt, loading: "lazy", decoding: "async", referrerPolicy: "no-referrer" });
          if (post.images.length === 1 && image.ratio) img.style.aspectRatio = String(image.ratio);
          return img;
        }),
      ),
    );
  }
  if (post.video) {
    parts.push(
      h("a", { className: "viewer-video", href: postUrl, target: "_blank", rel: "noopener" }, [
        ...(post.video.poster ? [h("img", { src: post.video.poster, alt: "", referrerPolicy: "no-referrer" })] : []),
        h("span", { className: "play", ariaHidden: "true" }, [icon("i-play", true)]),
        h("span", { className: "viewer-video-note" }, [`Video plays on ${network}`]),
      ]),
    );
  }
  if (post.link) {
    const { url, title, description, image } = post.link;
    parts.push(
      h("a", { className: "viewer-link", href: url, target: "_blank", rel: "noopener" }, [
        ...(image ? [h("img", { src: image, alt: "", loading: "lazy", referrerPolicy: "no-referrer" })] : []),
        h("span", { className: "viewer-link-text" }, [
          h("strong", {}, [title]),
          ...(description ? [h("span", {}, [description])] : []),
          h("small", {}, [new URL(url).hostname.replace(/^www\./, "")]),
        ]),
      ]),
    );
  }
  if (post.quote) {
    parts.push(h("blockquote", { className: "viewer-quote" }, [h("strong", {}, [post.quote.author]), h("p", {}, [post.quote.text])]));
  }
  return parts;
}

function closeViewer(): void {
  if (!viewer.open) return;
  if (history.state?.viewer) history.back();
  else viewer.close();
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
