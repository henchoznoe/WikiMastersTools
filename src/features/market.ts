import { apiJson } from '../api/client';
import { type Card, parseCard, record, string } from '../domain/types';

export interface Listing {
  id: string;
  card: Card;
  amount: number;
}

function parseListing(value: unknown): Listing | null {
  const raw = record(value);
  const card = parseCard(raw.card, undefined, raw.card_id);
  const id = string(raw.id);
  if (!card || !id) return null;
  return { id, card, amount: Number(raw.base_amount) || 0 };
}

export async function loadListings(
  request: (path: string) => Promise<unknown> = apiJson,
): Promise<Listing[]> {
  const payload = record(await request('/api/marketplace'));
  const values = Array.isArray(payload.auctions)
    ? payload.auctions
    : Array.isArray(payload.listings)
      ? payload.listings
      : Array.isArray(payload.items)
        ? payload.items
        : [];
  return values
    .map(parseListing)
    .filter((item): item is Listing => item !== null);
}

export async function loadListingDetail(
  listingId: string,
  request: (path: string) => Promise<unknown> = apiJson,
): Promise<Listing | null> {
  const payload = record(
    await request(`/api/marketplace/${encodeURIComponent(listingId)}`),
  );
  return parseListing(payload.auction);
}

export async function createListing(
  card: Card,
  price: number,
  durationMinutes: number,
  request: (path: string, init?: RequestInit) => Promise<unknown> = apiJson,
): Promise<void> {
  if (!Number.isInteger(price) || price < 1)
    throw new Error('Le prix doit être un entier positif.');
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1)
    throw new Error('Durée invalide.');
  const mine = await request('/api/marketplace/mine');
  const mineText = JSON.stringify(mine);
  const copyId = card.ownedCardIds.find((id) => !mineText.includes(id));
  if (!copyId) throw new Error('Aucune copie disponible pour la vente.');
  await request('/api/marketplace', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      card_id: copyId,
      base_amount: price,
      duration_minutes: durationMinutes,
    }),
  });
}
