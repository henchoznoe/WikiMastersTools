import { describe, expect, it } from 'vitest';
import type { Card, Trade } from '../src/domain/types';
import type { PriceService } from '../src/features/prices';
import { selectTrades, valueSide } from '../src/features/trades';

const emptySide = { username: 'joueur', currency: 0, cards: [] };

function trade(status: string): Trade {
  return { id: status, status, initiator: emptySide, recipient: emptySide };
}

describe('trade estimation', () => {
  it('excludes completed trades unless history is requested', () => {
    const items = [trade('accepted'), trade('declined'), trade('pending')];
    expect(selectTrades(items, false).map((item) => item.id)).toEqual([
      'pending',
    ]);
    expect(selectTrades(items, true)).toHaveLength(3);
  });

  it('values every card while limiting simultaneous price requests', async () => {
    const cards = Array.from({ length: 21 }, (_, index) => ({
      id: `${index}`,
      title: `Carte ${index}`,
      rarity: 'C' as const,
      ownedCardIds: [],
      imageUrl: null,
      count: 1,
    })) satisfies Card[];
    let pending = 0;
    let maximum = 0;
    const prices = {
      average: async () => {
        pending += 1;
        maximum = Math.max(maximum, pending);
        await Promise.resolve();
        pending -= 1;
        return 2;
      },
    } as unknown as PriceService;
    expect(await valueSide({ ...emptySide, currency: 3, cards }, prices)).toBe(
      45,
    );
    expect(maximum).toBeLessThanOrEqual(8);
  });
});
