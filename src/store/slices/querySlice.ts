import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { dbHandler } from '../../utils/database-handler';

interface QueryResult {
    success: boolean;
    columns?: string[];
    rows?: any[][];
    rowsAffected?: number;
    error?: string;
}

interface QueryState {
    sqlQuery: string;
    queryResults: QueryResult | { message: string } | { error: string } | null;
}

const initialState: QueryState = {
    sqlQuery: '',
    queryResults: null,
};

const querySlice = createSlice({
    name: 'query',
    initialState,
    reducers: {
        setSqlQuery: (state, action: PayloadAction<string>) => {
            state.sqlQuery = action.payload;
        },
        clearQuery: (state) => {
            state.sqlQuery = '';
            state.queryResults = null;
        },
        executeQuery: (state) => {
            if (!state.sqlQuery.trim()) {
                state.queryResults = { error: 'Enter a SQL query' };
                return;
            }

            const result = dbHandler.executeQuery(state.sqlQuery);

            if (result.success) {
                if (result.columns) {
                    state.queryResults = result;
                } else {
                    state.queryResults = { message: `${result.rowsAffected} row(s) affected` };
                }
            } else {
                state.queryResults = { error: result.error || 'Query failed' };
            }
        },
    },
});

export const { setSqlQuery, clearQuery, executeQuery } = querySlice.actions;
export default querySlice.reducer;
