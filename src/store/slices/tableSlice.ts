import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { TableInfo, TableData, ColumnInfo } from '../../types';
import { dbHandler } from '../../utils/database-handler';

interface TableState {
    tables: TableInfo[];
    currentTable: string | null;
    tableData: TableData | null;
    tableStructure: ColumnInfo[];
    page: number;
    pageSize: number;
}

const initialState: TableState = {
    tables: [],
    currentTable: null,
    tableData: null,
    tableStructure: [],
    page: 1,
    pageSize: 100,
};

// Async thunks for proper state updates
export const loadTablesAsync = createAsyncThunk('table/loadTables', async () => {
    return dbHandler.getTables();
});

export const selectTableAsync = createAsyncThunk(
    'table/selectTable',
    async (tableName: string, { getState }) => {
        const state = getState() as { table: TableState };
        const data = dbHandler.getTableData(tableName, state.table.pageSize, 0);
        const structure = dbHandler.getTableStructure(tableName);
        return { tableName, data, structure };
    }
);

export const loadTableDataAsync = createAsyncThunk(
    'table/loadTableData',
    async (_, { getState }) => {
        const state = getState() as { table: TableState };
        if (!state.table.currentTable) return null;
        const offset = (state.table.page - 1) * state.table.pageSize;
        return dbHandler.getTableData(state.table.currentTable, state.table.pageSize, offset);
    }
);

export const setPageAsync = createAsyncThunk(
    'table/setPage',
    async (page: number, { getState }) => {
        const state = getState() as { table: TableState };
        if (!state.table.currentTable) return { page, data: null };
        const offset = (page - 1) * state.table.pageSize;
        const data = dbHandler.getTableData(state.table.currentTable, state.table.pageSize, offset);
        return { page, data };
    }
);

export const refreshTablesAsync = createAsyncThunk(
    'table/refreshTables',
    async (_, { getState }) => {
        const state = getState() as { table: TableState };
        const tables = dbHandler.getTables();
        let data = null;
        if (state.table.currentTable) {
            const offset = (state.table.page - 1) * state.table.pageSize;
            data = dbHandler.getTableData(state.table.currentTable, state.table.pageSize, offset);
        }
        return { tables, data };
    }
);

const tableSlice = createSlice({
    name: 'table',
    initialState,
    reducers: {
        clearTables: (state) => {
            state.tables = [];
            state.currentTable = null;
            state.tableData = null;
            state.tableStructure = [];
            state.page = 1;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadTablesAsync.fulfilled, (state, action) => {
                state.tables = action.payload;
                state.currentTable = null;
                state.tableData = null;
                state.tableStructure = [];
                state.page = 1;
            })
            .addCase(selectTableAsync.fulfilled, (state, action) => {
                state.currentTable = action.payload.tableName;
                state.tableData = action.payload.data;
                state.tableStructure = action.payload.structure;
                state.page = 1;
            })
            .addCase(loadTableDataAsync.fulfilled, (state, action) => {
                if (action.payload) {
                    state.tableData = action.payload;
                }
            })
            .addCase(setPageAsync.fulfilled, (state, action) => {
                state.page = action.payload.page;
                if (action.payload.data) {
                    state.tableData = action.payload.data;
                }
            })
            .addCase(refreshTablesAsync.fulfilled, (state, action) => {
                state.tables = action.payload.tables;
                if (action.payload.data) {
                    state.tableData = action.payload.data;
                }
            });
    },
});

export const { clearTables } = tableSlice.actions;
export default tableSlice.reducer;
