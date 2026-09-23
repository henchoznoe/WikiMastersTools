// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { placeCardBadges } from '../src/content/cards';
import type { PriceService } from '../src/features/prices';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('card badges on a simulated WikiMasters page', () => {
  it('places one badge on a matching card and skips duplicates', async () => {
    document.body.innerHTML =
      '<main><div class="cursor-pointer rounded-2xl"><img alt="Écaille de tortue" /></div></main>';
    Object.defineProperty(globalThis, 'CSS', {
      value: { escape: (value: string) => value },
      configurable: true,
    });
    const prices = {
      average: vi.fn().mockResolvedValue(42),
    } as unknown as PriceService;
    const cards = [
      {
        id: 'card-1',
        title: 'Écaille de tortue',
        rarity: 'SR' as const,
        imageUrl: null,
        count: 1,
        ownedCardIds: [],
      },
    ];
    await placeCardBadges(cards, prices);
    await placeCardBadges(cards, prices);
    expect(document.querySelectorAll('[data-wmt-card="card-1"]')).toHaveLength(
      1,
    );
    expect(
      document.querySelector('.cursor-pointer > [data-wmt-card]'),
    ).not.toBeNull();
    expect(prices.average).toHaveBeenCalledTimes(1);
  });
});
