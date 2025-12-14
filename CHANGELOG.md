# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-14

### Added

- **Modern React + TypeScript Architecture**

  - Complete rewrite from legacy JavaScript to TypeScript
  - React 19 with functional components and hooks
  - WXT framework for extension building

- **State Management**

  - Redux Toolkit with dedicated slices (database, table, ui, query)
  - Custom hooks for typed dispatch/selector

- **UI Components (shadcn/ui)**

  - Button, Dialog, Tabs, Checkbox, Input, Table, ScrollArea
  - DataTable with TanStack React Table
  - AlertDialog for confirmations

- **Features**

  - Database scanning and detection
  - Table browsing with row counts
  - Data viewing with pagination (top and bottom navigation)
  - Insert new records
  - Edit existing records
  - Delete records with confirmation
  - SQL query execution with results
  - Export as SQL or CSV
  - Structure tab showing column info

- **Auto-Refresh & Stale Detection**

  - Fast hash-based change detection (computed in page context)
  - Auto-refresh toggle with 500ms polling
  - Stale warning indicator with click-to-refresh
  - Race condition prevention with `isReloading` flag

- **Dark/Light Mode**

  - Theme toggle in header
  - Browser preference detection on first load
  - Preference persistence to localStorage
  - Dark mode scrollbar styling

- **Settings Persistence**

  - Dark mode preference saved
  - Auto-refresh preference saved
  - LocalStorage with `jeep-sqlite-browser-settings` key

- **Header Enhancements**

  - Version display (v1.0.0)
  - About dialog with project info
  - Ko-fi donate button
  - Database/row count summary

- **UX Improvements**
  - Cursor pointer on all interactive elements
  - Scrolling within table container (fixed header/pagination)
  - Visible row count badges in sidebar
  - Overflow handling for long table names

### Technical Details

- Build size: ~1.24 MB
- SQL.js WebAssembly for SQLite operations
- Content script communicates with page via injected functions
- Background script routes messages between DevTools and content script
