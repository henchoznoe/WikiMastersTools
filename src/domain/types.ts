export const RARITIES = ['L', 'UR', 'SR', 'R', 'PC', 'C'] as const;
export type Rarity = (typeof RARITIES)[number];

export interface Card {
  id: string;
  title: string;
  rarity: Rarity | null;
  imageUrl: string | null;
  count: number;
  ownedCardIds: string[];
}

export interface PriceSummary {
  cardId: string;
  averages: Partial<Record<Rarity, number>>;
  fetchedAt: number;
  failed?: boolean;
}

export interface ValuedCard extends Card {
  average: number | null;
}

export interface CollectionResult {
  cards: Card[];
  loadedPages: number;
  totalPages: number;
  complete: boolean;
}

export interface TradeSide {
  username: string;
  currency: number;
  cards: Card[];
}

export interface Trade {
  id: string;
  status: string;
  initiator: TradeSide;
  recipient: TradeSide;
}

export function isRarity(value: unknown): value is Rarity {
  return typeof value === 'string' && RARITIES.includes(value as Rarity);
}

export function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function string(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function number(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseCard(
  value: unknown,
  ownedId?: unknown,
  fallbackId?: unknown,
): Card | null {
  const raw = record(value);
  const id = string(raw.id || fallbackId);
  const title = string(raw.wikipedia_title || raw.title);
  if (!id || !title) return null;
  const copyId = string(ownedId);
  return {
    id,
    title,
    rarity: isRarity(raw.rarity) ? raw.rarity : null,
    imageUrl: string(raw.image_url) || null,
    count: 1,
    ownedCardIds: copyId ? [copyId] : [],
  };
}

export function parseCollectionEntry(value: unknown): Card | null {
  const raw = record(value);
  const card = parseCard(raw.card, raw.id, raw.card_id);
  if (!card) return null;
  return { ...card, count: Math.max(1, number(raw.count) || 1) };
}

export function mergeCards(cards: Card[]): Card[] {
  const byId = new Map<string, Card>();
  for (const card of cards) {
    const previous = byId.get(card.id);
    if (!previous) {
      byId.set(card.id, { ...card, ownedCardIds: [...card.ownedCardIds] });
      continue;
    }
    const ids = [...new Set([...previous.ownedCardIds, ...card.ownedCardIds])];
    previous.count = Math.max(previous.count, card.count, ids.length);
    previous.ownedCardIds = ids;
  }
  return [...byId.values()];
}

export function groupValuedCards(cards: ValuedCard[]): ValuedCard[] {
  const grouped = new Map<string, ValuedCard>();
  for (const card of cards) {
    const current = grouped.get(card.id);
    if (current) current.count += card.count;
    else grouped.set(card.id, { ...card });
  }
  return [...grouped.values()];
}

export function formatPrice(amount: number | null): string {
  return amount === null
    ? '—'
    : `${new Intl.NumberFormat('fr-CH').format(Math.round(amount))} WB`;
}

export function normalizedTitle(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .trim();
}
