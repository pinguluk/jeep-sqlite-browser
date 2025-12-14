import { createSlice, PayloadAction } from '@reduxjs/toolkit';
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

const tableSlice = createSlice({
    name: 'table',
    initialState,
    reducers: {
        loadTables: (state) => {
            state.tables = dbHandler.getTables();
            state.currentTable = null;
            state.tableData = null;
            state.tableStructure = [];
            state.page = 1;
        },
        selectTable: (state, action: PayloadAction<string>) => {
            state.currentTable = action.payload;
            state.page = 1;
            state.tableData = dbHandler.getTableData(action.payload, state.pageSize, 0);
            state.tableStructure = dbHandler.getTableStructure(action.payload);
        },
        loadTableData: (state) => {
            if (!state.currentTable) return;
            const offset = (state.page - 1) * state.pageSize;
            state.tableData = dbHandler.getTableData(state.currentTable, state.pageSize, offset);
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.page = action.payload;
            if (state.currentTable) {
                const offset = (action.payload - 1) * state.pageSize;
                state.tableData = dbHandler.getTableData(state.currentTable, state.pageSize, offset);
            }
        },
        refreshTables: (state) => {
            state.tables = dbHandler.getTables();
            if (state.currentTable) {
                const offset = (state.page - 1) * state.pageSize;
                state.tableData = dbHandler.getTableData(state.currentTable, state.pageSize, offset);
            }
        },
        clearTables: (state) => {
            state.tables = [];
            state.currentTable = null;
            state.tableData = null;
            state.tableStructure = [];
            state.page = 1;
        },
    },
});

export const { loadTables, selectTable, loadTableData, setPage, refreshTables, clearTables } = tableSlice.actions;
export default tableSlice.reducer;
