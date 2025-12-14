import { configureStore } from '@reduxjs/toolkit';
import databaseReducer from './slices/databaseSlice';
import tableReducer from './slices/tableSlice';
import uiReducer from './slices/uiSlice';
import queryReducer from './slices/querySlice';

export const store = configureStore({
    reducer: {
        database: databaseReducer,
        table: tableReducer,
        ui: uiReducer,
        query: queryReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore Uint8Array in state
                ignoredActions: ['database/setCurrentDbData'],
                ignoredPaths: ['database.currentDbData'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
