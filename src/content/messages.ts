export const PUBLIC_CARD_EVENT = 'wmt:public-card-id';
export const PUBLIC_MARKET_CARDS_EVENT = 'wmt:public-market-cards';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PublicCardMessage {
  cardId: string;
}

export function parsePublicCardMessage(
  value: unknown,
): PublicCardMessage | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.cardId === 'string' && UUID.test(candidate.cardId)
    ? { cardId: candidate.cardId }
    : null;
}

export interface PublicMarketCard {
  id: string;
  title: string;
  rarity: string | null;
}

export function parsePublicMarketCards(value: unknown): PublicMarketCard[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 200).flatMap((candidate) => {
    if (!candidate || typeof candidate !== 'object') return [];
    const card = candidate as Record<string, unknown>;
    if (
      typeof card.id !== 'string' ||
      !UUID.test(card.id) ||
      typeof card.title !== 'string'
    )
      return [];
    return [
      {
        id: card.id,
        title: card.title,
        rarity: typeof card.rarity === 'string' ? card.rarity : null,
      },
    ];
  });
}
