import type { ValuedCard } from '../domain/types';
import { loadCollection } from './collection';
import type { PriceService } from './prices';

export class NormalPackRecap {
  private baseline: Map<string, number> | null = null;
  private listeners = new Set<(cards: ValuedCard[]) => void>();
  private running = false;

  constructor(private readonly prices: PriceService) {}

  subscribe(listener: (cards: ValuedCard[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async prepare(): Promise<void> {
    try {
      const result = await loadCollection();
      if (result.complete)
        this.baseline = new Map(
          result.cards.map((card) => [card.id, card.count]),
        );
    } catch {
      this.baseline = null;
    }
  }

  async afterNativeOpen(): Promise<void> {
    if (!this.baseline || this.running) return;
    this.running = true;
    try {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const result = await loadCollection();
        if (!result.complete) return;
        const newCards = result.cards.flatMap((card) => {
          const difference = Math.max(
            0,
            card.count - (this.baseline?.get(card.id) ?? 0),
          );
          return Array.from({ length: difference }, () => ({
            ...card,
            count: 1,
          }));
        });
        if (!newCards.length) continue;
        this.baseline = new Map(
          result.cards.map((card) => [card.id, card.count]),
        );
        const valued = await Promise.all(
          newCards.map(async (card) => ({
            ...card,
            average: await this.prices.average(card),
          })),
        );
        const sorted = valued.toSorted(
          (a, b) => (b.average ?? -1) - (a.average ?? -1),
        );
        for (const listener of this.listeners) listener(sorted);
        return;
      }
    } finally {
      this.running = false;
    }
  }
}
