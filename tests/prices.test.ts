import { describe, expect, it, vi } from 'vitest';
import type { PriceStorage } from '../src/features/prices';
import { PRICE_TTL_MS, PriceService } from '../src/features/prices';

function storage(): PriceStorage {
  const values: Record<string, unknown> = {};
  return {
    async get(key) {
      return { [key]: values[key] };
    },
    async set(next) {
      Object.assign(values, next);
    },
  };
}

describe('PriceService', () => {
  it('uses a 24-hour cache and refreshes afterward', async () => {
    let now = 1000;
    const request = vi.fn(async () => ({ summary: { UR: { average: 123 } } }));
    const service = new PriceService(storage(), request, () => now);
    expect((await service.get('card')).averages.UR).toBe(123);
    now += PRICE_TTL_MS - 1;
    await service.get('card');
    expect(request).toHaveBeenCalledTimes(1);
    now += 1;
    await service.get('card');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent requests and retries failures after five minutes', async () => {
    let now = 0;
    const request = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ summary: { C: { average: 3 } } });
    const service = new PriceService(storage(), request, () => now);
    const [first, second] = await Promise.all([
      service.get('x'),
      service.get('x'),
    ]);
    expect(first.failed).toBe(true);
    expect(second.failed).toBe(true);
    expect(request).toHaveBeenCalledTimes(1);
    now = 5 * 60 * 1000;
    expect((await service.get('x')).averages.C).toBe(3);
  });
});
