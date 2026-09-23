import { apiJson, parsePriceSummary } from '../api/client';
import type { Card, PriceSummary, Rarity } from '../domain/types';

export const PRICE_TTL_MS = 24 * 60 * 60 * 1000;
const ERROR_TTL_MS = 5 * 60 * 1000;

export interface PriceStorage {
  get(key: string): Promise<Record<string, unknown>>;
  set(values: Record<string, unknown>): Promise<void>;
}

export class PriceService {
  private readonly pending = new Map<string, Promise<PriceSummary>>();
  private readonly memory = new Map<string, PriceSummary>();

  constructor(
    private readonly storage: PriceStorage,
    private readonly request: (path: string) => Promise<unknown> = apiJson,
    private readonly now: () => number = Date.now,
  ) {}

  async get(cardId: string): Promise<PriceSummary> {
    const key = `price-v1:${cardId}`;
    const cached = this.memory.get(cardId) ?? (await this.read(key));
    if (
      cached &&
      this.now() - cached.fetchedAt <
        (cached.failed ? ERROR_TTL_MS : PRICE_TTL_MS)
    ) {
      return cached;
    }
    const existing = this.pending.get(cardId);
    if (existing) return existing;
    const task = this.fetch(cardId, key);
    this.pending.set(cardId, task);
    try {
      return await task;
    } finally {
      this.pending.delete(cardId);
    }
  }

  async average(card: Card): Promise<number | null> {
    if (!card.rarity) return null;
    const summary = await this.get(card.id);
    return summary.averages[card.rarity] ?? null;
  }

  async isCached(cardId: string): Promise<boolean> {
    const cached =
      this.memory.get(cardId) ?? (await this.read(`price-v1:${cardId}`));
    return Boolean(
      cached && !cached.failed && this.now() - cached.fetchedAt < PRICE_TTL_MS,
    );
  }

  private async read(key: string): Promise<PriceSummary | null> {
    const value = (await this.storage.get(key))[key];
    if (!value || typeof value !== 'object') return null;
    const candidate = value as PriceSummary;
    if (
      typeof candidate.fetchedAt !== 'number' ||
      typeof candidate.averages !== 'object'
    )
      return null;
    this.memory.set(candidate.cardId, candidate);
    return candidate;
  }

  private async fetch(cardId: string, key: string): Promise<PriceSummary> {
    let summary: PriceSummary;
    try {
      const response = await this.request(
        `/api/marketplace/cards/${encodeURIComponent(cardId)}/sales?scope=summary`,
      );
      summary = {
        cardId,
        averages: parsePriceSummary(response) as Partial<
          Record<Rarity, number>
        >,
        fetchedAt: this.now(),
      };
    } catch {
      summary = { cardId, averages: {}, fetchedAt: this.now(), failed: true };
    }
    this.memory.set(cardId, summary);
    await this.storage.set({ [key]: summary });
    return summary;
  }
}
