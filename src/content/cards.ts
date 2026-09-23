import { type Card, formatPrice, normalizedTitle } from '../domain/types';
import type { PriceService } from '../features/prices';

const style = `:host{display:inline-flex;vertical-align:middle;margin:4px}span{display:inline-block;padding:4px 8px;border-radius:999px;background:#102b27;color:#91f0d1;border:1px solid #2b6b5c;font:600 12px system-ui,sans-serif;white-space:nowrap}`;

function cardContainer(title: string): HTMLElement | null {
  const normalized = normalizedTitle(title);
  const nodes = document.querySelectorAll<HTMLElement>(
    'main img[alt], main a, main h2, main h3, main [data-card-id]',
  );
  for (const node of nodes) {
    if (node.closest('[data-wmt-host]')) continue;
    const value =
      node instanceof HTMLImageElement ? node.alt : node.textContent || '';
    if (normalizedTitle(value) !== normalized) continue;
    return (
      node.closest<HTMLElement>(
        'article, li, .cursor-pointer.rounded-2xl, [data-card-id]',
      ) ?? node.parentElement
    );
  }
  return null;
}

export async function placeCardBadges(
  cards: Card[],
  prices: PriceService,
): Promise<void> {
  for (const card of cards) {
    const container = cardContainer(card.title);
    if (
      !container ||
      container.querySelector(`[data-wmt-card="${CSS.escape(card.id)}"]`)
    )
      continue;
    const host = document.createElement('span');
    host.dataset.wmtCard = card.id;
    host.dataset.wmtHost = 'price';
    host.style.cssText = 'position:absolute;top:4px;right:4px;z-index:60;';
    const shadow = host.attachShadow({ mode: 'closed' });
    const sheet = document.createElement('style');
    sheet.textContent = style;
    const badge = document.createElement('span');
    badge.textContent = 'Prix moyen…';
    shadow.append(sheet, badge);
    container.append(host);
    const value = await prices.average(card);
    badge.textContent = `Moyenne ${formatPrice(value)}`;
    if (value === null) badge.title = 'Aucune vente connue pour cette rareté.';
  }
}
