# Jeep SQLite Browser - Example App

A demo Vue 3 + Vite + Capacitor application showing how to use `@capacitor-community/sqlite` with the Jeep SQLite web implementation. This app creates a SQLite database that you can inspect with the Jeep SQLite Browser extension.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open the browser, navigate to `http://localhost:5173`, and:

1. Add some users using the form
2. Open Chrome DevTools (F12)
3. Click the **"Jeep SQLite Browser"** tab
4. You should see the `user_db` database with the `users` table

## What it Demonstrates

- **Web SQLite Setup**: Uses `jeep-sqlite` custom element for web compatibility
- **CRUD Operations**: Create, Read, Update, Delete users
- **IndexedDB Storage**: Data persists in browser's IndexedDB via Jeep SQLite

## Files

| File                     | Description                             |
| ------------------------ | --------------------------------------- |
| `src/main.ts`            | Initializes jeep-sqlite web component   |
| `src/services/sqlite.ts` | SQLite service with database operations |
| `src/App.vue`            | Main UI with user CRUD form             |

## Tech Stack

- Vue 3 + TypeScript
- Vite
- @capacitor-community/sqlite (with jeep-sqlite for web)
