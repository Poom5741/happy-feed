import { SOURCE_KINDS, type FeedItem } from "./types";

export type Shelf = "favourites" | "archive";
export const SHELVES: readonly Shelf[] = ["favourites", "archive"];

export type Saved = { item: FeedItem; at: string };
export type Library = Record<Shelf, Record<string, Saved>>;

export const emptyLibrary = (): Library => ({ favourites: {}, archive: {} });

export function isShelved(library: Library, shelf: Shelf, id: string): boolean {
  return id in library[shelf];
}

export function toggleShelf(library: Library, shelf: Shelf, item: FeedItem, now: Date): Library {
  const { [item.id]: existing, ...rest } = library[shelf];
  return {
    ...library,
    [shelf]: existing ? rest : { ...library[shelf], [item.id]: { item, at: now.toISOString() } },
  };
}

// Newest save first. A post still in the feed shows its fresh copy; one that aged out shows the snapshot.
export function shelfItems(library: Library, shelf: Shelf, current: ReadonlyMap<string, FeedItem>): FeedItem[] {
  return Object.values(library[shelf])
    .sort((a, b) => b.at.localeCompare(a.at))
    .map(({ item }) => current.get(item.id) ?? item);
}

export function parseLibrary(raw: unknown): Library {
  const library = emptyLibrary();
  if (!isRecord(raw)) return library;
  for (const shelf of SHELVES) {
    const entries = raw[shelf];
    if (!isRecord(entries)) continue;
    for (const [id, saved] of Object.entries(entries)) {
      if (isRecord(saved) && typeof saved.at === "string" && isFeedItem(saved.item) && saved.item.id === id) {
        library[shelf][id] = { item: saved.item, at: saved.at };
      }
    }
  }
  return library;
}

function isFeedItem(value: unknown): value is FeedItem {
  return (
    isRecord(value) &&
    ["id", "title", "url", "publishedAt", "author"].every((key) => typeof value[key] === "string") &&
    SOURCE_KINDS.includes(value.kind as FeedItem["kind"]) &&
    Array.isArray(value.tags)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
