/**
 * DatabaseHandler - Handles sql.js initialization and database operations
 * TypeScript port of db-handler.js
 */

import initSqlJs, { Database, SqlJsStatic } from "sql.js";
import type {
  TableInfo,
  ColumnInfo,
  TableData,
  QueryResult,
} from "../types/types";
import { loadSettings, WASM_SOURCE_LABELS } from "./settings";
import { sendToContentScript, getInspectedTabId } from "./devtools-comm";

export class DatabaseHandler {
  private db: Database | null = null;
  private SQL: SqlJsStatic | null = null;
  private initialized = false;
  private currentDbName: string | null = null;
  private currentDbData: Uint8Array | null = null;
  private currentWasmSource: string | null = null;
  private websiteWasmBinary: Uint8Array | null = null;

  /**
   * Initialize sql.js with WebAssembly
   * @param wasmSource - Optional override, uses settings if not provided
   */
  async init(wasmSource?: string): Promise<void> {
    const settings = await loadSettings();
    const source = wasmSource ?? settings.wasmSource;

    // Skip if already initialized with same source
    if (this.initialized && this.currentWasmSource === source) return;

    try {
      let wasmBinary: Uint8Array | null = null;
      let wasmUrl: string | null = null;

      if (source === "auto") {
        // Auto mode: try to get website's WASM via content script
        try {
          const inspectedTabId = getInspectedTabId();
          const response = await sendToContentScript({
            action: "getWebsiteWasm",
            tabId: inspectedTabId,
          });

          if (response?.success && response.data?.wasm) {
            console.log(
              `Auto mode: Found website WASM at ${response.data.path}`
            );
            wasmBinary = new Uint8Array(response.data.wasm);
            this.websiteWasmBinary = wasmBinary;
          } else {
            console.log(
              "Auto mode: Website WASM not found, falling back to bundled"
            );
            wasmUrl = chrome.runtime.getURL("sql-wasm.wasm");
          }
        } catch (error) {
          console.log(
            "Auto mode: Failed to get website WASM, falling back to bundled",
            error
          );
          wasmUrl = chrome.runtime.getURL("sql-wasm.wasm");
        }
      } else if (source !== "auto" && source in WASM_SOURCE_LABELS) {
        // Use locally bundled WASM file based on version
        const filename = WASM_SOURCE_LABELS[source]; // e.g., "sql-wasm-1.11.0.wasm"
        wasmUrl = chrome.runtime.getURL(filename);
      } else {
        // Fallback to default bundled
        wasmUrl = chrome.runtime.getURL("sql-wasm-1.13.0.wasm");
      }

      // Initialize sql.js with WASM (either binary or URL)
      if (wasmBinary) {
        this.SQL = await initSqlJs({
          wasmBinary: wasmBinary.buffer as ArrayBuffer,
        });
      } else {
        this.SQL = await initSqlJs({
          locateFile: () => wasmUrl!,
        });
      }

      this.initialized = true;
      this.currentWasmSource = source;
      console.log(
        `sql.js initialized successfully with WASM source: ${source}${
          wasmUrl ? ` (${wasmUrl})` : " (website binary)"
        }`
      );
    } catch (error) {
      console.error("Failed to initialize sql.js:", error);
      throw new Error("Failed to initialize SQLite engine");
    }
  }

  /**
   * Reinitialize sql.js with a different WASM source
   * This will close the current database
   */
  async reinit(wasmSource: string): Promise<void> {
    // Close current database if open
    this.close();

    // Reset initialization state
    this.initialized = false;
    this.SQL = null;
    // this.currentWasmSource = null;

    // Initialize with new source
    await this.init(wasmSource);
  }

  /**
   * Get current WASM source
   */
  getWasmSource(): string | null {
    return this.currentWasmSource;
  }

