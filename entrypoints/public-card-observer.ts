import {
  PUBLIC_CARD_EVENT,
  PUBLIC_MARKET_CARDS_EVENT,
} from '../src/content/messages';

export default defineUnlistedScript(() => {
  function announcePublicCard(url: string) {
    try {
      const parsed = new URL(url, location.href);
      if (
        !parsed.hostname.endsWith('.supabase.co') ||
        parsed.pathname !== '/rest/v1/cards'
      )
        return;
      const select = parsed.searchParams.get('select') ?? '';
      const match = (parsed.searchParams.get('id') ?? '').match(
        /^eq\.([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
      );
      if (select.split(',').includes('summary') && match?.[1]) {
        window.dispatchEvent(
          new CustomEvent(PUBLIC_CARD_EVENT, { detail: { cardId: match[1] } }),
        );
      }
    } catch {
      // Ignore URLs outside the inspected public catalogue card request.
    }
  }

  function isPublicMarketRequest(url: string, method: string): boolean {
    if (method.toUpperCase() !== 'GET') return false;
    try {
      const path = new URL(url, location.href).pathname;
      return (
        path === '/api/marketplace' ||
        /^\/api\/marketplace\/[0-9a-f-]{36}$/i.test(path)
      );
    } catch {
      return false;
    }
  }

  function announceMarketCards(value: unknown) {
    if (!value || typeof value !== 'object') return;
    const payload = value as Record<string, unknown>;
    const values = Array.isArray(payload.auctions)
      ? payload.auctions
      : Array.isArray(payload.listings)
        ? payload.listings
        : payload.auction
          ? [payload.auction]
          : [];
    const cards = values.slice(0, 200).flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const entry = item as Record<string, unknown>;
      if (!entry.card || typeof entry.card !== 'object') return [];
      const card = entry.card as Record<string, unknown>;
      const id = typeof card.id === 'string' ? card.id : entry.card_id;
      const title = card.wikipedia_title;
      if (typeof id !== 'string' || typeof title !== 'string') return [];
      return [
        {
          id,
          title,
          rarity: typeof card.rarity === 'string' ? card.rarity : null,
        },
      ];
    });
    if (cards.length)
      window.dispatchEvent(
        new CustomEvent(PUBLIC_MARKET_CARDS_EVENT, { detail: cards }),
      );
  }

  const original = window.fetch.bind(window);
  window.fetch = (...args) => {
    const input = args[0];
    const url = input instanceof Request ? input.url : String(input);
    const init = args[1];
    const method =
      init?.method ?? (input instanceof Request ? input.method : 'GET');
    announcePublicCard(url);
    const response = original(...args);
    if (isPublicMarketRequest(url, method)) {
      void response
        .then((result) => {
          if (result.ok)
            return result
              .clone()
              .json()
              .then(announceMarketCards)
              .catch(() => {});
        })
        .catch(() => {});
    }
    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (
    method,
    url,
    async?,
    username?,
    password?,
  ) {
    announcePublicCard(String(url));
    const args =
      async === undefined
        ? [method, url]
        : [method, url, async, username, password];
    Reflect.apply(originalOpen, this, args);
  };
});
