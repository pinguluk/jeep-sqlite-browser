import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";

const sqliteConnection = new SQLiteConnection(CapacitorSQLite);

let db: SQLiteDBConnection | null = null;

export const useSQLite = () => {
  const initPlugin = async () => {
    try {
      if (Capacitor.getPlatform() === "web") {
        // We wait for the element to be ready (it was created in main.ts)
        await customElements.whenDefined("jeep-sqlite");
        await sqliteConnection.initWebStore();
      }
    } catch (err) {
      console.error("Error initializing SQLite plugin", err);
    }
  };

  const getDatabase = async () => {
    if (db) return db;

    try {
      db = await sqliteConnection.createConnection(
        "user_db",
        false,
        "no-encryption",
        1,
        false
      );
      await db.open();

      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        );
      `;
      await db.execute(createTableQuery);
      return db;
    } catch (err) {
      console.error("Error getting database", err);
      throw err;
    }
  };

  const getUsers = async () => {
    const database = await getDatabase();
    const result = await database.query("SELECT * FROM users");
    return result.values || [];
  };

  const addUser = async (name: string) => {
    const database = await getDatabase();
    await database.run("INSERT INTO users (name) VALUES (?)", [name]);
    if (Capacitor.getPlatform() === "web") {
      await sqliteConnection.saveToStore("user_db");
    }
  };

  const updateUser = async (id: number, name: string) => {
    const database = await getDatabase();
    await database.run("UPDATE users SET name = ? WHERE id = ?", [name, id]);
    if (Capacitor.getPlatform() === "web") {
      await sqliteConnection.saveToStore("user_db");
    }
  };

  const deleteUser = async (id: number) => {
    const database = await getDatabase();
    await database.run("DELETE FROM users WHERE id = ?", [id]);
    if (Capacitor.getPlatform() === "web") {
      await sqliteConnection.saveToStore("user_db");
    }
  };

  return {
    initPlugin,
    getUsers,
    addUser,
    updateUser,
    deleteUser,
  };
};
