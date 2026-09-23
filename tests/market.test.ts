import { describe, expect, it } from 'vitest';
import { createListing } from '../src/features/market';

const card = {
  id: 'catalogue',
  title: 'Test',
  rarity: 'C' as const,
  imageUrl: null,
  count: 2,
  ownedCardIds: ['copy1', 'copy2'],
};

describe('createListing', () => {
  it('does not resell a copy already listed', async () => {
    let submitted: string | undefined;
    await createListing(card, 25, 60, async (path, init) => {
      if (path.endsWith('/mine')) return { auctions: [{ card_id: 'copy1' }] };
      submitted = init?.body as string;
      return {};
    });
    expect(JSON.parse(submitted ?? '{}').card_id).toBe('copy2');
  });
});
