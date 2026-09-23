import { apiJson } from '../api/client';
import {
  type Card,
  type CollectionResult,
  mergeCards,
  parseCollectionEntry,
  RARITIES,
  type Rarity,
  record,
} from '../domain/types';

const MAX_PAGES = 200;

export async function loadCollection(
  rarities: readonly Rarity[] = RARITIES,
  onProgress?: (loaded: number, total: number) => void,
  request: (path: string) => Promise<unknown> = apiJson,
): Promise<CollectionResult> {
  const all: Card[] = [];
  let totalPages = 1;
  let loadedPages = 0;
  let complete = true;
  const lowestIndex = Math.max(
    ...rarities.map((rarity) => RARITIES.indexOf(rarity)),
  );
  for (let page = 0; page < Math.min(totalPages, MAX_PAGES); page += 1) {
    const value = record(
      await request(
        `/api/my-collection?sort=rarity&page=${page}&stats=${page === 0 ? 1 : 0}`,
      ),
    );
    const entries = Array.isArray(value.collection) ? value.collection : [];
    const cards = entries
      .map(parseCollectionEntry)
      .filter((card): card is Card => card !== null);
    if (page === 0) {
      const total = Number(value.total);
      totalPages =
        Number.isFinite(total) && cards.length > 0
          ? Math.max(1, Math.ceil(total / cards.length))
          : 1;
    }
    all.push(...cards);
    loadedPages += 1;
    onProgress?.(loadedPages, totalPages);
    if (cards.length === 0) break;
    const last = cards.at(-1);
    if (last?.rarity && RARITIES.indexOf(last.rarity) > lowestIndex) {
      complete = false;
      break;
    }
  }
  if (loadedPages < totalPages) complete = false;
  return {
    cards: mergeCards(all).filter(
      (card) => card.rarity && rarities.includes(card.rarity),
    ),
    loadedPages,
    totalPages,
    complete,
  };
}
