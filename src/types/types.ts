/**
 * Core TypeScript types for Jeep SQLite Browser
 */

// Database Types
export interface DatabaseInfo {
  idbName: string;
  storeName: string;
  key: string;
}

export interface TableInfo {
  name: string;
  rowCount: number;
}

export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: boolean;
  dflt_value: any;
  pk: boolean;
}

export interface TableData {
  columns: string[];
  rows: any[][];
  total: number;
}

export interface QueryResult {
  success: boolean;
  columns?: string[];
  rows?: any[][];
  rowsAffected?: number;
  error?: string;
}

// Message Types for Chrome Runtime
export interface ScanMessage {
  action: "scan";
}

export interface ListKeysMessage {
  action: "listKeys";
  idbName: string;
  storeName: string;
}

export interface ExtractMessage {
  action: "extract";
  idbName: string;
  storeName: string;
  key: string;
}

export interface SaveMessage {
  action: "save";
  idbName: string;
  storeName: string;
  key: string;
  data: number[];
}

export interface GetHashMessage {
  action: "getHash";
  idbName: string;
  storeName: string;
  key: string;
}

export interface PingMessage {
  action: "ping";
}

export interface GetWebsiteWasmMessage {
  action: "getWebsiteWasm";
}

export type ContentMessage =
  | ScanMessage
  | ListKeysMessage
  | ExtractMessage
  | SaveMessage
  | GetHashMessage
  | PingMessage
  | GetWebsiteWasmMessage;

export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// App State Types
export interface AppState {
  databases: DatabaseInfo[];
  currentDb: DatabaseInfo | null;
  currentTable: string | null;
  tableData: TableData | null;
  tableStructure: ColumnInfo[] | null;
  page: number;
  pageSize: number;
  totalRows: number;
  isLoading: boolean;
  error: string | null;
}

// Modal Types
export type ModalMode = "insert" | "edit" | null;

export interface ModalState {
  mode: ModalMode;
  isOpen: boolean;
  editRowIndex?: number;
  deleteRowIndex?: number;
}

// Export Types
export type ExportFormat = "sql" | "csv";
