import { createRoot, type Root } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { injectScript } from 'wxt/utils/inject-script';
import { apiJson } from '../src/api/client';
import { placeCardBadges } from '../src/content/cards';
import {
  PUBLIC_CARD_EVENT,
  PUBLIC_MARKET_CARDS_EVENT,
  parsePublicCardMessage,
  parsePublicMarketCards,
} from '../src/content/messages';
import {
  type Card,
  parseCard,
  parseCollectionEntry,
  record,
} from '../src/domain/types';
import { loadListingDetail, loadListings } from '../src/features/market';
import { NormalPackRecap } from '../src/features/normal-packs';
import { PriceService } from '../src/features/prices';
import { getSettings } from '../src/settings';
import { App } from '../src/ui/App';
import css from '../src/ui/content.css?inline';

export default defineContentScript({
  matches: ['https://www.wiki-masters.com/*'],
  runAt: 'document_start',
  async main(ctx) {
    void injectScript('/public-card-observer.js');
    const prices = new PriceService(browser.storage.local);
    const normalRecap = new NormalPackRecap(prices);
    let inspectedCardId: string | null = null;
    let host: HTMLElement | null = null;
    let root: Root | null = null;
    let currentPath = '';
    let renderedCardId: string | null = null;
    let renderScheduled = false;

    function render() {
      if (!ctx.isValid || !document.body) return;
      const path = location.pathname;
      const relevant =
        /^\/(pulls|collection|trades|marketplace|global-collection)/.test(path);
      if (!relevant) {
        root?.unmount();
        root = null;
        host?.remove();
        host = null;
        currentPath = path;
        return;
      }
      const heading = document.querySelector('main h1');
      if (!heading?.parentElement) return;
      let created = false;
      if (!host?.isConnected) {
        root?.unmount();
        host = document.createElement('div');
        host.dataset.wmtHost = 'toolbar';
        host.style.cssText =
          'display:block;margin:10px 0;position:relative;z-index:20;';
        const shadow = host.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = css;
        const app = document.createElement('div');
        shadow.append(style, app);
        root = createRoot(app);
        heading.parentElement.append(host);
        created = true;
      }
      if (host.parentElement !== heading.parentElement)
        heading.parentElement.append(host);
      if (
        created ||
        path !== currentPath ||
        inspectedCardId !== renderedCardId
      ) {
        root?.render(
          <App
            path={path}
            prices={prices}
            normalRecap={normalRecap}
            inspectedCardId={inspectedCardId}
          />,
        );
        renderedCardId = inspectedCardId;
      }
      if (path !== currentPath) {
        currentPath = path;
        void loadVisibleCards(path);
        if (path.startsWith('/pulls')) void prepareNormalRecap();
      }
    }

    function scheduleRender() {
      if (renderScheduled) return;
      renderScheduled = true;
      requestAnimationFrame(() => {
        renderScheduled = false;
        render();
      });
    }

    async function loadVisibleCards(path: string) {
      try {
        const settings = await getSettings();
        let cards: Card[] = [];
        if (settings.showCollectionPrices && path.startsWith('/collection')) {
          const payload = record(
            await apiJson('/api/my-collection?sort=rarity&page=0&stats=1'),
          );
          cards = (Array.isArray(payload.collection) ? payload.collection : [])
            .map(parseCollectionEntry)
            .filter((card): card is Card => card !== null);
        } else if (
          settings.showMarketplacePrices &&
          path.startsWith('/marketplace/')
        ) {
          const id = path.split('/')[2];
          const listing = id ? await loadListingDetail(id) : null;
          cards = listing ? [listing.card] : [];
        } else if (
          settings.showMarketplacePrices &&
          path.startsWith('/marketplace')
        ) {
          cards = (await loadListings()).map((listing) => listing.card);
        }
        if (ctx.isValid && path === location.pathname) {
          await new Promise((resolve) => setTimeout(resolve, 350));
          void placeCardBadges(cards, prices);
        }
      } catch {
        // The toolbar remains usable when an endpoint is unavailable.
      }
    }

    async function prepareNormalRecap() {
      const settings = await getSettings();
      if (settings.recapNormalPacks) void normalRecap.prepare();
    }

    function onNativePackClick(event: MouseEvent) {
      if (!location.pathname.startsWith('/pulls')) return;
      const target =
        event.target instanceof Element ? event.target.closest('button') : null;
      if (!target || target.closest('[data-wmt-host]')) return;
      if (
        /ouvrir/i.test(target.textContent ?? '') &&
        !/tout/i.test(target.textContent ?? '')
      ) {
        void getSettings().then((settings) => {
          if (settings.recapNormalPacks) void normalRecap.afterNativeOpen();
        });
      }
    }

    function onPublicCard(event: Event) {
      const message =
        event instanceof CustomEvent
          ? parsePublicCardMessage(event.detail)
          : null;
      if (!message) return;
      inspectedCardId = message.cardId;
      scheduleRender();
    }

    function onPublicMarketCards(event: Event) {
      if (
        !location.pathname.startsWith('/marketplace') ||
        !(event instanceof CustomEvent)
      )
        return;
      const cards = parsePublicMarketCards(event.detail)
        .map((item) =>
          parseCard({
            id: item.id,
            wikipedia_title: item.title,
            rarity: item.rarity,
          }),
        )
        .filter((item): item is Card => item !== null);
      if (!cards.length) return;
      void getSettings().then((settings) => {
        if (settings.showMarketplacePrices) {
          setTimeout(() => {
            void placeCardBadges(cards, prices);
          }, 400);
        }
      });
    }

    document.addEventListener('click', onNativePackClick, true);
    window.addEventListener(PUBLIC_CARD_EVENT, onPublicCard);
    window.addEventListener(PUBLIC_MARKET_CARDS_EVENT, onPublicMarketCards);
    const observer = new MutationObserver(scheduleRender);
    const start = () => {
      observer.observe(document.body, { childList: true, subtree: true });
      scheduleRender();
    };
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
    ctx.onInvalidated(() => {
      observer.disconnect();
      document.removeEventListener('click', onNativePackClick, true);
      window.removeEventListener(PUBLIC_CARD_EVENT, onPublicCard);
      window.removeEventListener(
        PUBLIC_MARKET_CARDS_EVENT,
        onPublicMarketCards,
      );
      root?.unmount();
      host?.remove();
    });
  },
});
