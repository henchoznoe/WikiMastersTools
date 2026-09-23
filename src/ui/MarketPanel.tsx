import { useState } from 'react';
import { formatPrice } from '../domain/types';
import {
  type Listing,
  loadListingDetail,
  loadListings,
} from '../features/market';
import type { PriceService } from '../features/prices';

export function MarketPanel({
  prices,
  onListings,
}: {
  prices: PriceService;
  onListings: (items: Listing[]) => void;
}) {
  const [items, setItems] = useState<(Listing & { average: number | null })[]>(
    [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setBusy(true);
    setError('');
    try {
      const match = location.pathname.match(/^\/marketplace\/([\w-]+)$/);
      const listings = match
        ? [await loadListingDetail(match[1] ?? '')]
        : await loadListings();
      const valid = listings.filter((item): item is Listing => item !== null);
      onListings(valid);
      const valued = await Promise.all(
        valid.map(async (item) => ({
          ...item,
          average: await prices.average(item.card),
        })),
      );
      setItems(valued);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Marché indisponible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Marché">
      <p>Prix moyens par rareté pour les annonces.</p>
      <button type="button" disabled={busy} onClick={load}>
        {busy ? 'Chargement…' : 'Voir les prix moyens'}
      </button>
      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : null}
      {items.length ? (
        <ol className="ranking">
          {items.map((item) => (
            <li key={item.id}>
              <span>
                {item.card.title}{' '}
                <small>
                  {item.card.rarity} · annonce {formatPrice(item.amount)}
                </small>
              </span>
              <strong>{formatPrice(item.average)}</strong>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
