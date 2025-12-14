/**
 * Jeep SQLite Browser - Content Script
 * Injected into pages to access IndexedDB and extract Jeep SQLite databases
 */

import type { ContentMessage, MessageResponse } from '../types';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    /**
     * Scan IndexedDB for Jeep SQLite databases
     */
    async function scanForDatabases(): Promise<Array<{ idbName: string; stores: string[] }>> {
      const databases: Array<{ idbName: string; stores: string[] }> = [];

      try {
        // Get all IndexedDB databases
        const dbs = await indexedDB.databases();

        for (const dbInfo of dbs) {
          // Look for jeepSQLiteStore or similar patterns
          if (
            dbInfo.name &&
            (dbInfo.name.includes('jeepSqlite') ||
              dbInfo.name.includes('jeepSQLite') ||
              dbInfo.name.includes('localforage') ||
              dbInfo.name.includes('sqlite'))
          ) {
            try {
              const foundDbs = await scanDatabase(dbInfo.name);
              databases.push(...foundDbs);
            } catch (e) {
              console.log(`Could not scan ${dbInfo.name}:`, e);
            }
          }
        }

        // Also check for common Jeep SQLite store patterns
        const commonNames = ['jeepSqliteStore', 'jeepSQLiteStore'];
        for (const name of commonNames) {
          if (!dbs.some((db) => db.name === name)) {
            try {
              const foundDbs = await scanDatabase(name);
              databases.push(...foundDbs);
            } catch (e) {
              // Database doesn't exist
            }
          }
        }
      } catch (error) {
        console.error('Failed to scan databases:', error);
      }

      return databases;
    }

    /**
     * Scan a specific IndexedDB database for SQLite data
     */
    function scanDatabase(idbName: string): Promise<Array<{ idbName: string; stores: string[] }>> {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(idbName);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
          const db = request.result;
          const stores = Array.from(db.objectStoreNames);
          const databases: Array<{ idbName: string; stores: string[] }> = [];

          db.close();

          // Look for stores that might contain SQLite data
          const potentialStores = stores.filter(
            (s) => s.includes('databases') || s.includes('sqlite') || s === 'keyvaluepairs'
          );

          if (potentialStores.length > 0) {
            databases.push({
              idbName: idbName,
              stores: potentialStores,
            });
          }

          resolve(databases);
        };
      });
    }

    /**
     * Extract database binary data from IndexedDB
     */
    function extractDatabase(idbName: string, storeName: string, key: string): Promise<Uint8Array | null> {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(idbName);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
          const db = request.result;

          try {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const getRequest = store.get(key);

            getRequest.onsuccess = () => {
              db.close();
              const data = getRequest.result;

              if (data) {
                // Handle different data formats
                if (data instanceof Uint8Array) {
                  resolve(data);
                } else if (data instanceof ArrayBuffer) {
                  resolve(new Uint8Array(data));
                } else if (data && data.buffer instanceof ArrayBuffer) {
                  resolve(new Uint8Array(data.buffer));
                } else if (typeof data === 'object' && data.data) {
                  // Some implementations wrap the data
                  if (data.data instanceof Uint8Array) {
                    resolve(data.data);
                  } else if (Array.isArray(data.data)) {
                    resolve(new Uint8Array(data.data));
                  } else {
                    resolve(null);
                  }
                } else {
                  resolve(null);
                }
              } else {
                resolve(null);
              }
            };

            getRequest.onerror = () => {
              db.close();
              reject(getRequest.error);
            };
          } catch (e) {
            db.close();
            reject(e);
          }
        };
      });
    }

    /**
     * List all keys in a store
     */
    function listStoreKeys(idbName: string, storeName: string): Promise<string[]> {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(idbName);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
          const db = request.result;

          try {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const keysRequest = store.getAllKeys();

            keysRequest.onsuccess = () => {
              db.close();
              resolve(keysRequest.result.map((k) => String(k)));
            };

            keysRequest.onerror = () => {
              db.close();
              reject(keysRequest.error);
            };
          } catch (e) {
            db.close();
            reject(e);
          }
        };
      });
    }

    /**
     * Save modified database back to IndexedDB
     */
    function saveDatabase(idbName: string, storeName: string, key: string, data: Uint8Array): Promise<boolean> {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(idbName);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
          const db = request.result;

          try {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const putRequest = store.put(data, key);

            putRequest.onsuccess = () => {
              db.close();
              resolve(true);
            };

            putRequest.onerror = () => {
              db.close();
              reject(putRequest.error);
            };
          } catch (e) {
            db.close();
            reject(e);
          }
        };
      });
    }

    /**
     * Get hash of database in page context (lightweight - no data transfer)
     */
    function getDatabaseHash(idbName: string, storeName: string, key: string): Promise<string | null> {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(idbName);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
          const db = request.result;

          try {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const getRequest = store.get(key);

            getRequest.onsuccess = async () => {
              db.close();
              const data = getRequest.result;
              let buffer: ArrayBuffer | null = null;

              // Normalize data to ArrayBuffer
              if (data instanceof Uint8Array) {
                buffer = data.buffer;
              } else if (data instanceof ArrayBuffer) {
                buffer = data;
              } else if (data && data.buffer instanceof ArrayBuffer) {
                buffer = data.buffer;
              } else if (data && data.data) {
                if (data.data instanceof Uint8Array) {
                  buffer = data.data.buffer;
                } else if (Array.isArray(data.data)) {
                  buffer = new Uint8Array(data.data).buffer;
                }
              }

              if (buffer) {
                try {
                  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
                  const hashArray = Array.from(new Uint8Array(hashBuffer));
                  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
                  resolve(hashHex);
                } catch (e) {
                  resolve(null);
                }
              } else {
                resolve(null);
              }
            };

            getRequest.onerror = () => {
              db.close();
              reject(getRequest.error);
            };
          } catch (e) {
            db.close();
            reject(e);
          }
        };
      });
    }

    // Listen for messages from popup/devtools
    chrome.runtime.onMessage.addListener((message: ContentMessage, sender, sendResponse) => {
      (async () => {
        try {
          switch (message.action) {
            case 'ping': {
              // Health check - content script is loaded
              sendResponse({ success: true, data: 'pong' } as MessageResponse);
              break;
            }

            case 'scan': {
              const databases = await scanForDatabases();
              sendResponse({ success: true, data: databases } as MessageResponse);
              break;
            }

            case 'listKeys': {
              const keys = await listStoreKeys(message.idbName, message.storeName);
              sendResponse({ success: true, data: keys } as MessageResponse);
              break;
            }

            case 'extract': {
              const data = await extractDatabase(message.idbName, message.storeName, message.key);
              if (data) {
                // Convert Uint8Array to regular array for messaging
                sendResponse({ success: true, data: Array.from(data) } as MessageResponse);
              } else {
                sendResponse({ success: false, error: 'No data found' } as MessageResponse);
              }
              break;
            }

            case 'save': {
              const uint8Data = new Uint8Array(message.data);
              await saveDatabase(message.idbName, message.storeName, message.key, uint8Data);
              sendResponse({ success: true } as MessageResponse);
              break;
            }

            case 'getHash': {
              const hash = await getDatabaseHash(message.idbName, message.storeName, message.key);
              if (hash) {
                sendResponse({ success: true, data: hash } as MessageResponse);
              } else {
                sendResponse({ success: false, error: 'Could not compute hash' } as MessageResponse);
              }
              break;
            }

            default:
              sendResponse({ success: false, error: 'Unknown action' } as MessageResponse);
          }
        } catch (error) {
          sendResponse({ success: false, error: (error as Error).message } as MessageResponse);
        }
      })();

      // Return true to indicate async response
      return true;
    });

    console.log('Jeep SQLite Browser content script loaded');
  },
});
