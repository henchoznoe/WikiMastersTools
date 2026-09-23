import { describe, expect, it } from 'vitest';
import { loadCollection } from '../src/features/collection';

const card = (id: string, rarity: string) => ({
  id,
  card: { id, wikipedia_title: id, rarity },
});

describe('loadCollection', () => {
  it('returns a partial rare selection without loading unnecessary pages', async () => {
    const paths: string[] = [];
    const result = await loadCollection(['UR'], undefined, async (path) => {
      paths.push(path);
      if (path.includes('page=0'))
        return { total: 6, collection: [card('a', 'L'), card('b', 'UR')] };
      return { collection: [card('c', 'SR'), card('d', 'R')] };
    });
    expect(paths).toHaveLength(2);
    expect(result.cards.map((item) => item.id)).toEqual(['b']);
    expect(result.complete).toBe(false);
  });

  it('merges different owned copies of a card', async () => {
    const result = await loadCollection(undefined, undefined, async () => ({
      total: 2,
      collection: [card('a', 'C'), { ...card('a', 'C'), id: 'copy-2' }],
    }));
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]?.count).toBe(2);
  });
});
