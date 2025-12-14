import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/auto-icons', '@wxt-dev/module-react'],
  manifest: {
    name: 'Jeep SQLite Browser',
    version: '1.0.0',
    description: 'Browse and manage Jeep SQLite databases stored in IndexedDB',
    permissions: ['activeTab', 'storage'],
  },
  webExt: {
    startUrls: ["http://localhost:5173/tabs/home"],
  }
});
