import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { DatabaseInfo } from '../../types/types';
import { sendToContentScript, getInspectedTabId } from '../../utils/devtools-comm';
import { dbHandler } from '../../utils/database-handler';
import { computeHash, formatBytes } from '../../utils/helpers';

interface DatabaseState {
    databases: DatabaseInfo[];
    currentDb: DatabaseInfo | null;
    currentDbData: number[] | null;
    currentHash: string | null;
    dbInfo: string;
    staleWarning: boolean;
    autoRefresh: boolean;
    isReloading: boolean; // Prevents race condition during refresh
}

const initialState: DatabaseState = {
    databases: [],
    currentDb: null,
    currentDbData: null,
    currentHash: null,
    dbInfo: '',
    staleWarning: false,
    autoRefresh: false,
    isReloading: false,
};

// Async thunks
export const scanDatabases = createAsyncThunk(
    'database/scan',
    async () => {
        const inspectedTabId = getInspectedTabId();
        const response = await sendToContentScript({ action: 'scan', tabId: inspectedTabId });

        if (!response?.success || !response.data) {
            return [];
        }

        const dbList: DatabaseInfo[] = [];
        for (const dbInfo of response.data) {
            for (const storeName of dbInfo.stores) {
                const keysResponse = await sendToContentScript({
                    action: 'listKeys',
                    tabId: inspectedTabId,
                    idbName: dbInfo.idbName,
                    storeName,
                });

                if (keysResponse?.success && keysResponse.data) {
                    for (const key of keysResponse.data) {
                        dbList.push({ idbName: dbInfo.idbName, storeName, key });
                    }
                }
            }
        }
        return dbList;
    }
);

export const loadDatabase = createAsyncThunk(
    'database/load',
    async (db: DatabaseInfo) => {
        const inspectedTabId = getInspectedTabId();
        const response = await sendToContentScript({
            action: 'extract',
            tabId: inspectedTabId,
            ...db,
        });

        if (!response?.success || !response.data) {
            throw new Error('Failed to extract database');
        }

        const data = new Uint8Array(response.data);
        dbHandler.loadDatabase(db.key, data);
        const hash = await computeHash(data);

        return {
            db,
            data: Array.from(data),
            hash,
            dbInfo: `${db.key} (${formatBytes(data.length)})`,
        };
    }
);

// Reload database data without resetting state (for stale refresh)
export const reloadDatabaseData = createAsyncThunk(
    'database/reloadData',
    async (_, { getState }) => {
        const state = getState() as { database: DatabaseState };
        const { currentDb } = state.database;

        if (!currentDb) throw new Error('No database selected');

        const inspectedTabId = getInspectedTabId();
        const response = await sendToContentScript({
            action: 'extract',
            tabId: inspectedTabId,
            ...currentDb,
        });

        if (!response?.success || !response.data) {
            throw new Error('Failed to reload database');
        }

        const data = new Uint8Array(response.data);
        dbHandler.loadDatabase(currentDb.key, data);
        const hash = await computeHash(data);

        return { hash, dbInfo: `${currentDb.key} (${formatBytes(data.length)})` };
    }
);

export const checkForChanges = createAsyncThunk(
    'database/checkChanges',
    async (_, { getState }) => {
        const state = getState() as { database: DatabaseState };
        const { currentDb, currentHash, isReloading } = state.database;

        // Skip if no database, no hash, or currently reloading
        if (!currentDb || !currentHash || isReloading) return { changed: false };

        const inspectedTabId = getInspectedTabId();

        // Use lightweight hash check - computes hash in page context, no data transfer
        const response = await sendToContentScript({
            action: 'getHash',
            tabId: inspectedTabId,
            idbName: currentDb.idbName,
            storeName: currentDb.storeName,
            key: currentDb.key,
        });

        if (!response?.success || !response.data) return { changed: false };

        const newHash = response.data as string;
        return { changed: newHash !== currentHash, newHash };
    }
);

export const saveToIndexedDB = createAsyncThunk(
    'database/save',
    async (_, { getState }) => {
        const state = getState() as { database: DatabaseState };
        const { currentDb } = state.database;

        if (!currentDb) throw new Error('No database selected');

        const data = dbHandler.exportBinary();
        if (!data) throw new Error('No data to save');

        const inspectedTabId = getInspectedTabId();
        await sendToContentScript({
            action: 'save',
            tabId: inspectedTabId,
            idbName: currentDb.idbName,
            storeName: currentDb.storeName,
            key: currentDb.key,
            data: Array.from(data),
        });

        const hash = await computeHash(data);
        return { hash };
    }
);

const databaseSlice = createSlice({
    name: 'database',
    initialState,
    reducers: {
        setAutoRefresh: (state, action: PayloadAction<boolean>) => {
            state.autoRefresh = action.payload;
        },
        setStaleWarning: (state, action: PayloadAction<boolean>) => {
            state.staleWarning = action.payload;
        },
        clearDatabase: (state) => {
            state.currentDb = null;
            state.currentDbData = null;
            state.currentHash = null;
            state.dbInfo = '';
            state.staleWarning = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(scanDatabases.fulfilled, (state, action) => {
                state.databases = action.payload;
            })
            .addCase(loadDatabase.fulfilled, (state, action) => {
                state.currentDb = action.payload.db;
                state.currentDbData = action.payload.data;
                state.currentHash = action.payload.hash;
                state.dbInfo = action.payload.dbInfo;
                state.staleWarning = false;
                state.isReloading = false;
            })
            .addCase(reloadDatabaseData.pending, (state) => {
                state.isReloading = true;
                state.staleWarning = false; // Clear warning immediately when starting reload
            })
            .addCase(reloadDatabaseData.fulfilled, (state, action) => {
                state.currentHash = action.payload.hash;
                state.dbInfo = action.payload.dbInfo;
                state.staleWarning = false;
                state.isReloading = false;
            })
            .addCase(reloadDatabaseData.rejected, (state) => {
                state.isReloading = false;
            })
            .addCase(checkForChanges.fulfilled, (state, action) => {
                // Only set stale warning if not currently reloading
                if (action.payload.changed && !state.isReloading) {
                    state.staleWarning = true;
                }
            })
            .addCase(saveToIndexedDB.fulfilled, (state, action) => {
                state.currentHash = action.payload.hash;
                state.staleWarning = false;
            });
    },
});

export const { setAutoRefresh, setStaleWarning, clearDatabase } = databaseSlice.actions;
export default databaseSlice.reducer;
