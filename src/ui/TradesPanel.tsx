import { useState } from 'react';
import { formatPrice, type Trade } from '../domain/types';
import type { PriceService } from '../features/prices';
import { loadTrades, selectTrades, valueSide } from '../features/trades';

const MAX_TRADES = 10;
const MAX_CARD_NAMES = 5;

interface ValuedTrade {
  trade: Trade;
  initiatorTotal: number;
  recipientTotal: number;
}

export function TradesPanel({ prices }: { prices: PriceService }) {
  const [items, setItems] = useState<ValuedTrade[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [includeHistory, setIncludeHistory] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);

  async function load() {
    setBusy(true);
    setError('');
    setItems([]);
    setTotalMatches(0);
    setHasLoaded(false);
    try {
      const trades = await loadTrades();
      const matches = selectTrades(trades, includeHistory);
      setTotalMatches(matches.length);
      const valued: ValuedTrade[] = [];
      for (const trade of matches.slice(0, MAX_TRADES)) {
        const [initiatorTotal, recipientTotal] = await Promise.all([
          valueSide(trade.initiator, prices),
          valueSide(trade.recipient, prices),
        ]);
        valued.push({ trade, initiatorTotal, recipientTotal });
        setItems([...valued]);
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Échanges indisponibles.',
      );
    } finally {
      setBusy(false);
      setHasLoaded(true);
    }
  }

  return (
    <section aria-label="Échanges">
      <p>Estimation des cartes et des WikiBidous de chaque côté.</p>
      <label>
        <input
          type="checkbox"
          checked={includeHistory}
          disabled={busy}
          onChange={(event) => {
            setIncludeHistory(event.target.checked);
            setItems([]);
            setTotalMatches(0);
            setHasLoaded(false);
          }}
        />{' '}
        Inclure l’historique
      </label>
      <button type="button" disabled={busy} onClick={load}>
        {busy
          ? `Estimation… ${items.length}/${Math.min(totalMatches, MAX_TRADES)}`
          : 'Estimer les échanges'}
      </button>
      {totalMatches > MAX_TRADES ? (
        <p>
          Seuls les {MAX_TRADES} premiers échanges sont affichés sur{' '}
          {totalMatches}.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : null}
      <div className="trade-list">
        {items.map(({ trade, initiatorTotal, recipientTotal }) => (
          <article key={trade.id}>
            <small>{trade.status}</small>
            <div className="trade-sides">
              <div>
                <strong>{trade.initiator.username}</strong>
                <p>{formatPrice(initiatorTotal)}</p>
                <ul>
                  {trade.initiator.cards
                    .slice(0, MAX_CARD_NAMES)
                    .map((card) => (
                      <li key={card.ownedCardIds[0] ?? card.id}>
                        {card.title} · {card.rarity}
                      </li>
                    ))}
                  {trade.initiator.cards.length > MAX_CARD_NAMES ? (
                    <li>
                      + {trade.initiator.cards.length - MAX_CARD_NAMES} cartes
                    </li>
                  ) : null}
                </ul>
              </div>
              <div>
                <strong>{trade.recipient.username}</strong>
                <p>{formatPrice(recipientTotal)}</p>
                <ul>
                  {trade.recipient.cards
                    .slice(0, MAX_CARD_NAMES)
                    .map((card) => (
                      <li key={card.ownedCardIds[0] ?? card.id}>
                        {card.title} · {card.rarity}
                      </li>
                    ))}
                  {trade.recipient.cards.length > MAX_CARD_NAMES ? (
                    <li>
                      + {trade.recipient.cards.length - MAX_CARD_NAMES} cartes
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>
      {hasLoaded && !busy && !error && items.length === 0 ? (
        <p>
          {totalMatches === 0
            ? includeHistory
              ? 'Aucun échange dans l’historique.'
              : 'Aucun échange en cours.'
            : 'Aucun échange estimé.'}
        </p>
      ) : null}
    </section>
  );
}
