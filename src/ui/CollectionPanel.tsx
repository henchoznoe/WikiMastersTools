import { useState } from 'react';
import {
  type Card,
  formatPrice,
  RARITIES,
  type Rarity,
  type ValuedCard,
} from '../domain/types';
import { loadCollection } from '../features/collection';
import { createListing } from '../features/market';
import type { PriceService } from '../features/prices';

interface Props {
  prices: PriceService;
  onCards: (cards: Card[]) => void;
}

export function CollectionPanel({ prices, onCards }: Props) {
  const [selected, setSelected] = useState<Rarity[]>([...RARITIES]);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [ranking, setRanking] = useState<ValuedCard[]>([]);
  const [saleCard, setSaleCard] = useState<Card | null>(null);
  const [salePrice, setSalePrice] = useState('');
  const [saleDuration, setSaleDuration] = useState('1440');

  async function load() {
    if (!selected.length) return;
    setBusy(true);
    setError('');
    setRanking([]);
    try {
      const result = await loadCollection(selected, (done, total) =>
        setProgress(`Collection : ${done}/${total} pages`),
      );
      onCards(result.cards);
      const cards = onlyMissing
        ? (
            await Promise.all(
              result.cards.map(async (card) => ({
                card,
                cached: await prices.isCached(card.id),
              })),
            )
          )
            .filter(({ cached }) => !cached)
            .map(({ card }) => card)
        : result.cards;
      const valued: ValuedCard[] = [];
      for (let index = 0; index < cards.length; index += 8) {
        const batch = cards.slice(index, index + 8);
        const values = await Promise.all(
          batch.map(async (card) => ({
            ...card,
            average: await prices.average(card),
          })),
        );
        valued.push(...values);
        setProgress(
          `Prix : ${Math.min(index + 8, cards.length)}/${cards.length} cartes`,
        );
      }
      setRanking(
        valued.toSorted((a, b) => (b.average ?? -1) - (a.average ?? -1)),
      );
      setProgress(
        `${valued.length} cartes classées${result.complete ? '' : ' · chargement partiel'}`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Chargement impossible.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function sell() {
    if (!saleCard) return;
    const price = Number(salePrice);
    const duration = Number(saleDuration);
    if (!Number.isInteger(price) || price < 1) {
      setError('Indique un prix entier positif.');
      return;
    }
    if (
      !window.confirm(
        `Mettre « ${saleCard.title} » en vente pour ${formatPrice(price)} ?`,
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      await createListing(saleCard, price, duration);
      setProgress(`Annonce créée : ${saleCard.title}`);
      setSaleCard(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Mise en vente impossible.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Collection">
      <p>Charger les cartes par rareté et classer leurs prix moyens.</p>
      <div className="rarities">
        {RARITIES.map((rarity) => (
          <label key={rarity}>
            <input
              type="checkbox"
              checked={selected.includes(rarity)}
              onChange={() =>
                setSelected((current) =>
                  current.includes(rarity)
                    ? current.filter((item) => item !== rarity)
                    : [...current, rarity],
                )
              }
            />
            {rarity}
          </label>
        ))}
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={onlyMissing}
          onChange={(event) => setOnlyMissing(event.target.checked)}
        />{' '}
        Prix non encore chargés seulement
      </label>
      <button type="button" disabled={busy || !selected.length} onClick={load}>
        Charger et classer
      </button>
      <p role="status">{progress}</p>
      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : null}
      {ranking.length ? (
        <ol className="ranking">
          {ranking.slice(0, 100).map((card) => (
            <li key={card.id}>
              <span>
                {card.title}{' '}
                <small>
                  {card.rarity} · {card.count}×
                </small>
              </span>
              <strong>{formatPrice(card.average)}</strong>
              <button
                type="button"
                className="small"
                disabled={busy || !card.ownedCardIds.length}
                onClick={() => {
                  setSaleCard(card);
                  setSalePrice(String(Math.round(card.average ?? 1)));
                }}
              >
                Vendre
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      {saleCard ? (
        <div className="sale-form">
          <h3>Vendre « {saleCard.title} »</h3>
          <label>
            Prix en WB{' '}
            <input
              type="number"
              min="1"
              step="1"
              value={salePrice}
              onChange={(event) => setSalePrice(event.target.value)}
            />
          </label>
          <label>
            Durée{' '}
            <select
              value={saleDuration}
              onChange={(event) => setSaleDuration(event.target.value)}
            >
              <option value="60">1 heure</option>
              <option value="1440">1 jour</option>
              <option value="10080">7 jours</option>
            </select>
          </label>
          <button type="button" disabled={busy} onClick={sell}>
            Confirmer la vente
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => setSaleCard(null)}
          >
            Annuler
          </button>
        </div>
      ) : null}
    </section>
  );
}
