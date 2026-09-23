import { useState } from 'react';
import {
  formatPrice,
  groupValuedCards,
  type ValuedCard,
} from '../domain/types';
import { openPacks, type PackProgress } from '../features/packs';
import type { PriceService } from '../features/prices';

export function PacksPanel({ prices }: { prices: PriceService }) {
  const [quantity, setQuantity] = useState('1');
  const [all, setAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<PackProgress | null>(null);
  const [valued, setValued] = useState<ValuedCard[]>([]);

  async function open() {
    const count = all ? 'all' : Number(quantity);
    if (
      count !== 'all' &&
      (!Number.isInteger(count) || count < 1 || count > 1000)
    )
      return;
    if (
      !window.confirm(
        `Ouvrir ${all ? 'tous les paquets disponibles' : `${count} paquet(s)`} ? WikiMasters interdit l’automatisation et peut sanctionner un compte.`,
      )
    )
      return;
    setBusy(true);
    setValued([]);
    setProgress(null);
    try {
      const result = await openPacks(count, setProgress);
      setProgress({ ...result });
      const cards = await Promise.all(
        result.cards.map(async (card) => ({
          ...card,
          average: await prices.average(card),
        })),
      );
      setValued(
        cards.toSorted((a, b) => (b.average ?? -1) - (a.average ?? -1)),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Paquets">
      <p>
        Ouverture séquentielle. Arrêt immédiat en cas de vérification, refus ou
        limite du jeu.
      </p>
      <div className="row">
        <label>
          Quantité{' '}
          <input
            type="number"
            min="1"
            max="1000"
            step="1"
            value={quantity}
            disabled={all || busy}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={all}
            disabled={busy}
            onChange={(event) => setAll(event.target.checked)}
          />{' '}
          Tous
        </label>
      </div>
      <button
        type="button"
        disabled={
          busy ||
          (!all &&
            (!Number.isInteger(Number(quantity)) ||
              Number(quantity) < 1 ||
              Number(quantity) > 1000))
        }
        onClick={open}
      >
        {busy ? 'Ouverture…' : 'Ouvrir'}
      </button>
      {progress ? (
        <div role="status">
          <p>
            {progress.opened} paquet(s) ouvert(s) · {progress.cards.length}{' '}
            carte(s)
            {progress.remaining !== null
              ? ` · ${progress.remaining} restant(s)`
              : ''}
          </p>
          {progress.stoppedReason ? (
            <p className="error">{progress.stoppedReason}</p>
          ) : null}
        </div>
      ) : null}
      {valued.length ? (
        <>
          <h3>Récapitulatif par prix moyen</h3>
          <ol className="ranking">
            {groupValuedCards(valued).map((card) => (
              <li key={card.id}>
                <span>
                  {card.title}{' '}
                  <small>
                    {card.rarity} · {card.count}×
                  </small>
                </span>
                <strong>{formatPrice(card.average)}</strong>
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </section>
  );
}
