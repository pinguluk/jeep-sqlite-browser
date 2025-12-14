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

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- Package manager: [pnpm](https://pnpm.io/) (recommended), [yarn](https://yarnpkg.com/), or [npm](https://www.npmjs.com/)

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

### Available Commands

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `pnpm dev`           | Start development with hot reload (Chrome)  |
| `pnpm dev:firefox`   | Start development with hot reload (Firefox) |
| `pnpm build`         | Build for production (Chrome)               |
| `pnpm build:firefox` | Build for production (Firefox)              |
| `pnpm zip`           | Build and create zip package (Chrome)       |
| `pnpm zip:firefox`   | Build and create zip package (Firefox)      |
| `pnpm compile`       | Run TypeScript type checking                |

### Development Mode

Run with hot reload:

```bash
pnpm dev
```

### Build for Production

```bash
pnpm build
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
├── types.ts                        # TypeScript interfaces
├── lib/
│   └── utils.ts                    # Utility functions (cn, etc.)
├── utils/
│   ├── helpers.ts                  # Utility functions
│   ├── settings.ts                 # Settings persistence (localStorage)
│   ├── database-handler.ts         # SQL.js wrapper
│   └── devtools-comm.ts            # DevTools communication
├── store/                          # Redux store
│   ├── store.ts                    # Store configuration
│   ├── hooks.ts                    # Typed dispatch/selector hooks
│   └── slices/
│       ├── databaseSlice.ts        # Database state
│       ├── tableSlice.ts           # Table state
│       ├── querySlice.ts           # SQL query state
│       └── uiSlice.ts              # UI state
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── Header.tsx                  # App header with controls
│   ├── Sidebar.tsx                 # Database/table browser
│   ├── Toolbar.tsx                 # Table actions toolbar
│   ├── DataTable.tsx               # Data grid with pagination
│   ├── StructureTab.tsx            # Table structure view
│   ├── QueryTab.tsx                # SQL query editor
│   ├── StatusBar.tsx               # Status information
│   ├── InsertEditModal.tsx         # Insert/edit row modal
│   └── DeleteConfirmModal.tsx      # Delete confirmation
├── styles/
│   └── globals.css                 # Global styles & Tailwind
└── entrypoints/
    ├── content.ts                  # Content script (page injection)
    ├── background.ts               # Background service worker
    ├── devtools.ts                 # DevTools panel registration
    └── devtools-panel/             # React DevTools panel
        ├── index.html
        ├── main.tsx
        └── PanelApp.tsx
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
