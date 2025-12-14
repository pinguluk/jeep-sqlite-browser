# Jeep SQLite Browser

A Chrome DevTools extension for browsing and managing Jeep SQLite databases stored in IndexedDB.

[![License](https://img.shields.io/badge/license-Custom-blue.svg)](LICENSE)
[![Ko-fi](https://img.shields.io/badge/Support-Ko--fi-ff5f5f.svg)](https://ko-fi.com/pinguluk)

## Features

- 🔍 **Database Detection** - Automatically scans for Jeep SQLite databases in IndexedDB
- 📊 **Table Browser** - View all tables with row counts and structure
- 📝 **Data Viewer** - Browse table data with pagination and CRUD operations
- ✏️ **Edit & Insert** - Modify existing records or insert new ones
- 🗑️ **Delete Records** - Remove records with confirmation
- 🔧 **SQL Query Editor** - Execute custom SQL queries with results display
- 💾 **Export Tools** - Export as SQL dumps or CSV files
- 🌙 **Dark/Light Mode** - Toggle themes with preference persistence
- 🔄 **Auto-Refresh** - Monitor for database changes with configurable refresh
- 🎨 **Modern UI** - Built with shadcn/ui components

## Installation

### From Source

1. **Clone the repository:**

   ```bash
   git clone https://github.com/pinguluk/jeep-sqlite-browser.git
   cd jeep-sqlite-browser
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Build the extension:**

   ```bash
   pnpm build
   ```

4. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `.output/chrome-mv3` directory

## Development

### Development Mode

Run with hot reload:

```bash
pnpm dev
```

### Build for Production

```bash
pnpm build
```

### TypeScript Check

```bash
pnpm compile
```

## Usage

1. Navigate to a website using Jeep SQLite (e.g., Ionic/Capacitor apps)
2. Open Chrome DevTools (F12)
3. Click the **"Jeep SQLite Browser"** tab
4. Select a database from the sidebar
5. Browse tables, run queries, edit data, or export

## Technology Stack

- **Framework**: [WXT](https://wxt.dev/) - Modern extension framework
- **UI**: [React 19](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/)
- **State**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Tables**: [TanStack React Table](https://tanstack.com/table/v8)
- **Database**: [SQL.js](https://github.com/sql-js/sql.js/) - SQLite compiled to WebAssembly
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Build Tool**: [Vite](https://vite.dev/) (via WXT)

## Project Structure

```
src/
├── types.ts                     # TypeScript interfaces
├── utils/
│   ├── helpers.ts              # Utility functions
│   ├── settings.ts             # Settings persistence
│   ├── database-handler.ts     # SQL.js wrapper
│   └── devtools-comm.ts        # DevTools communication
├── store/                      # Redux store
│   ├── store.ts
│   ├── hooks.ts
│   └── slices/                 # Redux slices
├── components/                 # React components
│   ├── ui/                     # shadcn/ui components
│   └── ...                     # App components
└── entrypoints/
    ├── content.ts              # Content script
    ├── background.ts           # Background worker
    ├── devtools.ts             # DevTools entry
    └── devtools-panel/         # React DevTools panel
```

## Support

If you find this extension useful, consider [supporting on Ko-fi](https://ko-fi.com/pingluk) ☕

## License

This project is licensed under a Custom Attribution + NonCommercial + Substantial-Changes-Only Redistribution License. See [LICENSE](LICENSE) for details.

**Key points:**

- ✅ Personal, educational, and research use allowed
- ✅ Fork and contribute via pull requests
- ❌ No commercial use
- ❌ No redistribution without substantial changes
- ❌ No publishing to extension stores without permission

## Credits

Original project by [pinguluk](https://github.com/pinguluk).
