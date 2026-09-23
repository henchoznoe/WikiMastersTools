import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'WikiMasters Tools',
    description:
      'Prix moyens et outils de collection pour WikiMasters. Projet non officiel.',
    permissions: ['storage'],
    host_permissions: ['https://www.wiki-masters.com/*'],
    web_accessible_resources: [
      {
        resources: ['public-card-observer.js'],
        matches: ['https://www.wiki-masters.com/*'],
      },
    ],
  },
});
