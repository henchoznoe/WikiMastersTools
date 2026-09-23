import { ApiError, apiJson } from '../api/client';
import { type Card, parseCard, record } from '../domain/types';

export interface PackProgress {
  opened: number;
  cards: Card[];
  remaining: number | null;
  stoppedReason: string | null;
}

export async function openPacks(
  quantity: number | 'all',
  onProgress: (progress: PackProgress) => void,
  request: (path: string, init?: RequestInit) => Promise<unknown> = apiJson,
): Promise<PackProgress> {
  if (
    quantity !== 'all' &&
    (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000)
  ) {
    throw new Error('Choisir entre 1 et 1000 paquets.');
  }
  const result: PackProgress = {
    opened: 0,
    cards: [],
    remaining: null,
    stoppedReason: null,
  };
  const limit = quantity === 'all' ? 1000 : quantity;
  for (let index = 0; index < limit; index += 1) {
    let response: Record<string, unknown>;
    try {
      response = record(await request('/api/packs/open', { method: 'POST' }));
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 0;
      result.stoppedReason =
        status === 403 || status === 429
          ? 'Vérification ou limite imposée par WikiMasters. Ouverture arrêtée.'
          : error instanceof Error
            ? error.message
            : 'Ouverture interrompue.';
      break;
    }
    if (
      response.rate_limited ||
      response.captcha ||
      response.verification_required ||
      response.requires_verification
    ) {
      result.stoppedReason =
        'Vérification ou limite imposée par WikiMasters. Ouverture arrêtée.';
      break;
    }
    const cards = (Array.isArray(response.cards) ? response.cards : [])
      .map((value) => parseCard(value))
      .filter((card): card is Card => card !== null);
    if (!cards.length) {
      result.stoppedReason = 'Réponse inattendue du jeu. Ouverture arrêtée.';
      break;
    }
    result.opened += 1;
    result.cards.push(...cards);
    const remaining = Number(response.packs_remaining);
    result.remaining = Number.isFinite(remaining) ? remaining : null;
    onProgress({ ...result, cards: [...result.cards] });
    if (result.remaining === 0) break;
  }
  if (
    quantity === 'all' &&
    result.opened === 1000 &&
    (result.remaining ?? 1) > 0
  ) {
    result.stoppedReason = 'Limite de sécurité de 1000 paquets atteinte.';
  }
  return result;
}
