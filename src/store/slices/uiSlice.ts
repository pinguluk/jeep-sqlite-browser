import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { scanDatabases, loadDatabase } from './databaseSlice';

type ModalMode = 'insert' | 'edit' | null;
type ActiveTab = 'data' | 'structure' | 'query';

interface UiState {
    loading: boolean;
    status: string;
    activeTab: ActiveTab;
    modalMode: ModalMode;
    modalOpen: boolean;
    editRowIndex: number | null;
    editRowData: Record<string, any>;
    confirmDeleteOpen: boolean;
    deleteRowIndex: number | null;
}

const initialState: UiState = {
    loading: false,
    status: 'Ready',
    activeTab: 'data',
    modalMode: null,
    modalOpen: false,
    editRowIndex: null,
    editRowData: {},
    confirmDeleteOpen: false,
    deleteRowIndex: null,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setStatus: (state, action: PayloadAction<string>) => {
            state.status = action.payload;
        },
        setActiveTab: (state, action: PayloadAction<ActiveTab>) => {
            state.activeTab = action.payload;
        },
        openInsertModal: (state, action: PayloadAction<Record<string, any>>) => {
            state.modalMode = 'insert';
            state.modalOpen = true;
            state.editRowIndex = null;
            state.editRowData = action.payload;
        },
        openEditModal: (state, action: PayloadAction<{ rowIndex: number; rowData: Record<string, any> }>) => {
            state.modalMode = 'edit';
            state.modalOpen = true;
            state.editRowIndex = action.payload.rowIndex;
            state.editRowData = action.payload.rowData;
        },
        closeModal: (state) => {
            state.modalMode = null;
            state.modalOpen = false;
            state.editRowIndex = null;
            state.editRowData = {};
        },
        setEditRowData: (state, action: PayloadAction<Record<string, any>>) => {
            state.editRowData = action.payload;
        },
        openDeleteConfirm: (state, action: PayloadAction<number>) => {
            state.confirmDeleteOpen = true;
            state.deleteRowIndex = action.payload;
        },
        closeDeleteConfirm: (state) => {
            state.confirmDeleteOpen = false;
            state.deleteRowIndex = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(scanDatabases.pending, (state) => {
                state.loading = true;
                state.status = 'Scanning...';
            })
            .addCase(scanDatabases.fulfilled, (state, action) => {
                state.loading = false;
                state.status = `Found ${action.payload.length} database(s)`;
            })
            .addCase(scanDatabases.rejected, (state) => {
                state.loading = false;
                state.status = 'Scan failed';
            })
            .addCase(loadDatabase.pending, (state) => {
                state.status = 'Loading...';
            })
            .addCase(loadDatabase.fulfilled, (state) => {
                state.status = 'Database loaded';
            })
            .addCase(loadDatabase.rejected, (state) => {
                state.status = 'Load failed';
            });
    },
});

export const {
    setStatus,
    setActiveTab,
    openInsertModal,
    openEditModal,
    closeModal,
    setEditRowData,
    openDeleteConfirm,
    closeDeleteConfirm,
} = uiSlice.actions;
export default uiSlice.reducer;
