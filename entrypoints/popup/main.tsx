import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  DEFAULT_SETTINGS,
  getSettings,
  type Settings,
  saveSettings,
} from '../../src/settings';
import './popup.css';

function Popup() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);
  function update(key: keyof Settings, value: boolean) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    void saveSettings(next);
  }
  return (
    <main>
      <div className="brand">
        <span className="logo">W</span>
        <div>
          <h1>WikiMasters Tools</h1>
          <p>Prix et outils de collection</p>
        </div>
      </div>
      <section>
        <h2>Affichage</h2>
        <label>
          <input
            type="checkbox"
            checked={settings.showCollectionPrices}
            onChange={(event) =>
              update('showCollectionPrices', event.target.checked)
            }
          />{' '}
          Prix sur la collection
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.showMarketplacePrices}
            onChange={(event) =>
              update('showMarketplacePrices', event.target.checked)
            }
          />{' '}
          Prix sur le marché
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.recapNormalPacks}
            onChange={(event) =>
              update('recapNormalPacks', event.target.checked)
            }
          />{' '}
          Récap après une ouverture normale
        </label>
      </section>
      <section>
        <h2>Plusieurs comptes</h2>
        <p>
          Utilise un profil Chrome ou Dia distinct par compte. Installe
          l’extension dans chaque profil. Les onglets d’un même profil partagent
          la connexion.
        </p>
      </section>
      <p className="warning">
        Extension non officielle. WikiMasters interdit l’automatisation et les
        multi-comptes ; une sanction est possible.
      </p>
      <a
        href="https://www.wiki-masters.com/rules"
        target="_blank"
        rel="noreferrer"
      >
        Règles du jeu ↗
      </a>
    </main>
  );
}

const mount = document.getElementById('root');
if (mount) createRoot(mount).render(<Popup />);
