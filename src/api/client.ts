import { number, record, string } from '../domain/types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiJson(
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const response = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: { accept: 'application/json', ...init.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const data = record(body);
    const message =
      string(data.error || data.message) || `Erreur HTTP ${response.status}`;
    throw new ApiError(message, response.status);
  }
  return body;
}

export function parsePriceSummary(value: unknown): Record<string, number> {
  const summary = record(record(value).summary);
  const averages: Record<string, number> = {};
  for (const [rarity, raw] of Object.entries(summary)) {
    const average = number(record(raw).average);
    if (average > 0) averages[rarity] = average;
  }
  return averages;
}
