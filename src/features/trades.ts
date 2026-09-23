import { apiJson } from '../api/client';
import {
  type Card,
  number,
  parseCard,
  record,
  string,
  type Trade,
  type TradeSide,
} from '../domain/types';
import type { PriceService } from './prices';

const HISTORY_STATUSES = new Set([
  'accepted',
  'declined',
  'rejected',
  'cancelled',
  'canceled',
  'expired',
]);

export function selectTrades(
  trades: Trade[],
  includeHistory: boolean,
): Trade[] {
  return includeHistory
    ? trades
    : trades.filter(
        (trade) => !HISTORY_STATUSES.has(trade.status.toLowerCase()),
      );
}

function side(
  raw: Record<string, unknown>,
  owner: 'initiator' | 'recipient',
): TradeSide {
  const person = record(raw[owner]);
  const id = string(raw[`${owner}_id`]);
  const items = Array.isArray(raw.items) ? raw.items : [];
  const cards: Card[] = [];
  for (const value of items) {
    const item = record(value);
    if (string(item.offered_by) !== id) continue;
    const card = parseCard(item.card, item.id, item.card_id);
    if (card) {
      if (typeof item.snapshot_rarity === 'string') {
        const snapshot = item.snapshot_rarity;
        if (
          snapshot === 'L' ||
          snapshot === 'UR' ||
          snapshot === 'SR' ||
          snapshot === 'R' ||
          snapshot === 'PC' ||
          snapshot === 'C'
        )
          card.rarity = snapshot;
      }
      cards.push(card);
    }
  }
  return {
    username:
      string(person.username) ||
      (owner === 'initiator' ? 'Initiateur' : 'Destinataire'),
    currency: number(raw[`${owner}_wikibidous`]),
    cards,
  };
}

export async function loadTrades(
  request: (path: string) => Promise<unknown> = apiJson,
): Promise<Trade[]> {
  const payload = record(await request('/api/trades'));
  const values = Array.isArray(payload.trades) ? payload.trades : [];
  return values.flatMap((value) => {
    const raw = record(value);
    const id = string(raw.id);
    if (!id) return [];
    return [
      {
        id,
        status: string(raw.status),
        initiator: side(raw, 'initiator'),
        recipient: side(raw, 'recipient'),
      },
    ];
  });
}

export async function valueSide(
  side: TradeSide,
  prices: PriceService,
): Promise<number> {
  let total = side.currency;
  for (let index = 0; index < side.cards.length; index += 8) {
    const averages = await Promise.all(
      side.cards.slice(index, index + 8).map((card) => prices.average(card)),
    );
    total += averages.reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
  }
  return total;
}