  /**
   * Load a database from binary data
   */
  loadDatabase(name: string, data: Uint8Array): boolean {
    if (!this.initialized || !this.SQL) {
      throw new Error("sql.js not initialized");
    }

    try {
      // Close existing database if open
      if (this.db) {
        this.db.close();
      }

      // Create new database from binary data
      this.db = new this.SQL.Database(data);
      this.currentDbName = name;
      this.currentDbData = data;
      console.log(`Loaded database: ${name}`);
      return true;
    } catch (error) {
      console.error("Failed to load database:", error);
      throw new Error("Failed to load database: " + (error as Error).message);
    }
  }

  /**
   * Get list of all tables in current database
   */
  getTables(): TableInfo[] {
    if (!this.db) return [];

    try {
      const result = this.db.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);

      if (!result.length) return [];

      const tables = result[0].values.map((row: any[]) => {
        const tableName = row[0] as string;
        // Get row count
        const countResult = this.db!.exec(
          `SELECT COUNT(*) FROM "${tableName}"`
        );
        const rowCount = countResult.length
          ? (countResult[0].values[0][0] as number)
          : 0;
        return { name: tableName, rowCount };
      });

      return tables;
    } catch (error) {
      console.error("Failed to get tables:", error);
      return [];
    }
  }

  /**
   * Get table structure/schema
   */
  getTableStructure(tableName: string): ColumnInfo[] {
    if (!this.db) return [];

    try {
      const result = this.db.exec(`PRAGMA table_info("${tableName}")`);
      if (!result.length) return [];

      return result[0].values.map((row: any[]) => ({
        cid: row[0] as number,
        name: row[1] as string,
        type: (row[2] as string) || "TEXT",
        notnull: row[3] === 1,
        dflt_value: row[4],
        pk: (row[5] as number) > 0,
      }));
    } catch (error) {
      console.error("Failed to get table structure:", error);
      return [];
    }
  }

  /**
   * Get table data with pagination
   */
  getTableData(tableName: string, limit = 50, offset = 0): TableData {
    if (!this.db) return { columns: [], rows: [], total: 0 };

    try {
      // Get total count
      const countResult = this.db.exec(`SELECT COUNT(*) FROM "${tableName}"`);
      const total = countResult.length
        ? (countResult[0].values[0][0] as number)
        : 0;

      // Get data with pagination
      const result = this.db.exec(
        `SELECT * FROM "${tableName}" LIMIT ${limit} OFFSET ${offset}`
      );

      if (!result.length) {
        // Get column names even if no data
        const structure = this.getTableStructure(tableName);
        return {
          columns: structure.map((col) => col.name),
          rows: [],
          total,
        };
      }

      return {
        columns: result[0].columns,
        rows: result[0].values,
        total,
      };
    } catch (error) {
      console.error("Failed to get table data:", error);
      return { columns: [], rows: [], total: 0 };
    }
  }

  /**
   * Execute a SQL query
   */
  executeQuery(sql: string): QueryResult {
    if (!this.db) {
      return { success: false, error: "No database loaded" };
    }

    try {
      const trimmedSql = sql.trim().toUpperCase();

      // Check if it's a SELECT query
      if (trimmedSql.startsWith("SELECT") || trimmedSql.startsWith("PRAGMA")) {
        const result = this.db.exec(sql);
        if (!result.length) {
          return { success: true, columns: [], rows: [] };
        }
        return {
          success: true,
          columns: result[0].columns,
          rows: result[0].values,
        };
      } else {
        // For INSERT, UPDATE, DELETE, etc.
        this.db.run(sql);
        const changes = this.db.getRowsModified();
        return {
          success: true,
          rowsAffected: changes,
        };
      }
    } catch (error) {
      console.error("Query error:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Insert a row into a table
   */
  insertRow(tableName: string, data: Record<string, any>): QueryResult {
    if (!this.db) {
      return { success: false, error: "No database loaded" };
    }

    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map(() => "?").join(", ");

      const sql = `INSERT INTO "${tableName}" (${columns
        .map((c) => `"${c}"`)
        .join(", ")}) VALUES (${placeholders})`;

      const stmt = this.db.prepare(sql);
      stmt.run(values);
      stmt.free();

      return { success: true };
    } catch (error) {
      console.error("Insert error:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update a row in a table
   */
  updateRow(
    tableName: string,
    data: Record<string, any>,
    where: Record<string, any>
  ): QueryResult {
    if (!this.db) {
      return { success: false, error: "No database loaded" };
    }

    try {
      const setClauses = Object.keys(data)
        .map((col) => `"${col}" = ?`)
        .join(", ");
      const whereClauses = Object.keys(where)
        .map((col) => `"${col}" = ?`)
        .join(" AND ");

      const sql = `UPDATE "${tableName}" SET ${setClauses} WHERE ${whereClauses}`;
      const values = [...Object.values(data), ...Object.values(where)];

      const stmt = this.db.prepare(sql);
      stmt.run(values);
      stmt.free();

      return { success: true };
    } catch (error) {
      console.error("Update error:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Delete a row from a table
   */
  deleteRow(tableName: string, where: Record<string, any>): QueryResult {
    if (!this.db) {
      return { success: false, error: "No database loaded" };
    }

    try {
      const whereClauses = Object.keys(where)
        .map((col) => `"${col}" = ?`)
        .join(" AND ");
      const sql = `DELETE FROM "${tableName}" WHERE ${whereClauses}`;

      const stmt = this.db.prepare(sql);
      stmt.run(Object.values(where));
      stmt.free();

      return { success: true };
    } catch (error) {
      console.error("Delete error:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Export data as SQL
   */
  exportAsSQL(tableName: string | null = null): string {
    if (!this.db) return "";

    try {
      let sql = "";
      const tables = tableName
        ? [{ name: tableName, rowCount: 0 }]
        : this.getTables();

      for (const table of tables) {
        // Get CREATE statement
        const createResult = this.db.exec(
          `SELECT sql FROM sqlite_master WHERE type='table' AND name='${table.name}'`
        );
        if (createResult.length && createResult[0].values[0][0]) {
          sql += createResult[0].values[0][0] + ";\n\n";
        }

        // Get INSERT statements
        const data = this.db.exec(`SELECT * FROM "${table.name}"`);
        if (data.length && data[0].values.length) {
          const columns = data[0].columns
            .map((c: string) => `"${c}"`)
            .join(", ");
          for (const row of data[0].values) {
            const values = row
              .map((v: any) => {
                if (v === null) return "NULL";
                if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
                return v;
              })
              .join(", ");
            sql += `INSERT INTO "${table.name}" (${columns}) VALUES (${values});\n`;
          }
          sql += "\n";
        }
      }

      return sql;
    } catch (error) {
      console.error("Export error:", error);
      return "";
    }
  }

  /**
   * Export data as CSV
   */
  exportAsCSV(tableName: string): string {
    if (!this.db || !tableName) return "";

    try {
      const data = this.db.exec(`SELECT * FROM "${tableName}"`);
      if (!data.length) return "";

      const rows = [data[0].columns.join(",")];
      for (const row of data[0].values) {
        const csvRow = row
          .map((v: any) => {
            if (v === null) return "";
            if (
              typeof v === "string" &&
              (v.includes(",") || v.includes('"') || v.includes("\n"))
            ) {
              return `"${v.replace(/"/g, '""')}"`;
            }
            return v;
          })
          .join(",");
        rows.push(csvRow);
      }

      return rows.join("\n");
    } catch (error) {
      console.error("CSV export error:", error);
      return "";
    }
  }

  /**
   * Get current database as binary data
   */
  exportBinary(): Uint8Array | null {
    if (!this.db) return null;
    return this.db.export();
  }

  /**
   * Close the database
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.currentDbName = null;
      this.currentDbData = null;
    }
  }
}

// Create global instance
export const dbHandler = new DatabaseHandler();
