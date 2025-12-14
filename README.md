# Jeep SQLite Browser

A Chrome DevTools extension for browsing and managing Jeep SQLite databases stored in IndexedDB.

## Features

- 🔍 **Database Detection** - Automatically scans for Jeep SQLite databases in IndexedDB
- 📊 **Table Browser** - View all tables with row counts and structure
- 📝 **Data Viewer** - Browse table data with pagination
- 🔧 **SQL Query Editor** - Execute custom SQL queries
- 💾 **Export Tools** - Export as SQL dumps or CSV files
- 🎨 **DevTools Integration** - Seamless integration with Chrome DevTools

## Installation

### From Source

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Build the extension:**
   ```bash
   pnpm build
   ```

3. **Load in Chrome:**
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
3. Click the "Jeep SQLite" tab
4. Select a database from the sidebar
5. Browse tables, run queries, or export data

## Technology Stack

- **Framework**: [WXT](https://wxt.dev/) - Modern extension framework
- **UI**: React 19 with TypeScript
- **Database**: [SQL.js](https://github.com/sql-js/sql.js/) - SQLite compiled to WebAssembly
- **Build Tool**: Vite (via WXT)

## Project Structure

```
src/
├── types.ts                 # TypeScript interfaces
├── utils/
│   ├── helpers.ts          # Utility functions
│   └── database-handler.ts # SQL.js wrapper
└── entrypoints/
    ├── content.ts          # Content script
    ├── background.ts       # Background worker
    ├── devtools.ts         # DevTools entry
    └── panel/              # React DevTools panel
```

## License

MIT

## Credits

Converted from legacy JavaScript implementation to modern TypeScript + React architecture.
