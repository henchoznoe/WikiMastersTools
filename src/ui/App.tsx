import { useEffect, useState } from 'react';
import { placeCardBadges } from '../content/cards';
import {
  type Card,
  formatPrice,
  groupValuedCards,
  type PriceSummary,
  RARITIES,
  type ValuedCard,
} from '../domain/types';
import type { Listing } from '../features/market';
import type { NormalPackRecap } from '../features/normal-packs';
import type { PriceService } from '../features/prices';
import { CollectionPanel } from './CollectionPanel';
import { MarketPanel } from './MarketPanel';
import { PacksPanel } from './PacksPanel';
import { TradesPanel } from './TradesPanel';

interface Props {
  path: string;
  prices: PriceService;
  normalRecap: NormalPackRecap;
  inspectedCardId: string | null;
}

function page(
  path: string,
): 'packs' | 'collection' | 'trades' | 'market' | 'global' | null {
  if (path.startsWith('/pulls')) return 'packs';
  if (path.startsWith('/collection')) return 'collection';
  if (path.startsWith('/trades')) return 'trades';
  if (path.startsWith('/marketplace')) return 'market';
  if (path.startsWith('/global-collection')) return 'global';
  return null;
}

export function App({ path, prices, normalRecap, inspectedCardId }: Props) {
  const current = page(path);
  const [open, setOpen] = useState(false);
  const [normalCards, setNormalCards] = useState<ValuedCard[]>([]);
  const [inspection, setInspection] = useState<PriceSummary | null>(null);

  useEffect(() => normalRecap.subscribe(setNormalCards), [normalRecap]);
  useEffect(() => {
    if (!inspectedCardId) return;
    let active = true;
    prices.get(inspectedCardId).then((value) => {
      if (active) setInspection(value);
    });
    return () => {
      active = false;
    };
  }, [inspectedCardId, prices]);

  if (!current) return null;
  const names = {
    packs: 'Paquets',
    collection: 'Collection',
    trades: 'Échanges',
    market: 'Marché',
    global: 'Toutes les cartes',
  };
  function collectionCards(cards: Card[]) {
    void placeCardBadges(cards, prices);
  }
  function marketListings(items: Listing[]) {
    void placeCardBadges(
      items.map((item) => item.card),
      prices,
    );
  }

  return (
    <div className="wmt-app" data-wmt-host="toolbar">
      <button
        type="button"
        className="wmt-trigger"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="wmt-mark">W</span> Outils · {names[current]}
      </button>
      {open ? (
        <div className="wmt-panel">
          <header>
            <strong>WikiMasters Tools</strong>
            <button
              type="button"
              className="ghost"
              aria-label="Fermer les outils"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </header>
          {current === 'collection' ? (
            <CollectionPanel prices={prices} onCards={collectionCards} />
          ) : null}
          {current === 'packs' ? <PacksPanel prices={prices} /> : null}
          {current === 'trades' ? <TradesPanel prices={prices} /> : null}
          {current === 'market' ? (
            <MarketPanel prices={prices} onListings={marketListings} />
          ) : null}
          {current === 'global' ? (
            <section>
              <p>Sélectionne une carte du catalogue pour voir ses moyennes.</p>
              {inspection ? (
                <div className="inspection">
                  <h3>Carte inspectée</h3>
                  {RARITIES.map((rarity) =>
                    inspection.averages[rarity] ? (
                      <p key={rarity}>
                        {rarity} :{' '}
                        {formatPrice(inspection.averages[rarity] ?? null)}
                      </p>
                    ) : null,
                  )}
                </div>
              ) : null}
            </section>
          ) : null}
          <footer>
            Extension non officielle · automatisation et multi-comptes interdits
            par les règles du jeu.
          </footer>
        </div>
      ) : null}
      {current === 'packs' && normalCards.length ? (
        <div className="wmt-panel recap">
          <header>
            <strong>Dernier paquet · prix moyens</strong>
            <button
              type="button"
              className="ghost"
              aria-label="Fermer le récapitulatif"
              onClick={() => setNormalCards([])}
            >
              ✕
            </button>
          </header>
          <ol className="ranking">
            {groupValuedCards(normalCards).map((card) => (
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
        </div>
      ) : null}
    </div>
  );
}
