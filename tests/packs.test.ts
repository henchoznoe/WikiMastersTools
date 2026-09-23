import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/api/client';
import { openPacks } from '../src/features/packs';

const response = {
  cards: [{ id: 'a', wikipedia_title: 'Carte A', rarity: 'C' }],
  packs_remaining: 4,
};

describe('openPacks', () => {
  it('opens the selected count and reports progress', async () => {
    const seen: number[] = [];
    const result = await openPacks(
      2,
      (progress) => seen.push(progress.opened),
      async () => response,
    );
    expect(seen).toEqual([1, 2]);
    expect(result.cards).toHaveLength(2);
  });

  it('stops on verification or rate limits without retrying', async () => {
    let calls = 0;
    const result = await openPacks(
      'all',
      () => {},
      async () => {
        calls += 1;
        if (calls === 2) throw new ApiError('Too many requests', 429);
        return response;
      },
    );
    expect(calls).toBe(2);
    expect(result.opened).toBe(1);
    expect(result.stoppedReason).toMatch(/limite/);
  });

  it('rejects invalid quantities', async () => {
    await expect(openPacks(0, () => {})).rejects.toThrow();
  });
});
